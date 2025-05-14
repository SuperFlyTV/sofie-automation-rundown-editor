import type {
	ApplicationSettings,
	CoreConnectionInfo,
	MutationPartCreate,
	MutationPartUpdate,
	MutationPieceCreate,
	MutationRundownCreate,
	MutationRundownUpdate,
	MutationSegmentCreate,
	MutationSegmentUpdate,
	Part,
	Piece,
	Playlist,
	Rundown,
	Segment
} from '../interfaces'

export interface BackendApi {
	onCoreConnectionInfo: (callback: (newInfo: CoreConnectionInfo) => void) => void
	getCoreConnectionInfo: () => Promise<CoreConnectionInfo>

	getSettings: () => Promise<ApplicationSettings>

	getPlaylists: () => Promise<Playlist[]>

	getRundowns: () => Promise<Rundown[]>
	addNewRundown: (rundown: MutationRundownCreate) => Promise<Rundown>
	updateRundown: (rundown: MutationRundownUpdate) => Promise<Rundown>
	deleteRundown: (rundownId: string) => Promise<void>

	getSegments: (rundownId: string) => Promise<Segment[]>
	addNewSegment: (segment: MutationSegmentCreate) => Promise<Segment>
	updateSegment: (segment: MutationSegmentUpdate) => Promise<Segment>
	deleteSegment: (segmentId: string) => Promise<void>

	getParts: (rundownId: string) => Promise<Part[]>
	addNewPart: (segment: MutationPartCreate) => Promise<Part>
	updatePart: (part: MutationPartUpdate) => Promise<Part>
	deletePart: (partId: string) => Promise<void>

	getPieces: (rundownId: string) => Promise<Piece[]>
	addNewPiece: (segment: MutationPieceCreate) => Promise<Piece>
}
