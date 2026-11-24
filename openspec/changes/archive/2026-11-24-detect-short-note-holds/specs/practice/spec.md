## ADDED Requirements

### Requirement: Early note release feedback
Guided and timed practice SHALL indicate when a matched note is released too early for its written duration at the selected tempo, independently of the next note's onset. The app SHALL track each pitch in a chord independently.

#### Scenario: Shorten a note and play the next note on time
- **WHEN** a learner releases a matched note substantially before its written duration and plays the next note on time
- **THEN** the app shows the early release and the on-beat transition separately

#### Scenario: Disconnect a MIDI instrument
- **WHEN** a MIDI device disconnects while holding a matched note
- **THEN** the app clears the hold without issuing an early-release result
