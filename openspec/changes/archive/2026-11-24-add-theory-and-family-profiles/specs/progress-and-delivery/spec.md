## MODIFIED Requirements

### Requirement: Browser-local progress
The app SHALL save guided and theory completions, best full timed scores, the most recent lesson, and the current view preference locally for each profile. It SHALL remain playable when persistent storage is unavailable.

#### Scenario: Resume a session
- **WHEN** a learner revisits the course home URL
- **THEN** the app restores the most recently opened lesson and saved progress

## ADDED Requirements

### Requirement: Named learning profiles
The app SHALL prompt for a learner name when no local profiles exist and offer controls to add and switch between profiles. It SHALL migrate earlier standard and Kids progress into separate profiles.

#### Scenario: Switch to another learner
- **WHEN** a household member selects their named profile
- **THEN** their saved lesson, scores, completion state, and Kids mode preference are restored

## REMOVED Requirements

### Requirement: Separate Kids mode progress
**Reason**

Named profiles now separate learners. Kids mode is a preference within a profile.

**Migration**

Import separate earlier progress as distinct local profiles.
