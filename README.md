# Sofie Rundown Editor

> A tool for creating and editing rundowns in a _demo_ environment of [Sofie](https://github.com/nrkno/Sofie-TV-automation/).

![App preview image](docs/app-preview-image.png)

## Prerequisites

Sofie Rundown Editor requires that you have a working instance of [Sofie Core](https://github.com/nrkno/sofie-core) release 46 with the [demo blueprints](https://github.com/SuperFlyTV/sofie-demo-blueprints) uploaded to it. You do not need to install the [spreadsheet-gateway](https://github.com/SuperFlyTV/spreadsheet-gateway).

## Installation

Head to the [releases](https://github.com/SuperFlyTV/sofie-automation-rundown-editor/releases) page and download the installer for the latest release. You'll find installers for Windows, Linux, and macOS on listed under the Assets dropdown for each release.

## Usage (Quick Start / Demo)

1. Begin by navigating to the Settings page in the top right.
2. Enter the URL and port of your Sofie instance (defaults to `127.0.0.1:3000`).
   - ❗ Restart the program after changing this setting! (be sure to hit "Save" first, though)
3. Click "Save".
4. Download and import [this demo set of Piece Types](https://raw.githubusercontent.com/SuperFlyTV/sofie-demo-blueprints/master/assets/sofie-rundown-editor-piece-types.json) (right click and "Save link as...") on the Settings page.
5. Before continuing, open the Sofie Core interface, navigate to the Settings page, click on your Studio, and attach `sofie-rundown-editor` as a Device by clicking the plus sign (+) under "Attached Devices".
6. Back in Rundown Editor, navigate to the Rundowns page in the top right.
7. Download and import [this demo Rundown](https://github.com/SuperFlyTV/sofie-automation-rundown-editor/raw/master/demo-rundown.json) (right click and "Save link as...")
8. Click on the Rundown and ensure that the "Sync to Sofie" box is checked. Be sure to click Save if you changed the setting.
9. Open the Rundown in Sofie.

> 💡 If at any point you need to re-ingest a rundown (for example, to pick up changes to the blueprints), perform the following procedure:
>
> 1. Ensure that Rundown Editor is running and connected to Sofie Core.
> 2. In the Sofie Core web UI, open the rundown you wish to re-ingest.
> 3. Right click on the header and click "Reload Google Sheet Data" (in a future version of Sofie Core, this will say "Reload Rundown Editor Data")
>
>    ![Reload data image](docs/reload-data.png)

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

### Making a new release

1. Bump `version` in [`package.json`](package.json)
2. Commit and push the change as `chore: release vX.Y.Z`
3. Tag that commit as `vX.Y.Z` and push the tag
4. Wait for the [`Create GitHub Release`](https://github.com/SuperFlyTV/sofie-automation-rundown-editor/actions/workflows/create-release.yaml) action to finish
5. Go to the [releases](https://github.com/SuperFlyTV/sofie-automation-rundown-editor/releases) page and publish the draft release
