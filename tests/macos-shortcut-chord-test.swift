import Cocoa

@main
struct MacOSShortcutChordTest {
  static func main() {
    verifyOpenSequence()
    verifyCloseSequence()
    verifyOrderAndLatchProtection()
    print("macOS ordered shortcut recognizer passed")
  }

  private static func verifyOpenSequence() {
    let recognizer = ChaoticaModifierChordRecognizer()
    let inputs: [NSEvent.ModifierFlags] = [
      [.function],
      [.function, .control],
      [.function, .control, .option],
      [.function, .control, .option, .command]
    ]
    let results = inputs.map(recognizer.ingest)
    precondition(results.dropLast().allSatisfy { $0 == nil })
    precondition(results.last! == .open)
  }

  private static func verifyCloseSequence() {
    let recognizer = ChaoticaModifierChordRecognizer()
    let inputs: [NSEvent.ModifierFlags] = [
      [.command],
      [.command, .option],
      [.command, .option, .control],
      [.command, .option, .control, .function]
    ]
    let results = inputs.map(recognizer.ingest)
    precondition(results.dropLast().allSatisfy { $0 == nil })
    precondition(results.last! == .close)
  }

  private static func verifyOrderAndLatchProtection() {
    let recognizer = ChaoticaModifierChordRecognizer()
    precondition(recognizer.ingest([.function]) == nil)
    precondition(recognizer.ingest([.function, .option]) == nil)
    precondition(recognizer.ingest([.function, .option, .control]) == nil)
    precondition(recognizer.ingest([.function, .option, .control, .command]) == nil)
    precondition(recognizer.ingest([]) == nil)
    precondition(recognizer.ingest([.function]) == nil)
    precondition(recognizer.ingest([.function, .control]) == nil)
    precondition(recognizer.ingest([.function, .control, .option]) == nil)
    precondition(recognizer.ingest([.function, .control, .option, .command]) == .open)
    precondition(recognizer.ingest([.function, .control, .option, .command]) == nil)
  }
}
