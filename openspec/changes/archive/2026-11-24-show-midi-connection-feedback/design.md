## Context

Web MIDI access may be pending, unavailable, or granted without an instrument. Each outcome needs visible feedback near the control that initiated the request.

## Goals / Non-Goals

Make browser and operating-system MIDI connection states actionable in Pianoles. Use the browser's Web MIDI inputs and operating-system Bluetooth pairing.

## Decisions

- Open a nonmodal MIDI panel beside the header control. Show the access and device status there and provide a retry control.
- Confirm the selected input opens before reporting it connected. Show its most recent note-on event so learners can test reception.
- Keep the session connected when closing the panel and release held MIDI notes when the selected input changes or disconnects.
