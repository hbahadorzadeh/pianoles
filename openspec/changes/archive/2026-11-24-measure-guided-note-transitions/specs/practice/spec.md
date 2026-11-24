## MODIFIED Requirements

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

### Requirement: Live timing feedback
In timed practice the app SHALL show whether a matched strike came early, on the beat, or late. In guided practice the app SHALL compare the interval between successive correct note groups to the written onset interval and color the preceding bar. Early timing SHALL use soft blue and late timing SHALL use muted red. Each color cue SHALL have a text label.

#### Scenario: Play a matched note early
- **WHEN** the learner plays the right note before its timing tolerance
- **THEN** the app shows an Early label and colors the corresponding bar blue

#### Scenario: Change to the next guided note too soon
- **WHEN** the learner plays the next correct note before the written interval has elapsed beyond the timing tolerance
- **THEN** the preceding bar stops filling and turns soft blue
