package com.wifichat.data.model

import kotlinx.serialization.Serializable

@Serializable
sealed class SignalingMessage {
    @Serializable data class Offer(
        val sdp: String,
        val type: String = "offer",
        val from: String,
        val to: String,
        val callId: String,
        val callType: CallType
    ) : SignalingMessage()
    
    @Serializable data class Answer(
        val sdp: String,
        val type: String = "answer",
        val from: String,
        val to: String,
        val callId: String
    ) : SignalingMessage()
    
    @Serializable data class IceCandidate(
        val candidate: String,
        val sdpMid: String,
        val sdpMLineIndex: Int,
        val from: String,
        val to: String,
        val callId: String
    ) : SignalingMessage()
    
    @Serializable data class CallInvite(
        val callId: String,
        val from: String,
        val to: String,
        val callType: CallType,
        val callerName: String,
        val callerAvatar: String? = null,
        val timestamp: Long = System.currentTimeMillis()
    ) : SignalingMessage()
    
    @Serializable data class CallAccept(
        val callId: String,
        val from: String,
        val to: String
    ) : SignalingMessage()
    
    @Serializable data class CallDecline(
        val callId: String,
        val from: String,
        val to: String,
        val reason: String = "declined"
    ) : SignalingMessage()
    
    @Serializable data class CallEnd(
        val callId: String,
        val from: String,
        val to: String,
        val duration: Long = 0
    ) : SignalingMessage()
    
    @Serializable data class CallBusy(
        val callId: String,
        val from: String,
        val to: String
    ) : SignalingMessage()
    
    @Serializable data class PeerDiscovery(
        val peers: List<PeerInfo>
    ) : SignalingMessage()
    
    @Serializable data class PeerAnnounce(
        val peer: PeerInfo
    ) : SignalingMessage()
    
    @Serializable data class PeerLeave(
        val peerId: String
    ) : SignalingMessage()
    
    @Serializable data class Ping(
        val timestamp: Long = System.currentTimeMillis()
    ) : SignalingMessage()
    
    @Serializable data class Pong(
        val timestamp: Long = System.currentTimeMillis()
    ) : SignalingMessage()
}

@Serializable
enum class CallType {
    VIDEO,
    AUDIO
}

@Serializable
data class CallSession(
    val callId: String,
    val localUserId: String,
    val remoteUserId: String,
    val type: CallType,
    val status: CallStatus,
    val localSdp: String? = null,
    val remoteSdp: String? = null,
    val localCandidates: List<IceCandidateData> = emptyList(),
    val remoteCandidates: List<IceCandidateData> = emptyList(),
    val startedAt: Long = System.currentTimeMillis(),
    val connectedAt: Long = 0,
    val endedAt: Long = 0
)

@Serializable
enum class CallStatus {
    INITIATING,
    RINGING,
    CONNECTING,
    CONNECTED,
    ENDED,
    FAILED
}

@Serializable
data class IceCandidateData(
    val candidate: String,
    val sdpMid: String,
    val sdpMLineIndex: Int
)

@Serializable
data class WebRTCConfig(
    val iceServers: List<IceServer> = listOf(
        IceServer(urls = listOf("stun:stun.l.google.com:19302"))
    ),
    val audioCodec: String = "opus",
    val videoCodec: String = "VP8",
    val videoBitrate: Int = 2500, // kbps
    val videoResolution: VideoResolution = VideoResolution.HD_720P
)

@Serializable
data class IceServer(
    val urls: List<String>,
    val username: String? = null,
    val credential: String? = null
)

@Serializable
enum class VideoResolution {
    QVGA(320, 240),
    VGA(640, 480),
    HD_720P(1280, 720),
    HD_1080P(1920, 1080);
    
    val width: Int
    val height: Int
}