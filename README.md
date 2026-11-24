# Pianoles

Pianoles is a browser-based piano course with 90 interactive lessons, from finding middle C to reading and playing two-hand pieces. The app includes standard notation, audio demonstrations, guided and timed practice, and progress saved in the current browser.

## Run locally

```sh
npm ci
npm run dev
```

Open the Vite URL under `/pianoles/`. Run `npm test` for the curriculum and practice checks and `npm run build` for the production build.

## Play

The course includes credited arrangements of public-domain tunes and classical excerpts alongside original exercises. Sustain studies show pedal cues below the keyboard and accept the on-screen pedal or a MIDI sustain pedal.

- Use touch or mouse on the piano, or follow the shortcut letters on the displayed keys.
- For a digital piano, connect USB or pair the Bluetooth MIDI device in the operating system, then select **Connect MIDI** in a browser that supports Web MIDI. Choose the input in the MIDI panel and play a note to check that it is received. Bluetooth works when the browser exposes the paired input.
- Use **Start guided** to work through the highlighted notes or **Timed practice** to play with the metronome. Choose a hand or loop a measure range for focused practice. Without MIDI, Guided offers a five-second count-in before tempo-based follow-along. Playing the first correct note or chord during the countdown starts interactive guidance instead.
- Share a specific lesson with a URL such as `/pianoles/#/lesson/18`.

- Use **Beat & duration** to see how long notes and rests last. The playhead moves during timed practice and demonstrations.
- Turn on **Kids mode** for large icons, slower demonstrations that lead into guided play, for the selected profile. Matching colored fingertips on the hand diagram and keyboard show suggested fingering in lessons that include it.

## Music theory

The **Music theory** category has keyboard-free lessons on treble clef (87), bass clef (88), note lengths and rests (89), and time signatures (90). Read and hear the examples, then answer the short quiz to complete the lesson.

## Profiles

Enter a name when you first open the app. Open **Profiles** to add another learner or switch to their latest lesson. Each profile has its own completed lessons, timed scores, and Kids mode setting. Profiles stay in this browser. Existing standard and Kids progress appears in **My profile** and **Kids**, respectively, when those older records are present.

## Contribute a lesson

Each lesson has its own YAML file. The contributor guide covers note syntax, fingering, sustain cues, and validation. [Read the lesson authoring guide](lessons/README.md)

## Publish

The **Publish Pianoles** workflow builds and publishes `main` to GitHub Pages. The repository's Pages source must be set to **GitHub Actions**. After selecting the source, run the workflow from the **Actions** tab or push to `main`.
