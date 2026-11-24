## Context

The player and theory views share the numbered catalog. Existing browsers may have separate progress records for standard and Kids modes.

## Goals / Non-Goals

Teach notation without requiring a piano and let multiple learners share one browser. Keep profiles local.

## Decisions

- Add a validated theory lesson kind. Render real notation plus audible examples, and mark a lesson complete after a correct quiz.
- Ask for a name when no profiles exist. Show a profile selector, with an add action, and reopen the selected learner's latest lesson.
- Store completed lessons, best scores, the latest lesson, and Kids mode individually per profile. Import the two prior progress records as separate profiles when available.
- Leave published playing exercises and lesson links in place.
