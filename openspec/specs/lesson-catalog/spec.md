# lesson-catalog Specification

## Purpose

Guide learners from keyboard orientation through two-hand repertoire and give each lesson a shareable address.

## Requirements

### Requirement: Sequential curriculum
The course SHALL provide at least 90 numbered lessons with explanations, notation, demonstrations, and exercises, progressing from keyboard layout and notation to independent two-hand pieces and credited public-domain arrangements. Existing lesson numbers SHALL remain stable.

#### Scenario: Open the original course finale
- **WHEN** a learner selects lesson 24
- **THEN** the app displays and plays a complete two-hand arrangement on a grand staff

#### Scenario: Select the final repertoire study
- **WHEN** a learner selects lesson 36
- **THEN** the app opens a credited two-hand study from Bach’s Prelude in C

#### Scenario: Select the new course finale
- **WHEN** a learner selects lesson 86
- **THEN** the app opens a credited Chopin study with both hands and sustain cues

#### Scenario: Practice reading a clef
- **WHEN** a learner opens lesson 87 or 88
- **THEN** the lesson teaches landmarks, lines, and spaces before giving mixed reading practice in that clef

### Requirement: Direct navigation
The app SHALL offer a scrollable catalog, number entry, and shareable lesson URLs.

#### Scenario: Reload a lesson link
- **WHEN** a learner refreshes a valid lesson URL on GitHub Pages
- **THEN** the corresponding lesson opens directly

#### Scenario: Open an invalid lesson link
- **WHEN** a learner opens an invalid lesson URL
- **THEN** the app provides a link back to the catalog

### Requirement: Independent YAML lessons
Each lesson SHALL have its own validated YAML file with metadata and either playing parts with optional fingering and sustain cues or theory examples and quiz questions. The app SHALL discover files without application code changes. The repository SHALL link to a lesson contributor guide.

#### Scenario: Add a lesson through YAML
- **WHEN** a contributor adds the next valid numbered lesson file
- **THEN** the lesson appears at its numbered route after the catalog builds

### Requirement: Keyboard-free music theory
The catalog SHALL include a Music theory category with interactive lessons covering treble clef, bass clef, note and rest lengths, and time signatures. These lessons SHALL use notation, listening examples, and quiz answers without requiring a piano keyboard.

#### Scenario: Study time signatures
- **WHEN** a learner opens lesson 90
- **THEN** the lesson demonstrates 2/4, 3/4, 4/4, 6/8, and 2/2 and offers questions to check their understanding
