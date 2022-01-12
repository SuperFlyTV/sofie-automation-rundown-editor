'use strict'

import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { ControlAPI } from './background/index'
import path from 'path'
import { initializeDefaults as initializeSettingsDefaults } from './background/api/settings'
import os from 'os'
import fs from 'fs'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
	{ scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
	// Ensure defaults are ready before creating the browser window.
	await initializeSettingsDefaults()

	const winOpts: Electron.BrowserWindowConstructorOptions = {
		width: 1020,
		height: 800,
		webPreferences: {
			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			nodeIntegration: (process.env.ELECTRON_NODE_INTEGRATION as unknown) as boolean,
			preload: path.join(__dirname, 'preload.js')
		}
	}

	// Create the browser window.
	const win = new BrowserWindow(winOpts)

	// Helps fix the icon on AppImage and .deb builds for Linux.
	// See https://github.com/electron-userland/electron-builder/issues/4617#issuecomment-623062713 for more information.
	const needsIconFix =
		process.env.NODE_ENV !== 'development' &&
		os.platform() !== 'win32' &&
		os.platform() !== 'darwin'
	if (needsIconFix) {
		console.log('Applying Linux icon fix...')
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const globalAny: any = global
		console.log('app.asar contents:')
		fs.readdirSync(__dirname).forEach((file) => {
			console.log(file)
		})
		globalAny.__static = path.join(__dirname, '../static').replace(/\\/g, '\\\\')
		console.log('New static path:', globalAny.__static)
		fs.readdirSync(globalAny.__static).forEach((file) => {
			console.log(file)
		})
		winOpts.icon = path.join(globalAny.__static, 'icons/Icon-512x512.png')
	}

	const api = new ControlAPI(win)
	await api.init().catch((error) => {
		console.error(error)
		process.exit(1)
	})

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

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
		if (!process.env.IS_TEST) win.webContents.openDevTools()
	} else {
		createProtocol('app')
		// Load the index.html when not in development
		win.loadURL('app://./index.html')
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
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installExtension(VUEJS_DEVTOOLS)
		} catch (e) {
			console.error('Vue Devtools failed to install:', e.toString())
		}
	}
	createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
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
