import { ipcAPI } from '~/lib/IPC'
import type { AppDispatch } from './app'
import { updateConnectionStatus } from './connectionStatus'
import { loadPiecesManifest } from './piecesManifest'
import { initPlaylists } from './playlists'
import { initRundowns } from './rundowns'
import { loadSettings } from './settings'
import { pushPiece } from './pieces'
import { pushPart } from './parts'

export function initStore(dispatch: AppDispatch): void {
	ipcAPI
		.getPlaylists()
		.then((playlists) => {
			console.log(playlists)
			dispatch(initPlaylists(playlists))
		})
		.catch((error) => {
			console.error('Error fetching playlists:', error)
		})

	ipcAPI
		.getRundowns()
		.then((rundowns) => {
			dispatch(initRundowns(rundowns))
		})
		.catch((error) => {
			console.error('Error fetching rundowns:', error)
		})

	dispatch(loadPiecesManifest()).catch((error) => {
		console.error('Error fetching pieces manifest:', error)
	})

	dispatch(loadSettings()).catch((error) => {
		console.error('Error fetching settings:', error)
	})

	ipcAPI
		.getCoreConnectionInfo()
		.then((info) => {
			dispatch(updateConnectionStatus(info))
		})
		.catch((error) => {
			console.error('Error fetching coreConnectionInfo:', error)
		})

	ipcAPI.onCoreConnectionInfo((newInfo) => {
		dispatch(updateConnectionStatus(newInfo))
	})

	ipcAPI.onPiecesUpdate((update) => {
		dispatch(pushPiece(update.pieces ? update.pieces : []))
	})
	ipcAPI.onPartsUpdate((update) => {
		dispatch(pushPart(update.parts ? update.parts : []))
	})
}
