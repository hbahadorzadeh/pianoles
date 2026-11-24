# lesson-catalog Specification

## Purpose

Guide learners from keyboard orientation through two-hand repertoire and give each lesson a shareable address.

## Requirements

### Requirement: Sequential curriculum
The course SHALL provide 24 numbered lessons with explanations, notation, demonstrations, and exercises, progressing from keyboard layout and notation to independent two-hand pieces.

#### Scenario: Open the final lesson
- **WHEN** a learner selects lesson 24
- **THEN** the app displays and plays a complete two-hand arrangement on a grand staff

### Requirement: Direct navigation
The app SHALL offer a scrollable catalog, number entry, and shareable lesson URLs.

#### Scenario: Reload a lesson link
- **WHEN** a learner refreshes a valid lesson URL on GitHub Pages
- **THEN** the corresponding lesson opens directly

#### Scenario: Open an invalid lesson link
- **WHEN** a learner opens an invalid lesson URL
- **THEN** the app provides a link back to the catalog
