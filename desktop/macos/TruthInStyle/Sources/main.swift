import Cocoa
import WebKit
import Speech

private let chaoticaURL = URL(string: "https://www.tellnolies.app/")!

private struct ShrineDaySnapshot: Codable {
  let title: String?
  let displayDate: String?
  let dayOfWeek: String?
  let chaoticaDayNumber: Int?
  let macroBars: [ShrineMacroBar]
  let signals: [ShrineSignal]
}

private struct ShrineMacroBar: Codable {
  let label: String
  let current: Double
  let target: Double
  let unit: String
}

private struct ShrineSignal: Codable {
  let label: String
  let value: String?
  let route: String
  let kind: String?
}

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
  private var recognitionActive = false

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.regular)

    let configuration = WKWebViewConfiguration()
    configuration.websiteDataStore = .default()
    configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
    configuration.userContentController.add(self, name: "chaoticaSpeech")
    configuration.userContentController.add(self, name: "chaoticaShrineSync")
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
    configuration.userContentController.addUserScript(WKUserScript(
      source: """
        (() => {
          const send = window.webkit?.messageHandlers?.chaoticaShrineSync;
          if (!send) return;
          const clean = (value) => typeof value === 'string' && value.trim() ? value.trim().slice(0, 300) : null;
          const parse = (value) => {
            try { return value ? JSON.parse(value) : null; } catch { return null; }
          };
          const localDate = () => {
            const d = new Date();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${d.getFullYear()}-${month}-${day}`;
          };
          const first = (...values) => values.map(clean).find(Boolean) || null;
          const safeArray = (value) => Array.isArray(value) ? value : [];
          const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
          const formatDate = (date) => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
          const dayName = (date) => new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
          const signal = (label, value, route, kind = 'text') => ({ label, value: clean(value), route, kind });
          const sync = () => {
            const date = localDate();
            const today = new Date();
            const assurer = parse(localStorage.getItem(`the_assurer_day:${date}`)) || parse(localStorage.getItem('the_assurer_day')) || {};
            const daDays = parse(localStorage.getItem('truthinstyle_da_eater_days_v1')) || {};
            const daDay = daDays[date] || {};
            const meals = Array.isArray(daDay.meals) ? daDay.meals : [];
            const total = (field) => meals.reduce((sum, meal) => sum + Number(meal?.[field] || 0), 0);
            const calories = total('calories') + (Array.isArray(daDay.cheatFlexEntries) ? daDay.cheatFlexEntries.reduce((sum, item) => sum + Number(item?.roughCalories || 0), 0) : 0);
            const targets = { protein: 250, carbs: 120, fats: 75, calories: 4500 };
            const logged = meals.length > 0 || Number(daDay.waterOz || 0) > 0 || calories > 0;
            const macroBars = logged ? [
              { label: 'Protein', current: total('protein'), target: targets.protein, unit: 'g' },
              { label: 'Carbs', current: total('carbs'), target: targets.carbs, unit: 'g' },
              { label: 'Fats', current: total('fats'), target: targets.fats, unit: 'g' },
              { label: 'Calories', current: calories, target: targets.calories, unit: 'cal' }
            ] : [];
            const macroSummary = logged
              ? `P ${total('protein')}/${targets.protein} · C ${total('carbs')}/${targets.carbs} · F ${total('fats')}/${targets.fats} · ${calories}/${targets.calories} CAL`
              : null;
            const word = object(assurer.wordOfDay || assurer.wordOfTheDay);
            const penny = safeArray(assurer.pennyQuestions).find((entry) => clean(entry?.answer));
            const thiccFitt = object(assurer.thiccFitt);
            const workout = object(thiccFitt.workout);
            const firstExercise = safeArray(thiccFitt.exerciseRows).find((entry) => clean(entry?.exercise));
            const thiccTime = object(assurer.thiccTime);
            const todaySchedule = safeArray(thiccTime.entries).filter((entry) => entry?.date === date);
            const sealed = safeArray(parse(localStorage.getItem('the_summation_sealed_records_v1')));
            const sealedToday = sealed.find((record) => record?.sourceDate === date || record?.dateKey === date) || {};
            const sealedDayNumber = Number(sealedToday?.chaoticaDayNumber);
            const chaoticaDayNumber = Number.isFinite(sealedDayNumber) && sealedDayNumber > 0 ? sealedDayNumber : sealed.length + 1;
            const mood = first(assurer.mood, assurer.nativeFields?.mood);
            const era = first(assurer.era, assurer.nativeFields?.era);
            const battleCry = typeof assurer.battleCry === 'string' ? assurer.battleCry : first(assurer.battleCry?.quote, assurer.battleCry?.text, assurer.battleCry?.statement);
            const signals = [
              signal('Macro Progress', macroSummary, 'da-eater', 'macro'),
              signal('Penny for Your Thoughts', penny?.answer, 'the-assurer'),
              signal('Word of the Day', [clean(word.word), clean(word.definition)].filter(Boolean).join(' — '), 'the-assurer'),
              signal('Assured Thought', assurer.assuredThoughts, 'the-assurer'),
              signal('Battle Cry', battleCry, 'the-assurer'),
              signal('THICC.FITT', first(workout.duration && `Workout · ${workout.duration}`, firstExercise && [firstExercise.exercise, firstExercise.sets && `${firstExercise.sets} sets`, firstExercise.reps && `${firstExercise.reps} reps`].filter(Boolean).join(' · '), thiccFitt.notes), 'thicc-fitt'),
              signal('THICC.TIME', first(todaySchedule[0]?.title, todaySchedule[0]?.label, todaySchedule[0]?.entryType, todaySchedule[0]?.person), 'its-getting-thicc'),
              signal('Mood · Era', [mood, era].filter(Boolean).join(' · '), 'the-assurer')
            ];
            send.postMessage({
              action: 'sync',
              snapshot: {
                title: first(assurer.titleOfDay, assurer.title, localStorage.getItem(`the_assurer_title_of_day:${date}`), localStorage.getItem('the_assurer_title_of_day')),
                displayDate: first(assurer.displayDate, formatDate(today)),
                dayOfWeek: first(assurer.dayOfWeek, dayName(today)),
                chaoticaDayNumber,
                macroBars,
                signals
              }
            });
          };
          window.addEventListener('storage', sync);
          window.addEventListener('focus', sync);
          document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
          setInterval(sync, 15000);
          sync();
        })();
      """,
      injectionTime: .atDocumentEnd,
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
    guard let body = message.body as? [String: Any] else { return }

    if message.name == "chaoticaShrineSync",
       let snapshotBody = body["snapshot"] as? [String: Any] {
      writeShrineSnapshot(snapshotBody)
      return
    }

    guard message.name == "chaoticaSpeech", let action = body["action"] as? String else { return }

    if action == "start" {
      startNativeSpeech()
    } else if action == "stop" {
      stopNativeSpeech(notify: false)
    }
  }

  func application(_ application: NSApplication, open urls: [URL]) {
    guard let url = urls.first, url.scheme?.lowercased() == "chaotica" else { return }
    let route = url.host?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    guard !route.isEmpty else { return }
    let destination = URL(string: "https://www.tellnolies.app/\(route)")!
    webView.load(URLRequest(url: destination))
    window.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)
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

  private func writeShrineSnapshot(_ raw: [String: Any]) {
    do {
      let snapshotData = try JSONSerialization.data(withJSONObject: raw)
      let snapshot = try JSONDecoder().decode(ShrineDaySnapshot.self, from: snapshotData)
      let folder = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent("Library/Application Support/CHAOTICA", isDirectory: true)
      try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
      let data = try JSONEncoder().encode(snapshot)
      try data.write(to: folder.appendingPathComponent("shrine-day.json"), options: .atomic)
    } catch {
      // Shrine synchronization is optional and must never interrupt CHAOTICA.
    }
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
    guard !recognitionActive else { return }
    recognitionActive = true
    endRecognitionResources()
    SFSpeechRecognizer.requestAuthorization { [weak self] authorization in
      DispatchQueue.main.async {
        guard let self else { return }
        guard self.recognitionActive else { return }
        guard authorization == .authorized else {
          self.recognitionActive = false
          self.sendSpeechEvent(type: "error", message: "Allow CHAOTICA in Privacy & Security > Speech Recognition, then select LISTEN AGAIN.")
          return
        }
        AVCaptureDevice.requestAccess(for: .audio) { granted in
          DispatchQueue.main.async {
            guard self.recognitionActive else { return }
            guard granted else {
              self.recognitionActive = false
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
      recognitionActive = false
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
    let inputFormat = inputNode.inputFormat(forBus: 0)
    guard inputFormat.sampleRate > 0, inputFormat.channelCount > 0 else {
      recognitionActive = false
      sendSpeechEvent(type: "error", message: "CHAOTICA cannot find an active microphone. Connect or select a microphone, then choose LISTEN AGAIN.")
      return
    }
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: nil) { [weak self, weak request] buffer, _ in
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
    recognitionActive = false
    endRecognitionResources()
    if notify { sendSpeechEvent(type: "ended") }
  }

  private func endRecognitionResources() {
    audioEngine.stop()
    audioEngine.inputNode.removeTap(onBus: 0)
    recognitionRequest?.endAudio()
    recognitionTask?.cancel()
    recognitionRequest = nil
    recognitionTask = nil
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
