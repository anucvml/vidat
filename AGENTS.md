# AGENTS.md

This file provides guidance to AI Agents when working with code in this repository.

## Overview

Vidat is an in-browser video annotation tool for computer vision / ML (developed by ANU CVML). It runs entirely client-side: videos are decoded into frames in the browser, annotations are created over those frames, and everything is exported as a single JSON file. There is no required server — an optional backend (`tools/`) only exists for crowd-sourced submission workflows (e.g. Amazon Mechanical Turk).

## Commands

```bash
npm run dev      # Vite dev server (auto-opens browser, binds 0.0.0.0)
npm run build    # Production build into dist/
npm run preview  # Preview the production build
```

There is no test suite, linter config beyond Prettier, or typechecker. Formatting is enforced by Prettier (config lives in `package.json`): no semicolons, single quotes, `printWidth` 120, `singleAttributePerLine`, and import sorting via `@trivago/prettier-plugin-sort-imports`.

Deployment is automatic: pushing to `main` triggers `.github/workflows/cd.yaml`, which builds, zips `dist/`, publishes a pre-release, and optionally rsyncs to a host over SSH. Hosting just requires serving the static `dist/` behind any web server — opening `index.html` from the filesystem does **not** work (it uses hash-based routing and module loading).

## Tech Stack

Vue 3 (Composition API, `<script setup>`) + Quasar 2 (UI framework) + Pinia (state) + Vue Router (hash history) + Vite. Monaco editor is used for the in-app JSON config editor. `~` is aliased to `src/` (see `vite.config.js` and `jsconfig.json`).

The build defines a global `PACKAGE_VERSION` (injected from `package.json` version) — referenced directly in code (e.g. version checks in `src/hooks/annotation.js`), not imported.

## Architecture

### State: three Pinia stores are the backbone

- **`store/annotation.js`** — the working annotation document: the loaded video metadata, keyframe list, and the per-frame annotation maps (`objectAnnotationListMap`, `regionAnnotationListMap`, `skeletonAnnotationListMap`) plus `actionAnnotationList`. Also holds transient editor state (current frames, `mode`, edit flags like `delMode`/`copyMode`/`addPointMode`, and the frame-caching queues). Key methods: `reset`, `exportAnnotation`, `importAnnotation`. Annotation maps are keyed by frame index; on import, plain objects are rehydrated into annotation classes.
- **`store/configuration.js`** — the label schema: `objectLabelData`, `actionLabelData`, `skeletonTypeData`. Persisted to `localStorage`. Validated via `store/validation.js` on import.
- **`store/preference.js`** — user settings (sensitivity, default fps/fpk, decoder choice, which modes are visible, mute/grayscale/popup). Persisted to `localStorage`.
- **`store/index.js`** — small `main` store for cross-cutting UI flags (`drawer`, `zoom`, `isSaved`, `submitURL`, `videoFormat`).

The save/dirty state is tracked automatically: a deep `watch` in the annotation store sets `mainStore.isSaved = false` on any annotation change, and a `beforeunload` handler (in `App.vue`) warns on unsaved exit.

### Annotation data model: `libs/annotationlib.js`

Defines the class hierarchy `Annotation` → `ObjectAnnotation` (bounding box), `RegionAnnotation` (polygon), `SkeletonAnnotation` (pose), and `ActionAnnotation` (temporal segment). Each class knows how to `draw()` itself onto a canvas context (scaling from video pixel coords to canvas coords) and `clone()` itself. These classes read from the stores directly (e.g. resolving a `labelId` to a color via the configuration store), so they are tightly coupled to the Pinia setup — don't instantiate them outside the running app.

### Pages (routes in `router/index.js`)

- `pages/annotation/` — the main workspace (default route `/`). `Annotation.vue` composes `CanvasPanel.vue` (the large canvas-drawing component, ~1300 lines, handles all mouse interaction and rendering per mode), `ControlPanel.vue`, `KeyframePanel.vue`, and per-mode tables (`ObjectTable`, `RegionTable`, `SkeletonTable`, `ActionTable`).
- `pages/configuration/` — edit the label schema (object labels, action labels, skeleton types) with table editors and a skeleton preview.
- `pages/preference/`, `pages/help/`, `pages/about/`, `pages/notfound/`.

### Video decoding: two interchangeable decoders

The most subtle part of the codebase. A video is turned into an array of cached frame images:

- **`components/VideoLoaderV1.vue`** — canvas-based decoder; seeks/draws/plays the `<video>` element frame by frame. Slow but maximally compatible.
- **`components/VideoLoaderV2.vue`** — uses `WebCodecs.VideoDecoder` via a web worker (`worker/video-process-worker.js`), which demuxes MP4 with `mp4box` (including a range-request "probe for moov" strategy so remote videos don't need a full download). Much faster but needs browser support and MP4.

The `decoder` preference (`auto`/`v1`/`v2`) picks between them. Frames are extracted at `defaultFps` and cached; a priority-queue caching scheme (see `annotation.js` `priorityQueue`/`backendQueue`/`cachedFrameList` and `doc/img/cache-frames-with-priority-queue.png`) loads frames near the current view first.

### Hooks (`src/hooks/`)

Composition-API helpers shared across components: `annotation.js` (load/save/submit annotation files, version checking), `video.js` (open/close video with confirm dialogs), `frameIndicator.js`.

### URL parameters & integration

`App.vue` parses `window.location.search` on startup to drive everything: `annotation`/`video`/`config` (load remote files), `mode`, `submitURL` (enables a POST-submit button for MTurk-style workflows), plus preference overrides. Param keys/values are case-insensitive. The full list and the JSON file formats are documented in `README.md`. Remote `annotation`/`video`/`config`/`submitURL` are subject to CORS.

### Optional backend (`tools/`)

Not part of the app build. `tools/backend/` is a sample Node/Express server demonstrating the submission API; `tools/python/` has Python helpers. The submission contract (POST annotation JSON to `submitURL`, get back a notify message) is documented in `README.md`.
