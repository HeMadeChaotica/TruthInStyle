import Cocoa

@main
struct MacOSShortcutChordTest {
  static func main() {
    verifyOpenSequence()
    verifyCloseSequence()
    verifyOrderAndLatchProtection()
    verifyReminderConfiguration()
    print("macOS ordered shortcut recognizer passed")
  }

  private static func verifyReminderConfiguration() {
    let configuration = ChaoticaStaffReminderConfiguration.validated(
      reminderTimes: ["9:05", "14:00", "14:00"],
      summationTime: "0:01"
    )
    precondition(configuration?.reminderTimes == ["09:05", "14:00"])
    precondition(configuration?.summationTime == "00:01")
    precondition(configuration?.matches(hour: 9, minute: 5).reminder == true)
    precondition(configuration?.matches(hour: 0, minute: 1).summation == true)
    precondition(ChaoticaStaffReminderConfiguration.validated(reminderTimes: ["25:00"], summationTime: "00:01") == nil)
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
