// import { IpcRenderer, ipcRenderer } from 'electron'
// import { promises as fs } from 'fs'
// import { dialog } from '@electron/remote'
// window.ipcRenderer = ipcRenderer
// window.fs = fs
// window.remoteDialog = dialog

// declare global {
// 	interface Window {
// 		ipcRenderer: IpcRenderer
// 		fs: typeof fs
// 		remoteDialog: typeof dialog
// 	}
// }

/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require('electron')
import type { BackendApi } from './background/api/api.js'
import { CoreConnectionInfo, MutationRundownCreate, Rundown } from './background/interfaces.js'

const electronApi: BackendApi = {
	onCoreConnectionInfo: (callback) => {
		ipcRenderer.on('coreConnectionInfo', (event, newInfo: CoreConnectionInfo) => {
			callback(newInfo)
		})
	},

	getCoreConnectionInfo: () => {
		return ipcRenderer.invoke('coreConnectionInfo', {
			type: 'read',
			payload: {}
		})
	},
	getPlaylists: () => {
		return ipcRenderer.invoke('playlists', {
			type: 'read',
			payload: {}
		})
	},

	getRundowns: () => {
		return ipcRenderer.invoke('rundowns', {
			type: 'read',
			payload: {}
		})
	},
	addNewRundown: (rundown: MutationRundownCreate) => {
		return ipcRenderer.invoke('rundowns', {
			type: 'create',
			payload: rundown
		})
	}
}

contextBridge.exposeInMainWorld('electronApi', electronApi)

export type { electronApi }
