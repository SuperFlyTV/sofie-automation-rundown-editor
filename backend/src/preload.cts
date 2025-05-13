import { IpcRenderer, ipcRenderer } from 'electron'
import { promises as fs } from 'fs'
import { dialog } from '@electron/remote'
window.ipcRenderer = ipcRenderer
window.fs = fs
window.remoteDialog = dialog

declare global {
	interface Window {
		ipcRenderer: IpcRenderer
		fs: typeof fs
		remoteDialog: typeof dialog
	}
}
