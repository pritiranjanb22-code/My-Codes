package com.watchtogether

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.wifi.WifiManager
import android.net.wifi.WifiInfo
import android.os.Build
import androidx.core.content.ContextCompat
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result
import java.net.InetAddress
import java.net.NetworkInterface
import java.util.Enumeration

class WatchTogetherPlugin: FlutterPlugin, MethodCallHandler {
    private var channel: MethodChannel? = null
    private var context: Context? = null

    override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        channel = MethodChannel(binding.binaryMessenger, "watch_together/native")
        channel?.setMethodCallHandler(this)
        context = binding.applicationContext
    }

    override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        channel?.setMethodCallHandler(null)
        channel = null
        context = null
    }

    override fun onMethodCall(call: MethodCall, result: Result) {
        when (call.method) {
            "getLocalIp" -> result.success(getLocalIp())
            "hasLocalNetworkPermission" -> result.success(hasLocalNetworkPermission())
            "requestLocalNetworkPermission" -> result.success(requestLocalNetworkPermission())
            "getWifiInfo" -> result.success(getWifiInfo())
            "keepScreenOn" -> keepScreenOn(call.argument("enabled") as Boolean)
            "setVolume" -> setVolume(call.argument("volume") as Double)
            "getVolume" -> result.success(getVolume())
            "getDeviceInfo" -> result.success(getDeviceInfo())
            else -> result.notImplemented()
        }
    }

    private fun getLocalIp(): String? {
        try {
            val interfaces: Enumeration<NetworkInterface> = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val networkInterface = interfaces.nextElement()
                if (networkInterface.isLoopback || !networkInterface.isUp) continue
                
                val addresses: Enumeration<InetAddress> = networkInterface.inetAddresses
                while (addresses.hasMoreElements()) {
                    val address = addresses.nextElement()
                    if (address is java.net.Inet4Address && !address.isLoopbackAddress) {
                        return address.hostAddress
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }

    private fun hasLocalNetworkPermission(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(context!!, Manifest.permission.NEARBY_WIFI_DEVICES) == PackageManager.PERMISSION_GRANTED
        }
        return true
    }

    private fun requestLocalNetworkPermission(): Boolean {
        // Permission request must be handled by Flutter side
        return hasLocalNetworkPermission()
    }

    private fun getWifiInfo(): Map<String, Any>? {
        val wifiManager = context?.getSystemService(Context.WIFI_SERVICE) as WifiManager?
        val wifiInfo = wifiManager?.connectionInfo
        return if (wifiInfo != null) {
            mapOf(
                "ssid" to wifiInfo.ssid.replace("\"", ""),
                "bssid" to wifiInfo.bssid,
                "ipAddress" to intToIp(wifiInfo.ipAddress),
                "rssi" to wifiInfo.rssi,
                "linkSpeed" to wifiInfo.linkSpeed,
                "frequency" to wifiInfo.frequency
            )
        } else null
    }

    private fun intToIp(intIp: Int): String {
        return ((intIp and 0xFF).toString() + "." +
                ((intIp shr 8) and 0xFF).toString() + "." +
                ((intIp shr 16) and 0xFF).toString() + "." +
                ((intIp shr 24) and 0xFF).toString())
    }

    private fun keepScreenOn(enabled: Boolean) {
        // Handled by Flutter side using wakelock plugin
    }

    private fun setVolume(volume: Double) {
        // Handled by Flutter audio plugins
    }

    private fun getVolume(): Double {
        return 1.0
    }

    private fun getDeviceInfo(): Map<String, Any> {
        return mapOf(
            "brand" to Build.BRAND,
            "model" to Build.MODEL,
            "manufacturer" to Build.MANUFACTURER,
            "device" to Build.DEVICE,
            "androidVersion" to Build.VERSION.RELEASE,
            "sdkInt" to Build.VERSION.SDK_INT,
            "isTablet" to isTablet(context!!)
        )
    }

    private fun isTablet(context: Context): Boolean {
        return (context.resources.configuration.screenLayout and
                android.content.res.Configuration.SCREENLAYOUT_SIZE_MASK) >=
                android.content.res.Configuration.SCREENLAYOUT_SIZE_LARGE
    }
}