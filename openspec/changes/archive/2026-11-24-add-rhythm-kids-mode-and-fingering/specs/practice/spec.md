## ADDED Requirements

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
