import { IpcRenderer, ipcRenderer } from 'electron'
window.ipcRenderer = ipcRenderer

declare global {
	interface Window {
		ipcRenderer: IpcRenderer
	}
}
