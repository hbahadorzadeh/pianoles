## MODIFIED Requirements

### Requirement: Visual beat and duration
The app SHALL draw note and rest lengths proportionally against beat markers, with a lane per selected hand. In timed practice and demonstrations, the cursor and each bar's fill SHALL follow the audio clock. In guided practice, the cursor SHALL follow the current position.

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

### Requirement: Suggested fingering
The app SHALL show authored finger suggestions in lessons 1–15 with corresponding shapes and colors on the hand diagram and at the bottom of the piano keys.

#### Scenario: Use the right thumb for middle C
- **WHEN** the learner starts guided practice in lesson 1 with finger hints enabled
- **THEN** the right hand's thumb and middle C show matching thumb shapes

## ADDED Requirements

### Requirement: Live timing feedback
In timed practice the app SHALL show whether a matched strike came early, on the beat, or late. Early strikes SHALL use blue and late strikes SHALL use red. Each color cue SHALL have a text label.

#### Scenario: Play a matched note early
- **WHEN** the learner plays the right note before its timing tolerance
- **THEN** the app shows an Early label and colors the corresponding bar blue
