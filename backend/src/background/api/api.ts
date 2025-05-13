import type {
	CoreConnectionInfo,
	MutationRundownCreate,
	MutationSegmentCreate,
	Playlist,
	Rundown,
	Segment
} from '../interfaces'

export interface BackendApi {
	onCoreConnectionInfo: (callback: (newInfo: CoreConnectionInfo) => void) => void

	getCoreConnectionInfo: () => Promise<CoreConnectionInfo>
	getPlaylists: () => Promise<Playlist[]>

	getRundowns: () => Promise<Rundown[]>
	addNewRundown: (rundown: MutationRundownCreate) => Promise<Rundown>
	updateRundown: (rundown: Rundown) => Promise<Rundown>
	deleteRundown: (rundownId: string) => Promise<void>

	getSegments: (rundownId: string) => Promise<Segment[]>
	addNewSegment: (segment: MutationSegmentCreate) => Promise<Segment>
}
