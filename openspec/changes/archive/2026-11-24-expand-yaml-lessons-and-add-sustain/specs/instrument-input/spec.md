## ADDED Requirements

### Requirement: Live sustain pedal input
The app SHALL accept on-screen sustain and MIDI control change 64, show the current pedal state, and keep released notes sounding until the pedal lifts. Physical key-release feedback SHALL use the key release time.

#### Scenario: Release a MIDI note with the pedal down
- **WHEN** a learner releases a MIDI key while sustain is active
- **THEN** the app keeps the note ringing until the pedal lifts and still records the physical key release
