# lesson-catalog Specification

## Purpose

Guide learners from keyboard orientation through two-hand repertoire and give each lesson a shareable address.

## Requirements

### Requirement: Sequential curriculum
The course SHALL provide 36 numbered lessons with explanations, notation, demonstrations, and exercises, progressing from keyboard layout and notation to independent two-hand pieces and credited public-domain arrangements. Existing lesson numbers SHALL remain stable.

#### Scenario: Open the original course finale
- **WHEN** a learner selects lesson 24
- **THEN** the app displays and plays a complete two-hand arrangement on a grand staff

#### Scenario: Select the final repertoire study
- **WHEN** a learner selects lesson 36
- **THEN** the app opens a credited two-hand study from Bach’s Prelude in C

### Requirement: Direct navigation
The app SHALL offer a scrollable catalog, number entry, and shareable lesson URLs.

#### Scenario: Reload a lesson link
- **WHEN** a learner refreshes a valid lesson URL on GitHub Pages
- **THEN** the corresponding lesson opens directly

#### Scenario: Open an invalid lesson link
- **WHEN** a learner opens an invalid lesson URL
- **THEN** the app provides a link back to the catalog
