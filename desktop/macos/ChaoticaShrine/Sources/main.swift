import Cocoa
import ApplicationServices
import QuartzCore

private let staffSize = NSSize(width: 118, height: 320)
private let hostBundleIdentifier = "app.chaotica.desktop"
private let companionBundleIdentifier = "com.chaotica.desk-shrine"

private final class StaffPanel: NSPanel {
  override var canBecomeKey: Bool { false }
  override var canBecomeMain: Bool { false }
}

private final class StaffView: NSImageView {
  var onActivate: (() -> Void)?
  private let beam = CAGradientLayer()

  override init(frame frameRect: NSRect) {
    super.init(frame: frameRect)
    wantsLayer = true
    imageScaling = .scaleProportionallyUpOrDown
    imageAlignment = .alignCenter
    layer?.masksToBounds = false
    layer?.shadowColor = NSColor.systemPink.cgColor
    layer?.shadowRadius = 10
    layer?.shadowOpacity = 0.38
    layer?.shadowOffset = .zero
    beam.colors = [NSColor.clear.cgColor, NSColor.systemPink.withAlphaComponent(0.95).cgColor, NSColor.white.withAlphaComponent(0.9).cgColor, NSColor.clear.cgColor]
    beam.startPoint = CGPoint(x: 0, y: 0.5)
    beam.endPoint = CGPoint(x: 1, y: 0.5)
    beam.opacity = 0
    layer?.addSublayer(beam)
  }

  required init?(coder: NSCoder) { nil }
  override func layout() { super.layout(); beam.frame = CGRect(x: -160, y: bounds.midY - 4, width: 190, height: 8) }
  override func mouseDown(with event: NSEvent) { onActivate?() }
  override func resetCursorRects() { addCursorRect(bounds, cursor: .pointingHand) }

  func signal() {
    let pulse = CABasicAnimation(keyPath: "transform.scale")
    pulse.fromValue = 1.0
    pulse.toValue = 1.1
    pulse.duration = 0.72
    pulse.autoreverses = true
    pulse.repeatCount = 3
    layer?.add(pulse, forKey: "staffPulse")
    let light = CAKeyframeAnimation(keyPath: "opacity")
    light.values = [0, 1, 0.85, 0]
    light.keyTimes = [0, 0.18, 0.72, 1]
    light.duration = 2.4
    beam.add(light, forKey: "pinkBeam")
  }
}

