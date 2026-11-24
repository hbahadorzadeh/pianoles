## ADDED Requirements

### Requirement: Optional key hints
The app SHALL highlight the keys to play when hints are enabled. Guided hints SHALL follow the current pitch group. Timed practice and demonstration hints SHALL follow the notes sounding in the selected passage.

#### Scenario: Advance in guided practice
- **WHEN** the learner enables hints and plays the current pitch group correctly
- **THEN** the keyboard highlights the next pitch group

#### Scenario: Reach a rest in timed practice
- **WHEN** enabled hints reach a rest with no sounding notes
- **THEN** the keyboard clears its hints until the next notes

#### Scenario: Disable hints during playback
- **WHEN** the learner turns off hints during a demonstration
- **THEN** the keyboard clears its hints immediately and playback continues
