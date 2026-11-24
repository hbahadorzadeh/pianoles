## Context

The browser app already renders, plays, and grades lessons from a shared note model. New lessons can use that model with original arrangements of historical works.

## Goals / Non-Goals

Offer recognizable pieces for practicing through the existing modes and provide a path for learners using an unconnected piano.

## Decisions

- Append lessons 25–36 in two groups. Credit the source tunes and identify excerpts, transpositions, and adaptations on each lesson.
- Make the catalog available in Kids mode so a specific arrangement can be selected directly.
- Without an open MIDI input, start a five-second count-in. Key hints and the score then follow the selected tempo. Follow-along playback does not record a guided completion.
- During the count-in, a correct first note group switches to interactive guidance. A connected MIDI instrument continues to use input-driven guidance.
