# progress-and-delivery Specification

## Purpose

Keep lesson progress in the learner’s browser and make the course available as a static GitHub Pages site.

## Requirements

### Requirement: Browser-local progress
The app SHALL save guided and theory completions, best full timed scores, the most recent lesson, and the current view preference locally for each profile. It SHALL remain playable when persistent storage is unavailable.

#### Scenario: Resume a session
- **WHEN** a learner revisits the course home URL
- **THEN** the app restores the most recently opened lesson and saved progress

### Requirement: Static deployment
The app SHALL build and deploy to the repository's GitHub Pages project path through GitHub Actions.

#### Scenario: Open the published course
- **WHEN** a learner opens the project Pages URL
- **THEN** the course loads its bundled assets and runs without an application server

### Requirement: Named learning profiles
The app SHALL prompt for a learner name when no local profiles exist and offer controls to add and switch between profiles. It SHALL migrate earlier standard and Kids progress into separate profiles.

#### Scenario: Switch to another learner
- **WHEN** a household member selects their named profile
- **THEN** their saved lesson, scores, completion state, and Kids mode preference are restored

### Requirement: Public course discovery
The published homepage SHALL include a plain HTML course overview, a canonical URL, a page title and description, structured application metadata, and social sharing metadata. The project SHALL publish an XML sitemap containing the canonical homepage URL.

#### Scenario: Read the homepage with scripts disabled
- **WHEN** a visitor or crawler fetches the homepage without running JavaScript
- **THEN** the course overview and discovery metadata are available in the HTML

#### Scenario: Enter a lesson from the homepage
- **WHEN** a new visitor opens a lesson link from the public overview and creates a local profile
- **THEN** the app opens the selected lesson
