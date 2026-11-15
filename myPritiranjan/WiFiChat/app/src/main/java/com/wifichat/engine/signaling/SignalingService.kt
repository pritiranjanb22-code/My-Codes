package com.wifichat.engine.signaling

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import com.wifichat.data.model.SignalingMessage
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.serialization.json.Json
import org.java_websocket.client.WebSocketClient
import org.java_websocket.drafts.Draft_6455
import org.java_websocket.handshake.ServerHandshake
import java.net.URI
import java.util.concurrent.ConcurrentHashMap

class SignalingService : LifecycleService() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var webSocketClient: SignalingWebSocketClient? = null
    private val messageChannel = Channel<SignalingMessage>(Channel.UNLIMITED)
    private val pendingCalls = ConcurrentHashMap<String, CompletableDeferred<SignalingMessage>>()
    private val callListeners = mutableMapOf<String, (SignalingMessage) -> Unit>()
    private var currentUserId: String = ""
    private var serverUrl: String = ""
    private var notificationManager: NotificationManager? = null
    private val CHANNEL_ID = "wifichat_signaling"
    private val NOTIFICATION_ID = 1001
    private val json = Json { ignoreUnknownKeys = true }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "WiFiChat Signaling",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background signaling for calls"
                setShowBadge(false)
            }
            notificationManager?.createNotificationChannel(channel)
        }
    }
    
    fun connect(userId: String, serverUrl: String) {
        this.currentUserId = userId
        this.serverUrl = serverUrl
        
        scope.launch {
            val uri = URI("$serverUrl?userId=$userId")
            webSocketClient = SignalingWebSocketClient(uri, object : SignalingWebSocketClient.Listener {
                override fun onOpen() {
                    Log.d("SignalingService", "WebSocket connected")
                    showNotification("Connected to signaling server")
                }
                
                override fun onMessage(message: String) {
                    try {
                        val signalingMessage = json.decodeFromString<SignalingMessage>(message)
                        handleIncomingMessage(signalingMessage)
                    } catch (e: Exception) {
                        Log.e("SignalingService", "Failed to parse message", e)
                    }
                }
                
                override fun onClose(code: Int, reason: String, remote: Boolean) {
                    Log.d("SignalingService", "WebSocket closed: $code - $reason")
                    // Attempt reconnection
                    reconnect()
                }
                
                override fun onError(ex: Exception) {
                    Log.e("SignalingService", "WebSocket error", ex)
                }
            })
            webSocketClient?.connect()
        }
    }
    
    private fun reconnect() {
        scope.launch {
            try {
                Thread.sleep(5000)
                connect(currentUserId, serverUrl)
            } catch (e: Exception) {
                Log.e("SignalingService", "Reconnect failed", e)
            }
        }
    }
    
    private fun handleIncomingMessage(message: SignalingMessage) {
        when (message) {
            is SignalingMessage.CallInvite -> {
                // Notify UI about incoming call
                callListeners[message.callId]?.invoke(message)
                // Show call notification
                showCallNotification(message)
            }
            is SignalingMessage.CallAccept,
               is SignalingMessage.CallDecline,
               is SignalingMessage.CallEnd,
               is SignalingMessage.CallBusy -> {
                // Complete pending call future
                pendingCalls[message.callId]?.complete(message)
                callListeners[message.callId]?.invoke(message)
            }
            is SignalingMessage.Offer,
               is SignalingMessage.Answer,
               is SignalingMessage.IceCandidate -> {
                callListeners[message.callId]?.invoke(message)
            }
            is SignalingMessage.PeerDiscovery -> {
                callListeners["discovery"]?.invoke(message)
            }
            is SignalingMessage.PeerAnnounce,
               is SignalingMessage.PeerLeave -> {
                callListeners["peers"]?.invoke(message)
            }
        }
    }
    
    suspend fun sendMessage(message: SignalingMessage): Boolean {
        return webSocketClient?.send(json.encodeToString(message)) ?: false
    }
    
    suspend fun sendCallInvite(invite: SignalingMessage.CallInvite): SignalingMessage? {
        val completer = CompletableDeferred<SignalingMessage>()
        pendingCalls[invite.callId] = completer
        
        sendMessage(invite)
        
        return try {
            completer.await()
        } catch (e: Exception) {
            null
        } finally {
            pendingCalls.remove(invite.callId)
        }
    }
    
    fun registerCallListener(callId: String, listener: (SignalingMessage) -> Unit) {
        callListeners[callId] = listener
    }
    
    fun unregisterCallListener(callId: String) {
        callListeners.remove(callId)
    }
    
    fun registerGlobalListener(type: String, listener: (SignalingMessage) -> Unit) {
        callListeners[type] = listener
    }
    
    fun discoverPeers() {
        // Broadcast discovery request
        val message = SignalingMessage.PeerDiscovery(peers = emptyList())
        sendMessage(message)
    }
    
    fun announcePeer(peer: com.wifichat.data.model.PeerInfo) {
        val message = SignalingMessage.PeerAnnounce(peer = peer)
        sendMessage(message)
    }
    
    private fun showNotification(message: String) {
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("WiFiChat")
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
        
        val notification = builder.build()
        startForeground(NOTIFICATION_ID, notification)
    }
    
    private fun showCallNotification(invite: SignalingMessage.CallInvite) {
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_call)
            .setContentTitle("Incoming ${if (invite.callType == com.wifichat.data.model.CallType.VIDEO) "Video" else "Voice"} Call")
            .setContentText("From ${invite.callerName}")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(getCallIntent(invite.callId), true)
            .setAutoCancel(true)
        
        val notification = builder.build()
        notificationManager?.notify(NOTIFICATION_ID + invite.callId.hashCode(), notification)
    }
    
    private fun getCallIntent(callId: String): android.app.PendingIntent {
        val intent = Intent(this, com.wifichat.ui.MainActivity::class.java)
            .putExtra("callId", callId)
            .putExtra("action", "answer_call")
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return android.app.PendingIntent.getActivity(
            this, callId.hashCode(), intent,
            android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT
        )
    }
    
    override fun onDestroy() {
        webSocketClient?.close()
        scope.cancel()
        super.onDestroy()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    inner class SignalingWebSocketClient(
        uri: URI,
        private val listener: Listener
    ) : WebSocketClient(uri, Draft_6455()) {
        
        interface Listener {
            fun onOpen()
            fun onMessage(message: String)
            fun onClose(code: Int, reason: String, remote: Boolean)
            fun onError(ex: Exception)
        }
        
        override fun onOpen(handshakedata: ServerHandshake) {
            listener.onOpen()
        }
        
        override fun onMessage(message: String) {
            listener.onMessage(message)
        }
        
        override fun onClose(code: Int, reason: String, remote: Boolean) {
            listener.onClose(code, reason, remote)
        }
        
        override fun onError(ex: Exception) {
            listener.onError(ex)
        }
        
        fun send(message: String): Boolean {
            return try {
                send(message)
                true
            } catch (e: Exception) {
                Log.e("SignalingService", "Send failed", e)
                false
            }
        }
    }
}