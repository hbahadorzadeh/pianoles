# instrument-input Specification

## Purpose

Let learners play exercises using a digital piano or the input devices already available in their browser.

## Requirements

### Requirement: Browser and MIDI inputs
The app SHALL accept pointer, multitouch, computer-keyboard, and Web MIDI note events. It SHALL expose paired Bluetooth devices when the browser lists them as MIDI inputs.

#### Scenario: Disconnect the selected MIDI instrument
- **WHEN** a selected MIDI device disconnects while notes are held
- **THEN** the app releases those notes and keeps browser inputs available

### Requirement: Compact keyboard for two-hand lessons
The app SHALL use narrower on-screen keys in two-hand lessons when a narrow display would otherwise hide part of the playable range.

#### Scenario: Open the final lesson on a narrow phone
- **WHEN** a learner opens the final lesson on a 320 CSS pixel-wide screen
- **THEN** the keyboard can show the entire pitch range used by the lesson at once

### Requirement: Visible MIDI connection and input feedback
The app SHALL show access and connection status next to Connect MIDI. It SHALL offer actionable feedback when access is blocked or no input is detected, and SHALL show the latest note received from an opened input.

#### Scenario: Browser permission is blocked
- **WHEN** the browser rejects a MIDI permission request
- **THEN** the panel identifies the blocked access and offers a retry

#### Scenario: Test an opened input
- **WHEN** the learner sends a note from the selected input and the MIDI panel is open
- **THEN** the panel displays the received note name
