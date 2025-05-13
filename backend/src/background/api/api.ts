import type { CoreConnectionInfo, MutationRundownCreate, Playlist, Rundown } from '../interfaces'

export interface BackendApi {
	onCoreConnectionInfo: (callback: (newInfo: CoreConnectionInfo) => void) => void

	getCoreConnectionInfo: () => Promise<CoreConnectionInfo>
	getPlaylists: () => Promise<Playlist[]>

	getRundowns: () => Promise<Rundown[]>
	addNewRundown: (rundown: MutationRundownCreate) => Promise<Rundown>
}
