'use strict'

import { app, BrowserWindow } from 'electron'
import { ControlAPI } from './background/index'
import path from 'path'
import { initializeDefaults as initializeSettingsDefaults } from './background/api/settings'
import * as remote from '@electron/remote/main'
import isDev from 'electron-is-dev'

remote.initialize()

// // Scheme must be registered before the app is ready
// protocol.registerSchemesAsPrivileged([
// 	{ scheme: 'app', privileges: { secure: true, standard: true } }
// ])

async function createWindow() {
	// Ensure defaults are ready before creating the browser window.
	await initializeSettingsDefaults()

	// Create the browser window.
	const win = new BrowserWindow({
		width: isDev ? 1600 : 1020,
		height: 800,
		webPreferences: {
			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			// nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION as unknown as boolean,
			preload: path.join(__dirname, '../dist/preload.cjs') // TODO - check/rework this
		}
	})

	remote.enable(win.webContents)

	// const menu = Menu.buildFromTemplate([
	// 	{
	// 		label: 'File',
	// 		submenu: [
	// 			{
	// 				label: 'Open',
	// 				async click() {
	// 					const {
	// 						canceled,
	// 						filePaths: [filePath]
	// 					} = await dialog.showOpenDialog(win, {
	// 						title: 'Open rundown',
	// 						filters: [{ name: 'JSON', extensions: ['json'] }],
	// 						properties: ['openFile']
	// 					})
	// 					if (!canceled && filePath) {
	// 						try {
	// 							const file = readFileSync(filePath, { encoding: 'utf-8' })
	// 							const rundown = JSON.parse(file)
	// 							console.log(rundown)

	// 							if (rundown.type && rundown.type === 'casparcg-playback-client-rundown') {
	// 								api.loadRundown(rundown)
	// 							}
	// 						} catch {
	// 							// ideally show the user a dialog?
	// 						}
	// 					}
	// 				}
	// 			},
	// 			{
	// 				label: 'Save',
	// 				async click() {
	// 					const { canceled, filePath } = await dialog.showSaveDialog(win, {
	// 						title: 'Save rundown',
	// 						filters: [{ name: 'JSON', extensions: ['json'] }],
	// 						properties: ['createDirectory']
	// 					})
	// 					if (!canceled && filePath) {
	// 						try {
	// 							writeFileSync(filePath, JSON.stringify(api.getRundown()), { encoding: 'utf-8' })
	// 						} catch {
	// 							// ideally show the user a dialog?
	// 						}
	// 					}
	// 				}
	// 			},
	// 			{ type: 'separator' },
	// 			{
	// 				label: 'Exit',
	// 				role: 'quit',
	// 				click() {
	// 					app.quit()
	// 				}
	// 			}
	// 		]
	// 	}
	// ])
	// Menu.setApplicationMenu(menu)

	if (isDev) {
		// Load the url of the dev server if in development mode
		await win.loadURL(process.env.VITE_URL || 'http://localhost:5173/')
		if (!process.env.IS_TEST) win.webContents.openDevTools()
	} else {
		// Load the index.html when not in development
		const indexUrl = `file://${process.resourcesPath}/frontend/index.html`
		console.log(`Loading index URL: ${indexUrl}`)
		win.loadURL(indexUrl)
	}
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
	if (isDev && !process.env.IS_TEST) {
		// Install React Devtools
		try {
			const devToolsInstaller = await import('electron-devtools-installer')
			await devToolsInstaller.default(devToolsInstaller.REACT_DEVELOPER_TOOLS)
		} catch (e) {
			console.error('React Devtools failed to install:', (e as Error).toString())
		}
	}

	const api = new ControlAPI()
	await api.init().catch((error) => {
		console.error(error)
		process.exit(1)
	})

	createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDev) {
	if (process.platform === 'win32') {
		process.on('message', (data) => {
			if (data === 'graceful-exit') {
				app.quit()
			}
		})
	} else {
		process.on('SIGTERM', () => {
			app.quit()
		})
	}
}
