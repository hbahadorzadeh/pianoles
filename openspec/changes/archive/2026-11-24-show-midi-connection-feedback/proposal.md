## Why

MIDI feedback appears below the piano, so a request with no visible browser prompt can look like it did nothing.

## What Changes

Show connection progress, instructions, input selection, and test-note feedback beside Connect MIDI.

## Capabilities

### Modified Capabilities

- `instrument-input`: Visible Web MIDI connection and input feedback.

## Impact

The header gains a MIDI panel and the app checks that the selected input opens before reporting it connected.
