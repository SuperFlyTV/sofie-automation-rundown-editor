# Sofie Rundown Editor

## Installation

Head to the [releases](releases) page and download the installer for the latest release. You'll find installers for Windows, Linux, and macOS on listed under the Assets dropdown for each release.

## Usage (Quick Start)

1. Begin by navigating to the Settings page in the top right.
2. Enter the URL and port of your Sofie instance (defaults to `127.0.0.1:3000`).
   - ❗ Restart the program after changing this setting! (be sure to hit "Save" first, though)
3. Enter a comma-separated list of Part Types (for example, `Cam, Remote, Full, VO, Titles, DVE, GFX, BREAK`)
4. (Optional) Create any Rundown Metadata fields your Rundown needs.
5. Click "Save".
6. Create your Piece Types.
   - 💡 Or, download and import [this example set](https://gist.githubusercontent.com/alvancamp/c8ef1999d9550b8087f2a551c35ce30b/raw/fe6998c033e78e4866743e38482b29b4128fa4fa/pieces-manifest.json) (right click and hit "Save as").
7. Before continuing, open the main Sofie interface, navigate to the Settings page, click on your Studio, and attach `sofie-rundown-editor` as a Device by clicking the plus sign (+) under "Attached Devices".
8. Navigate to the Rundowns page in the top right.
9. Click "New" and then click on the newly-created Rundown.
10. Give it a name, check the "Sync to Sofie" box, and give it a Start Date, Start Time, End Date, and End Time.
11. Click "Save".
12. In the top left, click "New segment", then click on the newly-created Segment.
13. Give the Segment a name and click "Save".
14. In the top left, under the segment you just made, click "New part", then click on the newly-created Part.
15. Give the Part a name, type (choose `Cam` if you're using the example data provided in the previous steps), duration, and optionally a script.
16. Click "Save".
17. In the top right, click "New piece".
18. Select a Piece Type (choose `Camera` if you're using the example data provided in the previous steps) and click "Create".
19. Fill out the form fields for the newly-created Piece and click "Save".
20. Open your Rundown in Sofie, and you should see one segment with one part containing a single piece.
21. Keep building your rundown, one piece at a time.

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
