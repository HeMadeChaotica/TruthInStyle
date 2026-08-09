import Cocoa
import WebKit

private let chaoticaURL = URL(string: "https://www.tellnolies.app/")!

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
  private var window: NSWindow!
  private var webView: WKWebView!
  private var openingSplashView: NSImageView!
  private var hasRevealedWebContent = false

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.regular)

    let configuration = WKWebViewConfiguration()
    configuration.websiteDataStore = .default()
    configuration.preferences.javaScriptCanOpenWindowsAutomatically = true

    webView = WKWebView(frame: .zero, configuration: configuration)
    webView.navigationDelegate = self
    webView.uiDelegate = self
    webView.allowsBackForwardNavigationGestures = true

    let startFrame = NSRect(x: 0, y: 0, width: 1440, height: 900)
    window = NSWindow(
      contentRect: startFrame,
      styleMask: [.titled, .closable, .miniaturizable, .resizable],
      backing: .buffered,
      defer: false
    )
    window.title = "CHAOTICA"
    window.titleVisibility = .hidden
    window.titlebarAppearsTransparent = false
    window.isOpaque = true
    window.backgroundColor = .black
    window.minSize = NSSize(width: 1024, height: 720)
    window.center()

    let rootView = NSView(frame: startFrame)
    rootView.wantsLayer = true
    window.contentView = rootView

    openingSplashView = NSImageView(frame: rootView.bounds)
    openingSplashView.image = Bundle.main.url(forResource: "OpeningGate", withExtension: "png").flatMap(NSImage.init(contentsOf:))
    openingSplashView.imageScaling = .scaleAxesIndependently
    openingSplashView.autoresizingMask = [.width, .height]
    rootView.addSubview(openingSplashView)

    webView.frame = rootView.bounds
    webView.autoresizingMask = [.width, .height]
    webView.isHidden = true
    rootView.addSubview(webView)
    webView.load(URLRequest(url: chaoticaURL))

    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.window.makeKeyAndOrderFront(nil)
      self.window.orderFrontRegardless()
      NSApp.activate(ignoringOtherApps: true)
    }
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
    true
  }

  func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    guard let url = navigationAction.request.url else {
      decisionHandler(.cancel)
      return
    }

    if ["mailto", "tel"].contains(url.scheme?.lowercased() ?? "") {
      NSWorkspace.shared.open(url)
      decisionHandler(.cancel)
      return
    }

    decisionHandler(.allow)
  }

  func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
    webView.reload()
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    revealWebContentWhenOpeningSceneIsReady()
  }

  private func revealWebContentWhenOpeningSceneIsReady() {
    guard !hasRevealedWebContent else { return }

    webView.evaluateJavaScript("""
      (() => {
        const scene = document.querySelector('.chaotica-opening-scene-email');
        return Boolean(scene && scene.complete && scene.naturalWidth > 0);
      })()
    """) { [weak self] result, _ in
      guard let self else { return }
      if (result as? Bool) == true {
        self.hasRevealedWebContent = true
        self.webView.isHidden = false
        NSAnimationContext.runAnimationGroup { context in
          context.duration = 0.35
          self.openingSplashView.animator().alphaValue = 0
        } completionHandler: {
          self.openingSplashView.removeFromSuperview()
        }
        return
      }
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
        self?.revealWebContentWhenOpeningSceneIsReady()
      }
    }
  }

  func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
    if let url = navigationAction.request.url {
      webView.load(URLRequest(url: url))
    }
    return nil
  }

  func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
    let alert = NSAlert()
    alert.messageText = "CHAOTICA"
    alert.informativeText = message
    alert.addButton(withTitle: "OK")
    alert.beginSheetModal(for: window) { _ in completionHandler() }
  }

  func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
    let alert = NSAlert()
    alert.messageText = "CHAOTICA"
    alert.informativeText = message
    alert.addButton(withTitle: "Continue")
    alert.addButton(withTitle: "Cancel")
    alert.beginSheetModal(for: window) { response in completionHandler(response == .alertFirstButtonReturn) }
  }

  func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
    let panel = NSOpenPanel()
    panel.canChooseFiles = true
    panel.canChooseDirectories = parameters.allowsDirectories
    panel.allowsMultipleSelection = parameters.allowsMultipleSelection
    panel.beginSheetModal(for: window) { response in
      completionHandler(response == .OK ? panel.urls : nil)
    }
  }

  @available(macOS 12.0, *)
  func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
    decisionHandler(.grant)
  }
}

let app = NSApplication.shared
let appDelegate = AppDelegate()
app.delegate = appDelegate
app.setActivationPolicy(.regular)
app.run()
