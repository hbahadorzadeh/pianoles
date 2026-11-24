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
The app SHALL draw note and rest lengths proportionally against beat markers, with a lane per selected hand. Its cursor SHALL follow the audio clock in timed practice and demonstrations and follow the current position in guided practice.

#### Scenario: Contrast note lengths
- **WHEN** a learner compares a one-beat note and a two-beat note
- **THEN** their bars span one and two beat intervals respectively

### Requirement: Pre-reader practice
The app SHALL offer Kids mode with large icon controls, slower demonstrations, key hints, and visible feedback when retrying or completing a lesson.

#### Scenario: Follow a demonstration
- **WHEN** a demonstration ends in Kids mode
- **THEN** guided practice starts with the first key or chord highlighted

### Requirement: Suggested fingering
The app SHALL show authored finger suggestions in lessons 1–15 with corresponding hand and keyboard markers.

#### Scenario: Use the right thumb for middle C
- **WHEN** the learner starts guided practice in lesson 1 with finger hints enabled
- **THEN** the right hand's thumb and middle C show matching markers
