import Cocoa
import WebKit

private let validRoutes: Set<String> = ["the-assurer", "the-summation", "hopewood", "525600"]

final class ShrinePanel: NSPanel {
  override var canBecomeKey: Bool { true }
  override var canBecomeMain: Bool { false }
}

final class ShrineDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler {
  private var panel: ShrinePanel!
  private var statusItem: NSStatusItem!
  private var isPinned = true

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.accessory)
    makePanel()
    makeStatusMenu()
    showShrine()
  }

  private func makePanel() {
    let frame = NSRect(x: 0, y: 0, width: 370, height: 500)
    panel = ShrinePanel(
      contentRect: frame,
      styleMask: [.borderless, .resizable, .fullSizeContentView],
      backing: .buffered,
      defer: false
    )
    panel.title = "CHAOTICA Shrine"
    panel.isFloatingPanel = true
    panel.level = .floating
    panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
    panel.isOpaque = false
    panel.backgroundColor = .clear
    panel.hasShadow = true
    panel.minSize = NSSize(width: 290, height: 390)
    panel.maxSize = NSSize(width: 560, height: 720)
    panel.isMovableByWindowBackground = true
    panel.hidesOnDeactivate = false

    let configuration = WKWebViewConfiguration()
    configuration.userContentController.add(self, name: "chaoticaShrine")
    let webView = WKWebView(frame: panel.contentView?.bounds ?? .zero, configuration: configuration)
    webView.autoresizingMask = [.width, .height]
    webView.setValue(false, forKey: "drawsBackground")
    panel.contentView = webView

    guard let htmlURL = Bundle.main.url(forResource: "shrine", withExtension: "html") else { return }
    webView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
    panel.center()
    if let screen = NSScreen.main {
      let visible = screen.visibleFrame
      panel.setFrameOrigin(NSPoint(x: visible.maxX - panel.frame.width - 26, y: visible.minY + 42))
    }
  }

  private func makeStatusMenu() {
    statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    statusItem.button?.title = "✦"
    statusItem.button?.toolTip = "CHAOTICA Shrine"
    let menu = NSMenu()
    menu.addItem(withTitle: "Show CHAOTICA Shrine", action: #selector(showShrine), keyEquivalent: "")
    menu.addItem(withTitle: "Hide CHAOTICA Shrine", action: #selector(hideShrine), keyEquivalent: "")
    menu.addItem(NSMenuItem.separator())
    menu.addItem(withTitle: "Open The Assurer", action: #selector(openAssurer), keyEquivalent: "")
    menu.addItem(withTitle: "Open THE.SUMMATION", action: #selector(openSummation), keyEquivalent: "")
    menu.addItem(withTitle: "Open HOPEWOOD", action: #selector(openHopewood), keyEquivalent: "")
    menu.addItem(NSMenuItem.separator())
    menu.addItem(withTitle: "Pin Above Other Windows", action: #selector(togglePin), keyEquivalent: "")
    menu.addItem(NSMenuItem.separator())
    menu.addItem(withTitle: "Quit CHAOTICA Shrine", action: #selector(quit), keyEquivalent: "q")
    menu.items.forEach { $0.target = self }
    statusItem.menu = menu
  }

  @objc private func showShrine() {
    panel.orderFrontRegardless()
  }

  @objc private func hideShrine() {
    panel.orderOut(nil)
  }

  @objc private func openAssurer() { openChaotica(route: "the-assurer") }
  @objc private func openSummation() { openChaotica(route: "the-summation") }
  @objc private func openHopewood() { openChaotica(route: "hopewood") }

  @objc private func togglePin() {
    isPinned.toggle()
    panel.level = isPinned ? .floating : .normal
  }

  @objc private func quit() { NSApp.terminate(nil) }

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard message.name == "chaoticaShrine",
          let payload = message.body as? [String: String],
          payload["action"] == "open",
          let route = payload["route"],
          validRoutes.contains(route) else { return }
    openChaotica(route: route)
  }

  private func openChaotica(route: String) {
    let hostApp = URL(fileURLWithPath: "/Applications/CHAOTICA.app")
    let deepLink = URL(string: "chaotica://\(route)")!

    if FileManager.default.fileExists(atPath: hostApp.path) {
      let configuration = NSWorkspace.OpenConfiguration()
      configuration.activates = true
      configuration.arguments = ["--route", route]
      NSWorkspace.shared.openApplication(at: hostApp, configuration: configuration) { _, _ in
        // Arguments open the correct route on a fresh launch. The scheme also
        // reaches an already running CHAOTICA instance.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
          NSWorkspace.shared.open(deepLink)
        }
      }
      return
    }

    // A browser remains a safe fallback if the main CHAOTICA app was moved.
    NSWorkspace.shared.open(URL(string: "https://www.tellnolies.app/\(route)")!)
  }
}

let app = NSApplication.shared
let shrineDelegate = ShrineDelegate()
app.delegate = shrineDelegate
app.run()
