## Context

The standalone app renders the score, practice timeline, and finger hints from the same lesson data.

## Goals / Non-Goals

Connect the score to the keyboard in Kids mode and distinguish beat length from the timing of a played note. Keep guided practice self-paced.

## Decisions

- Show one measure at a time in Kids mode and follow the active score position.
- Use the same colored finger shape on the key and hand diagram. Keep suggested finger numbers available to assistive technology.
- Fill duration bars from the Web Audio clock. Pair a timed input with the nearest unclaimed same-pitch onset within 450 milliseconds. Use the existing 180 millisecond tolerance for the on-beat label. Show blue for early and red for late, with text labels.
