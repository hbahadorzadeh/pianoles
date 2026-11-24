## ADDED Requirements

### Requirement: Follow-along without MIDI
When the learner starts guided practice without an open MIDI input, the app SHALL show a five-second countdown and then play the selected passage at the selected tempo, following the score and highlighting the keys. Automatic playback SHALL leave completion and scores untouched.

#### Scenario: Prepare and follow a passage
- **WHEN** the countdown reaches zero without a correct first note group being played
- **THEN** tempo-based playback starts

#### Scenario: Play the first note group during the countdown
- **WHEN** the learner plays the correct first note group before the countdown ends
- **THEN** interactive guidance advances from that input and cancels automatic playback

#### Scenario: Start with an open MIDI input
- **WHEN** a learner starts guided practice with an open MIDI input
- **THEN** the app waits for the first correct note group
