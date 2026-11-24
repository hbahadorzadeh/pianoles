## Context

The course previously stored its notes and fingerings in TypeScript. The app already validates pitches and grades physical key holds.

## Goals / Non-Goals

Allow a contributor to add an entire playable lesson without editing application code. Represent and play sustain without changing the existing physical key-release feedback.

## Decisions

- Use `lessons/NNN-slug/lesson.yaml` for each lesson. Validate at build time and use a Vite module to bundle the parsed catalog. Automatically refresh the catalog when lesson files change in development.
- Store fingering beside its note and sustain cues as measure, beat, and down/up. Preserve the original 36 published lesson IDs and content.
- Draw sustain spans against the rhythm grid, show press and lift cues beside the on-screen pedal, and extend demonstration audio according to the written pedal.
- Accept MIDI control change 64 and a touch or mouse toggle. Track released keys separately from sustained sound.
