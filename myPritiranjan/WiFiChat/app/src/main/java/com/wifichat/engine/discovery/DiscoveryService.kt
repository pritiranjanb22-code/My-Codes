package com.wifichat.engine.discovery

import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.IBinder
import android.util.Log
import com.wifichat.data.model.PeerInfo
import javax.jmdns.JmDNS
import javax.jmdns.ServiceInfo
import java.net.InetAddress

class DiscoveryService : Service() {
    private var nsdManager: NsdManager? = null
    private var jmDns: JmDNS? = null
    private var serviceInfo: NsdServiceInfo? = null
    private var registrationListener: NsdManager.RegistrationListener? = null
    private var discoveryListener: NsdManager.DiscoveryListener? = null
    private val discoveredPeers = mutableMapOf<String, PeerInfo>()
    private var localPeerInfo: PeerInfo? = null
    private val peerListeners = mutableListOf<(PeerInfo) -> Unit>()
    private var isDiscovering = false
    
    override fun onCreate() {
        super.onCreate()
        nsdManager = getSystemService(Context.NSD_SERVICE) as NsdManager
    }
    
    fun start(localPeer: PeerInfo) {
        this.localPeerInfo = localPeer
        registerNsdService()
        registerJmDnsService()
        startDiscovery()
    }
    
    private fun registerNsdService() {
        val serviceInfo = NsdServiceInfo().apply {
            serviceName = "WiFiChat_${localPeerInfo?.username}"
            serviceType = "_wifichat._tcp."
            port = localPeerInfo?.port ?: 8888
            setAttribute("username", localPeerInfo?.username ?: "")
            setAttribute("userId", localPeerInfo?.id ?: "")
            setAttribute("displayName", localPeerInfo?.displayName ?: "")
            setAttribute("capabilities", localPeerInfo?.capabilities?.toString() ?: "")
        }
        
        this.serviceInfo = serviceInfo
        
        registrationListener = object : NsdManager.RegistrationListener {
            override fun onServiceRegistered(serviceInfo: NsdServiceInfo) {
                Log.d("DiscoveryService", "NSD Service registered: ${serviceInfo.serviceName}")
            }
            
            override fun onRegistrationFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
                Log.e("DiscoveryService", "NSD Registration failed: $errorCode")
            }
            
            override fun onServiceUnregistered(serviceInfo: NsdServiceInfo) {
                Log.d("DiscoveryService", "NSD Service unregistered")
            }
            
            override fun onUnregistrationFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
                Log.e("DiscoveryService", "NSD Unregistration failed: $errorCode")
            }
        }
        
        nsdManager?.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD, registrationListener!!)
    }
    
    private fun registerJmDnsService() {
        try {
            jmDns = JmDNS.create(InetAddress.getLocalHost())
            val serviceInfo = ServiceInfo.create(
                "_wifichat._tcp.local.",
                "WiFiChat_${localPeerInfo?.username}",
                localPeerInfo?.port ?: 8888,
                0,
                0,
                false,
                mapOf(
                    "username" to localPeerInfo?.username ?: "",
                    "userId" to localPeerInfo?.id ?: "",
                    "displayName" to localPeerInfo?.displayName ?: ""
                )
            )
            jmDns?.registerService(serviceInfo)
            Log.d("DiscoveryService", "JmDNS Service registered")
        } catch (e: Exception) {
            Log.e("DiscoveryService", "JmDNS registration failed", e)
        }
    }
    
    private fun startDiscovery() {
        if (isDiscovering) return
        isDiscovering = true
        
        discoveryListener = object : NsdManager.DiscoveryListener {
            override fun onDiscoveryStarted(serviceType: String) {
                Log.d("DiscoveryService", "Discovery started")
            }
            
            override fun onServiceFound(serviceInfo: NsdServiceInfo) {
                if (!serviceInfo.serviceName.startsWith("WiFiChat_")) return
                
                nsdManager?.resolveService(serviceInfo, object : NsdManager.ResolveListener {
                    override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
                        Log.e("DiscoveryService", "Resolve failed: $errorCode")
                    }
                    
                    override fun onServiceResolved(resolvedInfo: NsdServiceInfo) {
                        val peer = PeerInfo(
                            id = resolvedInfo.attributes?.get("userId") ?: "",
                            username = resolvedInfo.attributes?.get("username") ?: "",
                            displayName = resolvedInfo.attributes?.get("displayName") ?: "",
                            ipAddress = resolvedInfo.host.hostAddress,
                            port = resolvedInfo.port,
                            publicKey = "", // Would be exchanged during handshake
                            capabilities = com.wifichat.data.model.PeerCapabilities()
                        )
                        
                        if (peer.id != localPeerInfo?.id) {
                            discoveredPeers[peer.id] = peer
                            notifyPeerFound(peer)
                        }
                    }
                })
            }
            
            override fun onServiceLost(serviceInfo: NsdServiceInfo) {
                val username = serviceInfo.serviceName.removePrefix("WiFiChat_")
                discoveredPeers.values.find { it.username == username }?.let { peer ->
                    discoveredPeers.remove(peer.id)
                    notifyPeerLost(peer)
                }
            }
            
            override fun onDiscoveryStopped(serviceType: String) {
                Log.d("DiscoveryService", "Discovery stopped")
                isDiscovering = false
            }
            
            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e("DiscoveryService", "Discovery start failed: $errorCode")
                isDiscovering = false
            }
            
            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e("DiscoveryService", "Discovery stop failed: $errorCode")
            }
        }
        
        nsdManager?.discoverServices("_wifichat._tcp.", NsdManager.PROTOCOL_DNS_SD, discoveryListener!!)
    }
    
    private fun notifyPeerFound(peer: PeerInfo) {
        peerListeners.forEach { it(peer) }
    }
    
    private fun notifyPeerLost(peer: PeerInfo) {
        peerListeners.forEach { it(peer.copy()) } // Pass copy to indicate lost
    }
    
    fun addPeerListener(listener: (PeerInfo) -> Unit) {
        peerListeners.add(listener)
    }
    
    fun removePeerListener(listener: (PeerInfo) -> Unit) {
        peerListeners.remove(listener)
    }
    
    fun getDiscoveredPeers(): List<PeerInfo> = discoveredPeers.values.toList()
    
    fun stop() {
        serviceInfo?.let {
            nsdManager?.unregisterService(registrationListener!!)
        }
        discoveryListener?.let {
            nsdManager?.stopServiceDiscovery(it)
        }
        jmDns?.unregisterAllServices()
        try {
            jmDns?.close()
        } catch (e: Exception) {
            Log.e("DiscoveryService", "Error closing JmDNS", e)
        }
        discoveredPeers.clear()
        peerListeners.clear()
    }
    
    override fun onDestroy() {
        stop()
        super.onDestroy()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}