final class StaffDelegate: NSObject, NSApplicationDelegate {
  private var panel: StaffPanel!
  private var staffView: StaffView!
  private var scheduleTimer: Timer?
  private var activationObserver: NSObjectProtocol?
  private var localFlagsMonitor: Any?
  private var globalFlagsMonitor: Any?
  private let shortcutRecognizer = ChaoticaModifierChordRecognizer()

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.accessory)
    makeStaff()
    installLoginLaunchAgent()
    beginShortcutMonitoring()
    activationObserver = NSWorkspace.shared.notificationCenter.addObserver(forName: NSWorkspace.didActivateApplicationNotification, object: nil, queue: .main) { [weak self] _ in self?.syncVisibility() }
    scheduleTimer = Timer.scheduledTimer(withTimeInterval: 20, repeats: true) { [weak self] _ in self?.checkSignalSchedule() }
    syncVisibility()
    checkSignalSchedule()
  }

  func applicationWillTerminate(_ notification: Notification) {
    scheduleTimer?.invalidate()
    if let activationObserver { NSWorkspace.shared.notificationCenter.removeObserver(activationObserver) }
    if let localFlagsMonitor { NSEvent.removeMonitor(localFlagsMonitor) }
    if let globalFlagsMonitor { NSEvent.removeMonitor(globalFlagsMonitor) }
  }

  private func beginShortcutMonitoring() {
    if #available(macOS 10.15, *), !CGPreflightListenEventAccess() {
      _ = CGRequestListenEventAccess()
    }
    let inspect: (NSEvent) -> Void = { [weak self] event in
      self?.inspectShortcut(event)
    }
    localFlagsMonitor = NSEvent.addLocalMonitorForEvents(matching: .flagsChanged) { event in
      inspect(event)
      return event
    }
    globalFlagsMonitor = NSEvent.addGlobalMonitorForEvents(matching: .flagsChanged, handler: inspect)
  }

  private func inspectShortcut(_ event: NSEvent) {
    guard let action = shortcutRecognizer.ingest(event.modifierFlags) else { return }
    DispatchQueue.main.async { [weak self] in
      switch action {
      case .open:
        self?.openChaotica()
      case .close:
        self?.closeChaotica()
      }
    }
  }

  private func makeStaff() {
    panel = StaffPanel(contentRect: NSRect(origin: .zero, size: staffSize), styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
    panel.isFloatingPanel = true
    panel.level = .floating
    panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
    panel.isOpaque = false
    panel.backgroundColor = .clear
    panel.hasShadow = false
    panel.hidesOnDeactivate = false
    staffView = StaffView(frame: NSRect(origin: .zero, size: staffSize))
    staffView.image = Bundle.main.url(forResource: "HopewoodLifeStaff-v2", withExtension: "png").flatMap(NSImage.init(contentsOf:))
    staffView.onActivate = { [weak self] in self?.openChaotica() }
    panel.contentView = staffView
    positionStaff()
  }

  private func positionStaff() {
    guard let screen = NSScreen.main else { return }
    let visible = screen.visibleFrame
    panel.setFrameOrigin(NSPoint(x: visible.maxX - staffSize.width - 8, y: visible.minY + 18))
  }

  private func syncVisibility() {
    if NSWorkspace.shared.frontmostApplication?.bundleIdentifier == hostBundleIdentifier {
      panel.orderOut(nil)
    } else {
      positionStaff()
      panel.orderFrontRegardless()
    }
  }

  private func checkSignalSchedule() {
    let now = Date()
    let calendar = Calendar.current
    let hour = calendar.component(.hour, from: now)
    let minute = calendar.component(.minute, from: now)
    let schedule = ChaoticaStaffReminderConfiguration.load().matches(hour: hour, minute: minute)
    let isReminder = schedule.reminder
    let isSummation = schedule.summation
    guard isReminder || isSummation else { return }
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd-HH-mm"
    let signalKey = formatter.string(from: now)
    guard UserDefaults.standard.string(forKey: "CHAOTICA_LAST_STAFF_SIGNAL") != signalKey else { return }
    UserDefaults.standard.set(signalKey, forKey: "CHAOTICA_LAST_STAFF_SIGNAL")
    if NSWorkspace.shared.frontmostApplication?.bundleIdentifier != hostBundleIdentifier {
      panel.orderFrontRegardless()
      staffView.signal()
    }
    if isSummation { DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { [weak self] in self?.openChaotica(route: "the-summation", autoSummate: true) } }
  }

  private func openChaotica(route: String? = nil, autoSummate: Bool = false) {
    let hostApp = URL(fileURLWithPath: "/Applications/CHAOTICA.app")
    guard FileManager.default.fileExists(atPath: hostApp.path) else { NSSound.beep(); return }
    let configuration = NSWorkspace.OpenConfiguration()
    configuration.activates = true
    NSWorkspace.shared.openApplication(at: hostApp, configuration: configuration) { _, _ in
      guard let route else { return }
      var components = URLComponents()
      components.scheme = "chaotica"
      components.host = route
      if autoSummate { components.queryItems = [URLQueryItem(name: "autoSummate", value: "1")] }
      guard let deepLink = components.url else { return }
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { NSWorkspace.shared.open(deepLink) }
    }
  }

  private func closeChaotica() {
    NSRunningApplication.runningApplications(withBundleIdentifier: hostBundleIdentifier).forEach { app in
      _ = app.terminate()
    }
  }

  private func installLoginLaunchAgent() {
    guard Bundle.main.bundleURL.path == "/Applications/CHAOTICA Staff.app", let executablePath = Bundle.main.executablePath else { return }
    let launchAgents = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/LaunchAgents", isDirectory: true)
    let launchAgent = launchAgents.appendingPathComponent("\(companionBundleIdentifier).plist")
    let payload: [String: Any] = ["Label": companionBundleIdentifier, "ProgramArguments": [executablePath], "RunAtLoad": true, "KeepAlive": ["SuccessfulExit": false], "ProcessType": "Interactive", "LimitLoadToSessionType": "Aqua"]
    do {
      try FileManager.default.createDirectory(at: launchAgents, withIntermediateDirectories: true)
      let data = try PropertyListSerialization.data(fromPropertyList: payload, format: .xml, options: 0)
      try data.write(to: launchAgent, options: .atomic)
    } catch { }
  }
}

let app = NSApplication.shared
let delegate = StaffDelegate()
app.delegate = delegate
app.run()
