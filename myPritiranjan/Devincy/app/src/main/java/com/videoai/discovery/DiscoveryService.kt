package com.videoai.discovery

import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.IBinder
import android.util.Log
import com.videoai.mcp.auth.AuthManager
import javax.jmdns.JmDNS
import javax.jmdns.ServiceInfo

class DiscoveryService : Service() {
    private var nsdManager: NsdManager? = null
    private var jmDns: JmDNS? = null
    private var serviceInfo: NsdServiceInfo? = null
    private var registrationListener: NsdManager.RegistrationListener? = null
    private var authManager: AuthManager? = null
    
    override fun onCreate() {
        super.onCreate()
        authManager = AuthManager(this)
        startDiscovery()
    }
    
    private fun startDiscovery() {
        nsdManager = getSystemService(Context.NSD_SERVICE) as NsdManager
        
        // Register with Android NSD (for local network discovery)
        registerNsdService()
        
        // Also register with JmDNS for better cross-platform support
        registerJmDnsService()
    }
    
    private fun registerNsdService() {
        val serviceInfo = NsdServiceInfo().apply {
            serviceName = "VideoAI Phone"
            serviceType = "_videoai._tcp."
            port = authManager!!.getPort()
            setAttribute("version", "1.0")
            setAttribute("token", authManager!!.getOrCreateToken())
            setAttribute("name", "VideoAI Phone")
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
            jmDns = JmDNS.create()
            val serviceInfo = ServiceInfo.create(
                "_videoai._tcp.local.",
                "VideoAI Phone",
                authManager!!.getPort(),
                0,
                0,
                false,
                mapOf(
                    "version" to "1.0",
                    "token" to authManager!!.getOrCreateToken(),
                    "name" to "VideoAI Phone"
                )
            )
            jmDns?.registerService(serviceInfo)
            Log.d("DiscoveryService", "JmDNS Service registered")
        } catch (e: Exception) {
            Log.e("DiscoveryService", "JmDNS registration failed", e)
        }
    }
    
    fun discoverServices(listener: DiscoveryListener) {
        // Discover other VideoAI instances on the network
        nsdManager?.discoverServices(
            "_videoai._tcp.",
            NsdManager.PROTOCOL_DNS_SD,
            object : NsdManager.DiscoveryListener {
                override fun onDiscoveryStarted(serviceType: String) {
                    Log.d("DiscoveryService", "Discovery started")
                }
                
                override fun onServiceFound(serviceInfo: NsdServiceInfo) {
                    if (serviceInfo.serviceName != "VideoAI Phone") {
                        val host = serviceInfo.host
                        val port = serviceInfo.port
                        val token = serviceInfo.attributes?.get("token") as String? ?: ""
                        listener.onServiceFound(DiscoveredService(
                            name = serviceInfo.serviceName,
                            host = host?.hostAddress ?: "",
                            port = port,
                            token = token
                        ))
                    }
                }
                
                override fun onServiceLost(serviceInfo: NsdServiceInfo) {
                    Log.d("DiscoveryService", "Service lost: ${serviceInfo.serviceName}")
                }
                
                override fun onDiscoveryStopped(serviceType: String) {
                    Log.d("DiscoveryService", "Discovery stopped")
                }
                
                override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                    Log.e("DiscoveryService", "Discovery start failed: $errorCode")
                }
                
                override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {
                    Log.e("DiscoveryService", "Discovery stop failed: $errorCode")
                }
            }
        )
    }
    
    override fun onDestroy() {
        stopDiscovery()
        super.onDestroy()
    }
    
    private fun stopDiscovery() {
        serviceInfo?.let {
            nsdManager?.unregisterService(registrationListener!!)
        }
        jmDns?.unregisterAllServices()
        try {
            jmDns?.close()
        } catch (e: Exception) {
            Log.e("DiscoveryService", "Error closing JmDNS", e)
        }
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    interface DiscoveryListener {
        fun onServiceFound(service: DiscoveredService)
    }
    
    data class DiscoveredService(
        val name: String,
        val host: String,
        val port: Int,
        val token: String
    )
}