import Flutter
import UIKit
import Network
import AVFoundation

public class WatchTogetherPlugin: NSObject, FlutterPlugin {
    private var channel: FlutterMethodChannel?
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "com.watchtogether.network")
    
    public static func register(with registrar: FlutterPluginRegistrar) {
        let channel = FlutterMethodChannel(name: "watch_together/native", binaryMessenger: registrar.messenger())
        let instance = WatchTogetherPlugin()
        instance.channel = channel
        registrar.addMethodCallDelegate(instance, channel: channel)
    }
    
    public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "getLocalIp":
            result(getLocalIp())
        case "hasLocalNetworkPermission":
            result(hasLocalNetworkPermission())
        case "requestLocalNetworkPermission":
            requestLocalNetworkPermission(result: result)
        case "getWifiInfo":
            result(getWifiInfo())
        case "keepScreenOn":
            if let args = call.arguments as? [String: Any],
               let enabled = args["enabled"] as? Bool {
                keepScreenOn(enabled)
            }
            result(nil)
        case "setVolume":
            if let args = call.arguments as? [String: Any],
               let volume = args["volume"] as? Double {
                setVolume(volume)
            }
            result(nil)
        case "getVolume":
            result(getVolume())
        case "getDeviceInfo":
            result(getDeviceInfo())
        default:
            result(FlutterMethodNotImplemented)
        }
    }
    
    private func getLocalIp() -> String? {
        var address: String?
        var ifaddr: UnsafeMutablePointer<ifaddrs>?
        
        guard getifaddrs(&ifaddr) == 0 else { return nil }
        defer { freeifaddrs(ifaddr) }
        
        var ptr = ifaddr
        while ptr != nil {
            defer { ptr = ptr?.pointee.ifa_next }
            
            let interface = ptr!.pointee
            let addrFamily = interface.ifa_addr.pointee.sa_family
            
            if addrFamily == UInt8(AF_INET) {
                let name = String(cString: interface.ifa_name)
                if name != "lo0" && name.hasPrefix("en") || name.hasPrefix("pdp") {
                    var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                    getnameinfo(interface.ifa_addr, socklen_t(interface.ifa_addr.pointee.sa_len),
                                &hostname, socklen_t(hostname.count),
                                nil, socklen_t(0), NI_NUMERICHOST)
                    address = String(cString: hostname)
                    break
                }
            }
        }
        return address
    }
    
    private func hasLocalNetworkPermission() -> Bool {
        if #available(iOS 14.0, *) {
            return NWPathMonitor().currentPath.status == .satisfied
        }
        return true
    }
    
    private func requestLocalNetworkPermission(result: @escaping FlutterResult) {
        // iOS 14+ requires Local Network permission
        // This is requested automatically when using Bonjour/mDNS
        // We can trigger it by starting a dummy service
        let browser = NetServiceBrowser()
        browser.searchForServices(ofType: "_watchtogether._tcp", inDomain: "local.")
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            browser.stop()
            result(self.hasLocalNetworkPermission())
        }
    }
    
    private func getWifiInfo() -> [String: Any]? {
        // On iOS, we can't directly access WiFi info without special entitlements
        // Return basic network info instead
        var info: [String: Any] = [:]
        
        let monitor = NWPathMonitor()
        let path = monitor.currentPath
        
        info["isConnected"] = path.status == .satisfied
        info["isExpensive"] = path.isExpensive
        info["usesCellular"] = path.usesInterfaceType(.cellular)
        info["usesWiFi"] = path.usesInterfaceType(.wifi)
        info["usesWiredEthernet"] = path.usesInterfaceType(.wiredEthernet)
        
        return info
    }
    
    private func keepScreenOn(_ enabled: Bool) {
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = enabled
        }
    }
    
    private func setVolume(_ volume: Double) {
        // Volume is managed by MPVolumeView or AVAudioSession
    }
    
    private func getVolume() -> Double {
        return AVAudioSession.sharedInstance().outputVolume
    }
    
    private func getDeviceInfo() -> [String: Any] {
        let device = UIDevice.current
        return [
            "name": device.name,
            "model": device.model,
            "systemName": device.systemName,
            "systemVersion": device.systemVersion,
            "identifierForVendor": device.identifierForVendor?.uuidString ?? "",
            "isPad": device.userInterfaceIdiom == .pad
        ]
    }
}