import type {
	CoreConnectionInfo,
	MutationPartCreate,
	MutationPieceCreate,
	MutationRundownCreate,
	MutationSegmentCreate,
	Part,
	Piece,
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
	updateSegment: (segment: Segment) => Promise<Segment>
	deleteSegment: (segmentId: string) => Promise<void>

	getParts: (rundownId: string) => Promise<Part[]>
	addNewPart: (segment: MutationPartCreate) => Promise<Part>

	getPieces: (rundownId: string) => Promise<Piece[]>
	addNewPiece: (segment: MutationPieceCreate) => Promise<Piece>
}
