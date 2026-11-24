# progress-and-delivery Specification

## Purpose

Keep lesson progress in the learner’s browser and make the course available as a static GitHub Pages site.

## Requirements

### Requirement: Browser-local progress
The app SHALL save full guided completions, best full timed scores, and the most recent lesson locally. It SHALL remain playable when persistent storage is unavailable.

#### Scenario: Resume a session
- **WHEN** a learner revisits the course home URL
- **THEN** the app restores the most recently opened lesson and saved progress

### Requirement: Static deployment
The app SHALL build and deploy to the repository's GitHub Pages project path through GitHub Actions.

#### Scenario: Open the published course
- **WHEN** a learner opens the project Pages URL
- **THEN** the course loads its bundled assets and runs without an application server

### Requirement: Separate Kids mode progress
The app SHALL store Kids mode progress and the last Kids mode lesson independently from standard practice.

#### Scenario: Switch back to standard practice
- **WHEN** a learner exits Kids mode after completing a lesson
- **THEN** the app resumes the standard practice lesson with its own completion state
