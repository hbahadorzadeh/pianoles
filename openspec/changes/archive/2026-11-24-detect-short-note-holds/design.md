## Context

The practice engine tracks held keys and has each note's written duration and the selected tempo.

## Goals / Non-Goals

Report short holds independently for each pitch in a chord, including a bass note that continues while the melody changes.

## Decisions

- Track matched notes from their physical press to their final input release. Treat cancellation, loss of focus, and disconnect as cleanup.
- Allow the smaller of 180 milliseconds and one quarter of the written duration for ordinary separation between notes.
- Show a muted blue hold indicator and a Released early label independently from the existing onset result.
