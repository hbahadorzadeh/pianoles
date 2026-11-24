## Context

Start with an empty public repository and target the GitHub Pages project path.

## Goals / Non-Goals

Deliver a usable course from keyboard orientation through independent two-hand repertoire. Support private, browser-local progress. Microphone recognition and account syncing are out of scope.

## Decisions

- Use Vite, TypeScript, and VexFlow. A bundled lesson model carries pitch, spelling, hand, onset, and duration for notation, audio, and scoring.
- Hash-based numbered routes support direct reloads on static hosting. Use a versioned storage key and fall back to memory.
- Normalize input to MIDI note numbers and maintain held notes by input source. Pair Bluetooth MIDI through the operating system.
- Guided grading compares fresh presses against expected pitch groups. Timed grading uses a fixed onset tolerance and reports pitch and timing separately. Filter practice by hand and measure range.
- Publish a tested production build through GitHub Actions.
