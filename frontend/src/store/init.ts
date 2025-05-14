import type { AppDispatch } from './app'
import { updateConnectionStatus } from './connectionStatus'
import { loadPiecesManifest } from './piecesManifest'
import { initPlaylists } from './playlists'
import { initRundowns } from './rundowns'
import { loadSettings } from './settings'

export function initStore(dispatch: AppDispatch): void {
	if (!electronApi) throw new Error('electronApi is not available')

	electronApi
		.getPlaylists()
		.then((playlists) => {
			dispatch(initPlaylists(playlists))
		})
		.catch((error) => {
			console.error('Error fetching playlists:', error)
		})

	electronApi
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

	electronApi
		.getCoreConnectionInfo()
		.then((info) => {
			dispatch(updateConnectionStatus(info))
		})
		.catch((error) => {
			console.error('Error fetching coreConnectionInfo:', error)
		})

	electronApi.onCoreConnectionInfo((newInfo) => {
		dispatch(updateConnectionStatus(newInfo))
	})
}
