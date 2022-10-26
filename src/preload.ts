import { IpcRenderer, ipcRenderer } from 'electron'
import { promises as fs } from 'fs'
window.ipcRenderer = ipcRenderer
window.fs = fs

declare global {
	interface Window {
		ipcRenderer: IpcRenderer
		fs: typeof fs
	}
}
