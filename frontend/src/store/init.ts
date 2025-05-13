import type { AppDispatch } from './app'
import { updateConnectionStatus } from './connectionStatus'
import { initPlaylists } from './playlists'
import { initRundowns } from './rundowns'

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

	// const pieceTypes = await ipcRenderer.invoke(
	// 	'pieceTypeManifests',
	// 	literal<IpcOperation>({
	// 		type: IpcOperationType.Read,
	// 		payload: {}
	// 	})
	// )
	// store.commit('setPieceTypeManifests', pieceTypes)

	// const settings = await ipcRenderer.invoke(
	// 	'settings',
	// 	literal<IpcOperation>({
	// 		type: IpcOperationType.Read,
	// 		payload: {}
	// 	})
	// )
	// store.commit('setSettings', settings)

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
