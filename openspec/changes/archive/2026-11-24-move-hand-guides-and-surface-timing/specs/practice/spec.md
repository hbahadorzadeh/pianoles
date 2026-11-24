## MODIFIED Requirements

### Requirement: Visual beat and duration
The app SHALL draw note and rest lengths proportionally against beat markers, with a lane per selected hand. In timed practice and demonstrations, the cursor and each bar's fill SHALL follow the audio clock. In guided practice, the cursor SHALL follow the current position and the note bars SHALL fill at the selected tempo while the app waits for input.

#### Scenario: Contrast note lengths
- **WHEN** a learner compares a one-beat note and a two-beat note
- **THEN** their bars span one and two beat intervals respectively

#### Scenario: Follow a sustained note
- **WHEN** playback is halfway through a note
- **THEN** its duration bar is half full and its note remains highlighted on the score

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
