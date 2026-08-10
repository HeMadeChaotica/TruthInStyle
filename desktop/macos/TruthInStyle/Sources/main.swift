import Cocoa
import WebKit
import Speech

private let chaoticaURL = URL(string: "https://www.tellnolies.app/")!

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
  private var window: NSWindow!
  private var webView: WKWebView!
  private var openingSplashView: NSImageView!
  private var hasRevealedWebContent = false
  private let audioEngine = AVAudioEngine()
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
  private var recognitionID = UUID()
  private var lastLevelSentAt: TimeInterval = 0

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.regular)

    let configuration = WKWebViewConfiguration()
    configuration.websiteDataStore = .default()
    configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
    configuration.userContentController.add(self, name: "chaoticaSpeech")
    configuration.userContentController.addUserScript(WKUserScript(
      source: """
        window.ChaoticaNativeSpeech = Object.freeze({
          start: () => window.webkit?.messageHandlers?.chaoticaSpeech?.postMessage({ action: 'start' }),
          stop: () => window.webkit?.messageHandlers?.chaoticaSpeech?.postMessage({ action: 'stop' })
        });
      """,
      injectionTime: .atDocumentStart,
      forMainFrameOnly: true
    ))

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

  func applicationWillTerminate(_ notification: Notification) {
    stopNativeSpeech(notify: false)
  }

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard message.name == "chaoticaSpeech",
          let body = message.body as? [String: Any],
          let action = body["action"] as? String else { return }

    if action == "start" {
      startNativeSpeech()
    } else if action == "stop" {
      stopNativeSpeech(notify: false)
    }
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

  private func startNativeSpeech() {
    stopNativeSpeech(notify: false)
    SFSpeechRecognizer.requestAuthorization { [weak self] authorization in
      DispatchQueue.main.async {
        guard let self else { return }
        guard authorization == .authorized else {
          self.sendSpeechEvent(type: "error", message: "Allow CHAOTICA in Privacy & Security > Speech Recognition, then select LISTEN AGAIN.")
          return
        }
        AVCaptureDevice.requestAccess(for: .audio) { granted in
          DispatchQueue.main.async {
            guard granted else {
              self.sendSpeechEvent(type: "error", message: "Allow CHAOTICA in Privacy & Security > Microphone, then select LISTEN AGAIN.")
              return
            }
            self.beginNativeRecognition()
          }
        }
      }
    }
  }

  private func beginNativeRecognition() {
    guard let speechRecognizer, speechRecognizer.isAvailable else {
      sendSpeechEvent(type: "error", message: "Apple Speech Recognition is unavailable. Check your internet connection, then select LISTEN AGAIN.")
      return
    }

    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = true
    recognitionRequest = request
    let currentRecognitionID = UUID()
    recognitionID = currentRecognitionID

    let inputNode = audioEngine.inputNode
    inputNode.removeTap(onBus: 0)
    let format = inputNode.outputFormat(forBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self, weak request] buffer, _ in
      request?.append(buffer)
      self?.sendAudioLevel(from: buffer)
    }

    do {
      audioEngine.prepare()
      try audioEngine.start()
      sendSpeechEvent(type: "listening")
      DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in
        guard let self, self.recognitionID == currentRecognitionID else { return }
        self.sendSpeechEvent(type: "quiet")
      }
      recognitionTask = speechRecognizer.recognitionTask(with: request) { [weak self] result, error in
        guard let self, self.recognitionID == currentRecognitionID else { return }
        if let transcript = result?.bestTranscription.formattedString, !transcript.isEmpty {
          self.sendSpeechEvent(type: "result", transcript: transcript)
        }
        if let error {
          self.stopNativeSpeech(notify: false)
          self.sendSpeechEvent(type: "error", message: self.speechErrorMessage(error))
        } else if result?.isFinal == true {
          self.stopNativeSpeech(notify: true)
        }
      }
    } catch {
      stopNativeSpeech(notify: false)
      sendSpeechEvent(type: "error", message: "CHAOTICA could not start the microphone. Select LISTEN AGAIN.")
    }
  }

  private func stopNativeSpeech(notify: Bool) {
    recognitionID = UUID()
    audioEngine.stop()
    audioEngine.inputNode.removeTap(onBus: 0)
    recognitionRequest?.endAudio()
    recognitionTask?.cancel()
    recognitionRequest = nil
    recognitionTask = nil
    if notify { sendSpeechEvent(type: "ended") }
  }

  private func sendAudioLevel(from buffer: AVAudioPCMBuffer) {
    let now = ProcessInfo.processInfo.systemUptime
    guard now - lastLevelSentAt > 0.08,
          let samples = buffer.floatChannelData?.pointee,
          buffer.frameLength > 0 else { return }
    lastLevelSentAt = now
    let count = Int(buffer.frameLength)
    var energy: Float = 0
    for index in 0..<count { energy += samples[index] * samples[index] }
    let rms = sqrt(energy / Float(count))
    sendSpeechEvent(type: "level", level: min(1, max(0, rms * 16)))
  }

  private func speechErrorMessage(_ error: Error) -> String {
    let description = (error as NSError).localizedDescription.lowercased()
    if description.contains("permission") || description.contains("authorization") {
      return "Allow CHAOTICA in Privacy & Security > Speech Recognition, then select LISTEN AGAIN."
    }
    if description.contains("network") || description.contains("internet") {
      return "Apple Speech Recognition needs an internet connection. Reconnect, then select LISTEN AGAIN."
    }
    return "Apple Speech Recognition could not hear the oath. Select LISTEN AGAIN and speak clearly."
  }

  private func sendSpeechEvent(type: String, transcript: String? = nil, message: String? = nil, level: Float? = nil) {
    var payload: [String: Any] = ["type": type]
    if let transcript { payload["transcript"] = transcript }
    if let message { payload["message"] = message }
    if let level { payload["level"] = level }
    guard let data = try? JSONSerialization.data(withJSONObject: payload),
          let json = String(data: data, encoding: .utf8) else { return }
    DispatchQueue.main.async { [weak self] in
      self?.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('chaotica-native-speech', { detail: \(json) }));")
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
