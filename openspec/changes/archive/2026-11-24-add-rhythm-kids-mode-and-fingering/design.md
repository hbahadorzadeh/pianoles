## Context

The lesson catalog has beat, duration, pitch, and hand data. Timed practice and the demonstration already run against the Web Audio clock.

## Goals / Non-Goals

Make rhythm and beginner fingering visible and let a pre-reader follow the same course using visual and audio cues. Keep existing timed scoring and routing.

## Decisions

- Draw one rhythm lane per selected hand. Align bars and rests to the measure and animate the playhead from the audio clock. Show the current note duration in guided mode.
- Give Kids mode large icon controls, persistent key hints, a slower tempo, and visual feedback. Start guided practice after a demonstration.
- Author the first 15 lessons' fingering around the taught hand positions. Match each fingertip to its key with color and number, and omit fingering where no suggested placement is provided.
- Store mode selection and each mode's progress locally, retaining the existing adult storage key.
