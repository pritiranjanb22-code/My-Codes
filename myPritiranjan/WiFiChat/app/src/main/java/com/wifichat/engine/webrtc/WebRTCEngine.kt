package com.wifichat.engine.webrtc

import android.content.Context
import android.util.Log
import com.wifichat.data.model.*
import org.webrtc.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class WebRTCEngine(
    private val context: Context,
    private val config: WebRTCConfig
) {
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var peerConnections = mutableMapOf<String, PeerConnection>()
    private var localVideoTrack: VideoTrack? = null
    private var localAudioTrack: AudioTrack? = null
    private var videoCapturer: VideoCapturer? = null
    private val peerConnectionObservers = mutableMapOf<String, PeerConnectionObserver>()
    
    interface PeerConnectionObserver {
        fun onIceCandidate(callId: String, candidate: IceCandidateData)
        fun onConnectionStateChange(callId: String, state: PeerConnection.ConnectionState)
        fun onTrack(callId: String, track: MediaStreamTrack)
        fun onRemoveTrack(callId: String, track: MediaStreamTrack)
    }
    
    init {
        initializePeerConnectionFactory()
    }
    
    private fun initializePeerConnectionFactory() {
        val options = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(true)
            .createInitializationOptions()
        PeerConnectionFactory.initialize(options)
        
        val factoryOptions = PeerConnectionFactory.Options()
            .setNetworkIgnoreMask(0)
        
        peerConnectionFactory = PeerConnectionFactory.builder()
            .setOptions(factoryOptions)
            .setVideoEncoderFactory(DefaultVideoEncoderFactory())
            .setVideoDecoderFactory(DefaultVideoDecoderFactory())
            .createPeerConnectionFactory()
        
        createLocalMediaTracks()
    }
    
    private fun createLocalMediaTracks() {
        peerConnectionFactory?.let { factory ->
            // Audio track
            val audioSource = factory.createAudioSource(AudioSourceOptions())
            localAudioTrack = factory.createAudioTrack("local_audio", audioSource)
            
            // Video track
            val videoSource = factory.createVideoSource(false)
            localVideoTrack = factory.createVideoTrack("local_video", videoSource)
            
            // Start camera capturer
            startCameraCapturer(videoSource)
        }
    }
    
    private fun startCameraCapturer(videoSource: VideoSource) {
        executor.execute {
            val cameraEnumerator = CameraEnumerator()
            val cameraNames = cameraEnumerator.getDeviceNames()
            
            // Prefer front camera
            val frontCamera = cameraNames.find { cameraEnumerator.isFrontFacing(it) } 
                ?: cameraNames.firstOrNull()
            
            frontCamera?.let { name ->
                videoCapturer = cameraEnumerator.createCapturer(name, null)
                videoCapturer?.initialize(
                    SurfaceTextureHelper.create("capture_thread", EglBase.create().eglContext),
                    context,
                    videoSource.getCapturerObserver()
                )
                videoCapturer?.startCapture(1280, 720, 30)
            }
        }
    }
    
    fun createPeerConnection(
        callId: String,
        remoteUserId: String,
        observer: PeerConnectionObserver
    ): PeerConnection? {
        return executor.submit {
            peerConnectionFactory?.let { factory ->
                val rtcConfig = PeerConnection.RTCConfiguration(config.iceServers.map { iceServer ->
                    PeerConnection.IceServer.builder(iceServer.urls)
                        .setUsername(iceServer.username ?: "")
                        .setPassword(iceServer.credential ?: "")
                        .createIceServer()
                }.toTypedArray())
                
                rtcConfig.tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.DISABLED
                rtcConfig.bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
                rtcConfig.rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE
                rtcConfig.continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
                
                val pcObserver = object : PeerConnection.Observer() {
                    override fun onIceCandidate(candidate: IceCandidate) {
                        observer.onIceCandidate(callId, IceCandidateData(
                            candidate = candidate.sdp,
                            sdpMid = candidate.sdpMid!!,
                            sdpMLineIndex = candidate.sdpMLineIndex
                        ))
                    }
                    
                    override fun onConnectionStateChange(newState: PeerConnection.ConnectionState) {
                        observer.onConnectionStateChange(callId, newState)
                    }
                    
                    override fun onTrack(rtpTransceiver: RtpTransceiver) {
                        rtpTransceiver.receiver.track?.let { track ->
                            observer.onTrack(callId, track)
                        }
                    }
                    
                    override fun onRemoveTrack(receiver: MediaStreamTrack) {
                        observer.onRemoveTrack(callId, receiver)
                    }
                }
                
                val peerConnection = factory.createPeerConnection(rtcConfig, pcObserver)
                
                // Add local tracks
                localAudioTrack?.let { peerConnection.addTrack(it, arrayOf("stream")) }
                localVideoTrack?.let { peerConnection.addTrack(it, arrayOf("stream")) }
                
                peerConnections[callId] = peerConnection
                peerConnectionObservers[callId] = observer
                
                peerConnection
            }
        }.get()
    }
    
    fun createOffer(callId: String): SessionDescription? {
        return peerConnections[callId]?.let { pc ->
            val constraints = MediaConstraints()
            constraints.mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
            constraints.mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
            
            pc.createOffer(object : SdpObserver {
                override fun onCreateSuccess(sessionDescription: SessionDescription) {
                    pc.setLocalDescription(this, sessionDescription)
                }
                override fun onCreateFailure(error: String) {
                    Log.e("WebRTCEngine", "Create offer failed: $error")
                }
                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {}
            }, constraints)
            pc.localDescription
        }
    }
    
    fun createAnswer(callId: String): SessionDescription? {
        return peerConnections[callId]?.let { pc ->
            val constraints = MediaConstraints()
            constraints.mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
            constraints.mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
            
            pc.createAnswer(object : SdpObserver {
                override fun onCreateSuccess(sessionDescription: SessionDescription) {
                    pc.setLocalDescription(this, sessionDescription)
                }
                override fun onCreateFailure(error: String) {
                    Log.e("WebRTCEngine", "Create answer failed: $error")
                }
                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {}
            }, constraints)
            pc.localDescription
        }
    }
    
    fun setRemoteDescription(callId: String, sdp: String, type: String): Boolean {
        return peerConnections[callId]?.let { pc ->
            val sessionDescription = SessionDescription(SessionDescription.Type.fromCanonicalForm(type), sdp)
            pc.setRemoteDescription(object : SdpObserver {
                override fun onCreateSuccess(sessionDescription: SessionDescription) {}
                override fun onCreateFailure(error: String) {}
                override fun onSetSuccess() {}
                override fun onSetFailure(error: String) {
                    Log.e("WebRTCEngine", "Set remote description failed: $error")
                }
            }, sessionDescription)
            true
        } ?: false
    }
    
    fun addIceCandidate(callId: String, candidate: IceCandidateData): Boolean {
        return peerConnections[callId]?.let { pc ->
            val iceCandidate = IceCandidate(candidate.sdpMid, candidate.sdpMLineIndex, candidate.candidate)
            pc.addIceCandidate(iceCandidate)
            true
        } ?: false
    }
    
    fun switchCamera() {
        videoCapturer?.let { capturer ->
            if (capturer is CameraVideoCapturer) {
                capturer.switchCamera(null)
            }
        }
    }
    
    fun setVideoEnabled(enabled: Boolean) {
        localVideoTrack?.isEnabled = enabled
    }
    
    fun setAudioEnabled(enabled: Boolean) {
        localAudioTrack?.isEnabled = enabled
    }
    
    fun getLocalVideoTrack(): VideoTrack? = localVideoTrack
    fun getLocalAudioTrack(): AudioTrack? = localAudioTrack
    
    fun closePeerConnection(callId: String) {
        peerConnections[callId]?.close()
        peerConnections.remove(callId)
        peerConnectionObservers.remove(callId)
    }
    
    fun closeAll() {
        peerConnections.values.forEach { it.close() }
        peerConnections.clear()
        peerConnectionObservers.clear()
        videoCapturer?.stopCapture()
        videoCapturer?.dispose()
        localVideoTrack?.dispose()
        localAudioTrack?.dispose()
        peerConnectionFactory?.dispose()
        executor.shutdown()
    }
    
    companion object {
        fun initialize(context: Context) {
            PeerConnectionFactory.initialize(
                PeerConnectionFactory.InitializationOptions.builder(context)
                    .setEnableInternalTracer(true)
                    .createInitializationOptions()
            )
        }
    }
}