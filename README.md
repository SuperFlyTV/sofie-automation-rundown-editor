# Sofie Rundown Editor

## Prerequisites

Sofie Rundown Editor requires that you have a working instance of [Sofie Core](https://github.com/nrkno/tv-automation-server-core) release 37 with the [spreadsheet blueprints](https://github.com/SuperFlyTV/sofie-blueprints-spreadsheet) uploaded to it.

> ❗ At this time, the [`feat/rundown-editor-2`](https://github.com/SuperFlyTV/sofie-blueprints-spreadsheet/tree/feat/rundown-editor-2) branch of `sofie-blueprints-spreadsheet` is required.

## Installation

Head to the [releases](https://github.com/SuperFlyTV/sofie-automation-rundown-editor/releases) page and download the installer for the latest release. You'll find installers for Windows, Linux, and macOS on listed under the Assets dropdown for each release.

## Usage (Quick Start)

1. Begin by navigating to the Settings page in the top right.
2. Enter the URL and port of your Sofie instance (defaults to `127.0.0.1:3000`).
   - ❗ Restart the program after changing this setting! (be sure to hit "Save" first, though)
3. (Optional) Create any Rundown Metadata fields that your Rundown needs.
4. Click "Save".
5. Download and import [this example set of Piece Types](https://github.com/SuperFlyTV/sofie-automation-rundown-editor/raw/master/example-pieces-manifest.json) (right click and hit "Save link as...").
6. Before continuing, open the Sofie Core interface, navigate to the Settings page, click on your Studio, and attach `sofie-rundown-editor` as a Device by clicking the plus sign (+) under "Attached Devices".
7. Back in Rundown Editor, navigate to the Rundowns page in the top right.
8. Click "New" and then click on the newly-created Rundown.
9. Give it a name, check the "Sync to Sofie" box, and give it a Start Date, Start Time, End Date, and End Time.
10. Click "Save".
11. In the top left, click "New segment", then click on the newly-created Segment.
12. Give the Segment a name and click "Save".
13. In the top left, under the segment you just made, click "New part", then click on the newly-created Part.
14. Give the Part a name, type (choose `Cam` for this example), duration, and optionally a script.
15. Click "Save".
16. In the top right, click "New piece".
17. Select a Piece Type (choose `Camera` for this example) and click "Create".
18. Fill out the form fields for the newly-created Piece and click "Save".
19. Open your Rundown in Sofie, and you should see one segment with one part containing a single piece.
20. Keep building your rundown, one piece at a time.

## For Developers

### Project setup

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn electron:serve
```

### Compiles and minifies for production

```
yarn electron:build
```

### Lints and fixes files

```
yarn lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
