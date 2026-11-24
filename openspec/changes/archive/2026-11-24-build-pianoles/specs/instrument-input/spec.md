## ADDED Requirements

### Requirement: Browser and MIDI inputs
The app SHALL accept pointer, multitouch, computer-keyboard, and Web MIDI note events. It SHALL expose paired Bluetooth devices when the browser lists them as MIDI inputs.

#### Scenario: Disconnect the selected MIDI instrument
- **WHEN** a selected MIDI device disconnects while notes are held
- **THEN** the app releases those notes and keeps browser inputs available
