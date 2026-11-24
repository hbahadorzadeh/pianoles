# practice Specification

## Purpose

Help learners connect written notation to piano keys and build pitch accuracy and rhythm through focused practice.

## Requirements

### Requirement: Guided pitch feedback
The app SHALL present the active score above the keyboard and advance on correct notes or chords, with feedback on mistakes.

#### Scenario: Play a chord
- **WHEN** a learner presses every pitch of the expected chord together
- **THEN** the exercise advances to the next playable event

### Requirement: Timed and focused practice
The app SHALL offer a count-in, metronome, adjustable tempo, separate pitch and timing scores, hand selection, and measure looping.

#### Scenario: Repeat a passage with one hand
- **WHEN** a learner selects one hand and enables a measure loop
- **THEN** practice repeats the selected passage and grades pitches for that hand

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

### Requirement: Visual beat and duration
The app SHALL draw note and rest lengths proportionally against beat markers, with a lane per selected hand. In timed practice and demonstrations, the cursor and each bar's fill SHALL follow the audio clock. In guided practice, the bar SHALL remain empty until the learner plays the first correct note group, then fill at the selected tempo from each accepted onset.

#### Scenario: Contrast note lengths
- **WHEN** a learner compares a one-beat note and a two-beat note
- **THEN** their bars span one and two beat intervals respectively

#### Scenario: Follow a sustained note
- **WHEN** playback is halfway through a note
- **THEN** its duration bar is half full and its note remains highlighted on the score

#### Scenario: Start guided practice
- **WHEN** the learner selects Start guided
- **THEN** the first note is cued and the progress bar waits for the first correct note group

### Requirement: Pre-reader practice
The app SHALL offer Kids mode with large icon controls, slower demonstrations, key hints, visible notation, and visible feedback when retrying or completing a lesson. The score SHALL follow the active measure.

#### Scenario: Follow a demonstration
- **WHEN** a demonstration ends in Kids mode
- **THEN** guided practice starts with the first key or chord highlighted

#### Scenario: Follow the score
- **WHEN** guided practice reaches a new measure in Kids mode
- **THEN** the score brings that measure into view and highlights the note to play

#### Scenario: Practice to the beat in Kids mode
- **WHEN** the learner presses the clock control in Kids mode
- **THEN** timed practice starts and shows early, on-beat, and late feedback for matched strikes

### Requirement: Suggested fingering
The app SHALL show authored finger suggestions in lessons 1–15 with whole hand diagrams that move beneath the target keys, with matching colors on the active fingertips and keys.

#### Scenario: Use the right thumb for middle C
- **WHEN** the learner starts guided practice in lesson 1 with finger hints enabled
- **THEN** the right hand moves below middle C and its thumb matches the accent on the key

### Requirement: Live timing feedback
In timed practice the app SHALL show whether a matched strike came early, on the beat, or late. In guided practice the app SHALL compare the interval between successive correct note groups to the written onset interval and color the preceding bar. Early timing SHALL use soft blue and late timing SHALL use muted red. Each color cue SHALL have a text label.

#### Scenario: Play a matched note early
- **WHEN** the learner plays the right note before its timing tolerance
- **THEN** the app shows an Early label and colors the corresponding bar blue

#### Scenario: Change to the next guided note too soon
- **WHEN** the learner plays the next correct note before the written interval has elapsed beyond the timing tolerance
- **THEN** the preceding bar stops filling and turns soft blue

### Requirement: Early note release feedback
Guided and timed practice SHALL indicate when a matched note is released too early for its written duration at the selected tempo, independently of the next note's onset. The app SHALL track each pitch in a chord independently.

#### Scenario: Shorten a note and play the next note on time
- **WHEN** a learner releases a matched note substantially before its written duration and plays the next note on time
- **THEN** the app shows the early release and the on-beat transition separately

#### Scenario: Disconnect a MIDI instrument
- **WHEN** a MIDI device disconnects while holding a matched note
- **THEN** the app clears the hold without issuing an early-release result

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

### Requirement: Written sustain pedal cues
For lessons containing sustain cues, the app SHALL show pedal spans against the rhythm grid and display a press or lift cue when the pedal state differs from the written state. Demonstrations and follow-along playback SHALL honor the written sustain.

#### Scenario: Follow a pedal change
- **WHEN** the score reaches a written sustain lift while the learner's pedal is down
- **THEN** the pedal display cues the learner to lift
