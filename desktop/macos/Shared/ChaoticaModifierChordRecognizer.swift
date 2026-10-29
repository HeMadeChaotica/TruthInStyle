import Cocoa

enum ChaoticaShortcutAction: Equatable {
  case open
  case close
}

final class ChaoticaModifierChordRecognizer {
  private let trackedMask: NSEvent.ModifierFlags = [.function, .control, .option, .command]
  private let openSequence: [NSEvent.ModifierFlags] = [.function, .control, .option, .command]
  private let closeSequence: [NSEvent.ModifierFlags] = [.command, .option, .control, .function]
  private var previousFlags: NSEvent.ModifierFlags = []
  private var enteredSequence: [NSEvent.ModifierFlags] = []
  private var chordLatched = false

  func ingest(_ flags: NSEvent.ModifierFlags) -> ChaoticaShortcutAction? {
    let deviceFlags = flags.intersection(.deviceIndependentFlagsMask)
    let relevantFlags = deviceFlags.intersection(trackedMask)
    let unsupportedFlags = deviceFlags.subtracting(trackedMask)

    if relevantFlags.isEmpty {
      reset()
      return nil
    }

    guard unsupportedFlags.isEmpty else {
      resetProgress(keeping: relevantFlags)
      return nil
    }

    guard !chordLatched else {
      previousFlags = relevantFlags
      return nil
    }

    let removedFlags = previousFlags.subtracting(relevantFlags)
    guard removedFlags.isEmpty else {
      resetProgress(keeping: relevantFlags)
      return nil
    }

    let addedFlags = relevantFlags.subtracting(previousFlags)
    previousFlags = relevantFlags
    guard let addedModifier = singleModifier(in: addedFlags) else {
      enteredSequence.removeAll()
      return nil
    }

    enteredSequence.append(addedModifier)
    if enteredSequence == openSequence {
      chordLatched = true
      return .open
    }
    if enteredSequence == closeSequence {
      chordLatched = true
      return .close
    }

    if !isValidPrefix(enteredSequence) {
      enteredSequence = isValidPrefix([addedModifier]) ? [addedModifier] : []
    }
    return nil
  }

  private func singleModifier(in flags: NSEvent.ModifierFlags) -> NSEvent.ModifierFlags? {
    let matches = openSequence.filter { flags.contains($0) }
    return matches.count == 1 ? matches[0] : nil
  }

  private func isValidPrefix(_ candidate: [NSEvent.ModifierFlags]) -> Bool {
    openSequence.starts(with: candidate) || closeSequence.starts(with: candidate)
  }

  private func resetProgress(keeping flags: NSEvent.ModifierFlags) {
    enteredSequence.removeAll()
    previousFlags = flags
    chordLatched = false
  }

  private func reset() {
    enteredSequence.removeAll()
    previousFlags = []
    chordLatched = false
  }
}
