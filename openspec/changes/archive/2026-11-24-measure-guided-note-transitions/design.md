## Context

Guided practice highlights the next pitch group and has access to all written onsets and durations.

## Goals / Non-Goals

Show timing feedback in guided practice while allowing the learner to advance whenever they play the correct pitches.

## Decisions

- Start the bar from the accepted key or chord, using the selected tempo.
- Measure the elapsed time between accepted groups against their written onset interval, including rests and loop boundaries.
- Freeze and tint the previous bar at the transition. Keep a small feedback bar visible when the main timeline moves to another measure.
- Share the existing timing tolerance and use muted blue and red in both practice views.
