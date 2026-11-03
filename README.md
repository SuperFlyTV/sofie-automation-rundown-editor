# Sofie Rundown Editor

> A tool for creating and editing rundowns in a _demo_ environment of [Sofie](https://github.com/Sofie-Automation/Sofie-TV-automation/).

![App preview image](docs/app-preview-image.png)

## Prerequisites

Sofie Rundown Editor requires that you have a working instance of [Sofie Core](https://github.com/Sofie-Automation/sofie-core) release 53 with the [demo blueprints](https://github.com/SuperFlyTV/sofie-demo-blueprints) uploaded to it. You do not need to install the [spreadsheet-gateway](https://github.com/SuperFlyTV/spreadsheet-gateway).

## Installation

Deploy the docker container using the `docker-compose.yml`, modify the port, volume mapping as needed. When migrating from a local install, the `data.db` file should be copied to the directory which the data volume points to otherwise the container will initialize a new database on the first run.

Once up and running in Rundown Editor go to `Settings -> Core Connection` and set the address and port of your Sofie instance. This is stored in your database file.

## Usage (Quick Start / Demo)

1. Begin by navigating to the Settings page in the top right.
2. Enter the URL and port of your Sofie instance (defaults to `127.0.0.1:3000`).
3. Click "Save".
4. Download and import [this demo set of Piece Types](https://raw.githubusercontent.com/SuperFlyTV/sofie-demo-blueprints/main/assets/sofie-rundown-editor-piece-types.json) (right click and "Save link as...") on the Settings page.
5. Before continuing, open the Sofie Core interface, navigate to the Settings page, click on your Studio, and attach `sofie-rundown-editor` as a Device by clicking the plus sign (+) under "Attached Devices".
6. Back in Rundown Editor, navigate to the Rundowns page in the top right.
7. Download and import [this demo Rundown](https://github.com/SuperFlyTV/sofie-automation-rundown-editor/raw/main/demo-rundown.json) (right click and "Save link as...")
8. Click on the Rundown and ensure that the "Sync to Sofie" box is checked. Be sure to click Save if you changed the setting.
9. Open the Rundown in Sofie.

> 💡 If at any point you need to re-ingest a rundown (for example, to pick up changes to the blueprints), perform the following procedure:
>
> 1. Ensure that Rundown Editor is running and connected to Sofie Core.
> 2. In the Sofie Core web UI, open the rundown you wish to re-ingest.
> 3. Right click on the header and click "Reload Google Sheet Data" (in a future version of Sofie Core, this will say "Reload Rundown Editor Data")
>
>    ![Reload data image](docs/reload-data.png)

## MOS plugins

A MOS plugin is an external web app (for example a graphics or media picker) that the editor embeds in an iframe so you can build a piece in it. A plugin URL is the address of that web app, e.g. `https://plugin.example.com/`. Plugins speak MOS 2.8.5.

### Setup

- Add plugins (name, URL, piece type) in Settings -> Core Connection, under MOS Plugins.
- The settings form won't save a row with a missing name, a URL that isn't `http(s)`, or an unknown piece type. Existing plugins whose URL is invalid or whose piece type was deleted are hidden from the piece forms.
- The plugin server must allow the editor to embed it. This is the `frame-ancestors` directive of its Content-Security-Policy header, which lists the origins allowed to embed the page. It must include the editor's origin, e.g. `Content-Security-Policy: frame-ancestors https://editor.example.com`.
- The plugin must be served over https if the editor is.
- Frame rate: in Sofie Core go to Settings -> Studio -> Attached Devices -> sofie-rundown-editor and set "Frame rate" (default 25). It is used to convert the plugin's item times.

### Using a plugin

- Create a piece: click "+ Add Piece", then use the plugin button "Add from <plugin name>" in the modal.
- Edit a piece: open it, click "Edit in <plugin name>" and press the plugin's Save; the piece is saved straight away.
- If the item has no `itemEdStart`, the start is treated as 0, so plugin pieces are never adlibs (a piece is an adlib only when `start === undefined`).
- If you remove a plugin, its existing pieces stay but show "plugin no longer configured".

### Where the data goes

The MOS item (an XML string) is stored in the piece's `payload.mosItem`, and the plugin used in `payload.mosPluginId`. When sending pieces to Core, the backend spreads `payload` into `attributes`, so blueprints read `piece.attributes.mosItem`. A blueprint is the code in Sofie Core that turns pieces into playout; it must read `mosItem` for the item to affect playout.

## For Developers

### Project setup

```
yarn install
```

### Compiles and hot-reloads for development

In one terminal

```
yarn dev
```

The frontend with hot-reloads will be available at `http://localhost:5173/`

### Compiles and minifies for production

```
yarn build
```

### Lints and fixes files

```
yarn lint
```

### Run the tests

```
yarn test
```

CI also runs it (build, lint, then test).

### Making a new release

1. Merge everything for the release in main
2. Wait for release-please to open a PR for the changes
3. Make sure the changelog and new version number it proposes are sensible.
   If not, release-please has some commands to adjust that.
4. Merge the PR
5. Wait for the release-please workflow to create the new tag
6. Wait for the workflows to [`Create GitHub Release`](https://github.com/SuperFlyTV/sofie-automation-rundown-editor/actions/workflows/create-release.yaml) action to finish
7. Go to the [releases](https://github.com/SuperFlyTV/sofie-automation-rundown-editor/releases) page and publish the draft release
