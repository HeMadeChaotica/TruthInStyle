import Cocoa
import WebKit

private let openSize = NSSize(width: 760, height: 458)
private let glyphSize = NSSize(width: 110, height: 210)
private let validRoutes: Set<String> = ["the-assurer", "da-eater", "thicc-fitt"]

private struct ShrineSnapshot: Codable {
  var title: String?
  var mood: String?
  var era: String?
  var macro: String?
  var next: String?
}

private final class ShrinePanel: NSPanel {
  override var canBecomeKey: Bool { false }
  override var canBecomeMain: Bool { false }
}

final class ShrineDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler {
  private var shrinePanel: ShrinePanel!
  private var glyphPanel: ShrinePanel!
  private var webView: WKWebView!
  private var statusItem: NSStatusItem!
  private var globalFlagsMonitor: Any?
  private var localFlagsMonitor: Any?
  private var chordLatched = false

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.accessory)
    makeShrinePanel()
    makeGlyphPanel()
    makeStatusMenu()
    beginShortcutMonitoring()
    retractShrine()
  }

  func applicationWillTerminate(_ notification: Notification) {
    if let globalFlagsMonitor { NSEvent.removeMonitor(globalFlagsMonitor) }
    if let localFlagsMonitor { NSEvent.removeMonitor(localFlagsMonitor) }
  }

  private func makeShrinePanel() {
    shrinePanel = ShrinePanel(contentRect: NSRect(origin: .zero, size: openSize), styleMask: [.borderless, .fullSizeContentView], backing: .buffered, defer: false)
    shrinePanel.isFloatingPanel = true
    shrinePanel.level = .floating
    shrinePanel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
    shrinePanel.isOpaque = false
    shrinePanel.backgroundColor = .clear
    shrinePanel.hasShadow = true
    shrinePanel.hidesOnDeactivate = false
    shrinePanel.isMovableByWindowBackground = true

    let configuration = WKWebViewConfiguration()
    configuration.userContentController.add(self, name: "chaoticaShrine")
    webView = WKWebView(frame: shrinePanel.contentView?.bounds ?? .zero, configuration: configuration)
    webView.autoresizingMask = [.width, .height]
    webView.setValue(false, forKey: "drawsBackground")
    shrinePanel.contentView = webView
    guard let htmlURL = Bundle.main.url(forResource: "shrine", withExtension: "html") else { return }
    webView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
    positionOpenPanel()
  }

  private func makeGlyphPanel() {
    glyphPanel = ShrinePanel(contentRect: NSRect(origin: .zero, size: glyphSize), styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
    glyphPanel.isFloatingPanel = true
    glyphPanel.level = .floating
    glyphPanel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
    glyphPanel.isOpaque = false
    glyphPanel.backgroundColor = .clear
    glyphPanel.hasShadow = false
    glyphPanel.hidesOnDeactivate = false
    let wandView = NSImageView(frame: NSRect(origin: .zero, size: glyphSize))
    wandView.image = Bundle.main.url(forResource: "TruthWand", withExtension: "png").flatMap(NSImage.init(contentsOf:))
    wandView.imageScaling = .scaleProportionallyUpOrDown
    wandView.imageAlignment = .alignCenter
    glyphPanel.contentView = wandView
    positionGlyphPanel()
  }

  private func positionOpenPanel() {
    guard let screen = NSScreen.main else { return }
    let visible = screen.visibleFrame
    shrinePanel.setFrameOrigin(NSPoint(x: visible.maxX - openSize.width - 18, y: visible.midY - openSize.height / 2))
  }

  private func positionGlyphPanel() {
    guard let screen = NSScreen.main else { return }
    let visible = screen.visibleFrame
    glyphPanel.setFrameOrigin(NSPoint(x: visible.maxX - 88, y: visible.midY - glyphSize.height / 2))
  }

  private func makeStatusMenu() {
    statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    statusItem.button?.title = "✦"
    statusItem.button?.toolTip = "CHAOTICA Shrine"
    let menu = NSMenu()
    menu.addItem(withTitle: "Summon CHAOTICA Shrine", action: #selector(summonShrine), keyEquivalent: "")
    menu.addItem(withTitle: "Retract CHAOTICA Shrine", action: #selector(retractShrine), keyEquivalent: "")
    menu.addItem(NSMenuItem.separator())
    menu.addItem(withTitle: "Open The Assurer", action: #selector(openAssurer), keyEquivalent: "")
    menu.addItem(withTitle: "Open DA.EATER", action: #selector(openDaEater), keyEquivalent: "")
    menu.addItem(withTitle: "Open THICC.FITT", action: #selector(openThiccFitt), keyEquivalent: "")
    menu.addItem(NSMenuItem.separator())
    menu.addItem(withTitle: "Quit CHAOTICA Shrine", action: #selector(quit), keyEquivalent: "q")
    menu.items.forEach { $0.target = self }
    statusItem.menu = menu
  }

  private func beginShortcutMonitoring() {
    let inspect: (NSEvent) -> Void = { [weak self] event in self?.inspectShortcut(event) }
    localFlagsMonitor = NSEvent.addLocalMonitorForEvents(matching: .flagsChanged) { event in
      inspect(event)
      return event
    }
    globalFlagsMonitor = NSEvent.addGlobalMonitorForEvents(matching: .flagsChanged, handler: inspect)
  }

  private func inspectShortcut(_ event: NSEvent) {
    let flags = event.modifierFlags
    let matches = flags.contains(.command) && flags.contains(.option) && flags.contains(.control) && flags.contains(.function)
    if matches && !chordLatched {
      chordLatched = true
      DispatchQueue.main.async { [weak self] in self?.toggleShrine() }
    } else if !matches {
      chordLatched = false
    }
  }

  private func toggleShrine() {
    shrinePanel.isVisible ? retractShrine() : summonShrine()
  }

  @objc private func summonShrine() {
    positionOpenPanel()
    glyphPanel.orderOut(nil)
    shrinePanel.orderFrontRegardless()
    refreshSnapshot()
  }

  @objc private func retractShrine() {
    shrinePanel.orderOut(nil)
    positionGlyphPanel()
    glyphPanel.orderFrontRegardless()
  }

  @objc private func openAssurer() { openChaotica(route: "the-assurer") }
  @objc private func openDaEater() { openChaotica(route: "da-eater") }
  @objc private func openThiccFitt() { openChaotica(route: "thicc-fitt") }
  @objc private func quit() { NSApp.terminate(nil) }

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard message.name == "chaoticaShrine", let payload = message.body as? [String: String], payload["action"] == "open", let route = payload["route"], validRoutes.contains(route) else { return }
    openChaotica(route: route)
  }

  private func openChaotica(route: String) {
    let hostApp = URL(fileURLWithPath: "/Applications/CHAOTICA.app")
    let deepLink = URL(string: "chaotica://\(route)")!
    if FileManager.default.fileExists(atPath: hostApp.path) {
      let configuration = NSWorkspace.OpenConfiguration()
      configuration.activates = true
      NSWorkspace.shared.openApplication(at: hostApp, configuration: configuration) { _, _ in
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { NSWorkspace.shared.open(deepLink) }
      }
    } else {
      NSWorkspace.shared.open(URL(string: "https://www.tellnolies.app/\(route)")!)
    }
  }

  private func refreshSnapshot() {
    let snapshot = loadSnapshot()
    guard let data = try? JSONEncoder().encode(snapshot), let json = String(data: data, encoding: .utf8) else { return }
    let script = "window.ChaoticaShrine?.setSnapshot(\(json));"
    webView.evaluateJavaScript(script)
  }

  private func loadSnapshot() -> ShrineSnapshot {
    let url = FileManager.default.homeDirectoryForCurrentUser
      .appendingPathComponent("Library/Application Support/CHAOTICA/shrine-day.json")
    guard let data = try? Data(contentsOf: url), let snapshot = try? JSONDecoder().decode(ShrineSnapshot.self, from: data) else { return ShrineSnapshot() }
    return snapshot
  }
}

let app = NSApplication.shared
let delegate = ShrineDelegate()
app.delegate = delegate
app.run()
