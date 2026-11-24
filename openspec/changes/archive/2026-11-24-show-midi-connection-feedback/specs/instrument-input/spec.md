## ADDED Requirements

### Requirement: Visible MIDI connection and input feedback
The app SHALL show access and connection status next to Connect MIDI. It SHALL offer actionable feedback when access is blocked or no input is detected, and SHALL show the latest note received from an opened input.

#### Scenario: Browser permission is blocked
- **WHEN** the browser rejects a MIDI permission request
- **THEN** the panel identifies the blocked access and offers a retry

#### Scenario: Test an opened input
- **WHEN** the learner sends a note from the selected input and the MIDI panel is open
- **THEN** the panel displays the received note name
