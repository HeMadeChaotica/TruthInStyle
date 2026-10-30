import Foundation

struct ChaoticaStaffReminderConfiguration: Codable, Equatable {
  static let defaults = ChaoticaStaffReminderConfiguration(
    reminderTimes: ["10:00", "14:00", "18:00", "22:00"],
    summationTime: "00:01"
  )

  let reminderTimes: [String]
  let summationTime: String

  static var storageURL: URL {
    FileManager.default.homeDirectoryForCurrentUser
      .appendingPathComponent("Library/Application Support/CHAOTICA", isDirectory: true)
      .appendingPathComponent("staff-reminders.json")
  }

  static func validated(reminderTimes: [String], summationTime: String) -> ChaoticaStaffReminderConfiguration? {
    let normalizedReminders = reminderTimes.compactMap(normalize)
    guard !normalizedReminders.isEmpty,
          normalizedReminders.count == reminderTimes.count,
          let normalizedSummation = normalize(summationTime) else { return nil }
    return ChaoticaStaffReminderConfiguration(
      reminderTimes: Array(Set(normalizedReminders)).sorted(),
      summationTime: normalizedSummation
    )
  }

  static func load() -> ChaoticaStaffReminderConfiguration {
    guard let data = try? Data(contentsOf: storageURL),
          let decoded = try? JSONDecoder().decode(ChaoticaStaffReminderConfiguration.self, from: data),
          let validated = validated(reminderTimes: decoded.reminderTimes, summationTime: decoded.summationTime) else {
      return .defaults
    }
    return validated
  }

  func matches(hour: Int, minute: Int) -> (reminder: Bool, summation: Bool) {
    let current = String(format: "%02d:%02d", hour, minute)
    return (reminderTimes.contains(current), summationTime == current)
  }

  private static func normalize(_ raw: String) -> String? {
    let parts = raw.trimmingCharacters(in: .whitespacesAndNewlines).split(separator: ":", omittingEmptySubsequences: false)
    guard parts.count == 2,
          let hour = Int(parts[0]),
          let minute = Int(parts[1]),
          (0...23).contains(hour),
          (0...59).contains(minute) else { return nil }
    return String(format: "%02d:%02d", hour, minute)
  }
}
