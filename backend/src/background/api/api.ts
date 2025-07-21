import type {
	ApplicationSettings,
	CoreConnectionInfo,
	MutationPartCreate,
	MutationPartMove,
	MutationPartUpdate,
	MutationPieceCreate,
	MutationPieceUpdate,
	MutationRundownCreate,
	MutationRundownUpdate,
	MutationSegmentCreate,
	MutationSegmentUpdate,
	OpenFromFileArgs,
	Part,
	Piece,
	PiecesManifest,
	PieceTypeManifest,
	Playlist,
	Rundown,
	SaveToFileArgs,
	Segment
} from '../interfaces'

export interface BackendApi {
	// TODO: this should be replaced with a browser side api
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	openFromFile(args: OpenFromFileArgs): Promise<any>
	// TODO: this should be replaced with a browser side api
	saveToFile(args: SaveToFileArgs): Promise<void>

	onCoreConnectionInfo: (callback: (newInfo: CoreConnectionInfo) => void) => void
	getCoreConnectionInfo: () => Promise<CoreConnectionInfo>

	resetSettings: () => Promise<void>
	getSettings: () => Promise<ApplicationSettings>
	updateSettings: (settings: ApplicationSettings) => Promise<ApplicationSettings>

	getPiecesManifest: () => Promise<PiecesManifest>
	addNewPieceManifest: (manifest: PieceTypeManifest) => Promise<PieceTypeManifest>
	updatePiecesManifest: (id: string, manifest: PieceTypeManifest) => Promise<PieceTypeManifest>
	removePiecesManifest: (id: string) => Promise<void>

	getPlaylists: () => Promise<Playlist[]>

	getRundowns: () => Promise<Rundown[]>
	addNewRundown: (rundown: MutationRundownCreate) => Promise<Rundown>
	updateRundown: (rundown: MutationRundownUpdate) => Promise<Rundown>
	deleteRundown: (rundownId: string) => Promise<void>

	getSegments: (rundownId: string) => Promise<Segment[]>
	addNewSegment: (segment: MutationSegmentCreate) => Promise<Segment>
	updateSegment: (segment: MutationSegmentUpdate) => Promise<Segment>
	reorderSegments: (part: MutationSegmentUpdate, targetIndex: number) => Promise<Segment[]>
	deleteSegment: (segmentId: string) => Promise<void>

	getParts: (rundownId: string) => Promise<Part[]>
	addNewPart: (part: MutationPartCreate) => Promise<Part>
	movePart: (payload: MutationPartMove) => Promise<Part>
	updatePart: (part: MutationPartUpdate) => Promise<Part>
	reorderParts: (part: MutationPartUpdate, targetIndex: number) => Promise<Part[]>
	deletePart: (partId: string) => Promise<void>

	getPieces: (rundownId: string) => Promise<Piece[]>
	addNewPiece: (piece: MutationPieceCreate) => Promise<Piece>
	updatePiece: (piece: MutationPieceUpdate) => Promise<Piece>
	deletePiece: (pieceId: string) => Promise<void>
	clonePiecesFromPartToPart: (fromPartId: string, toPartId: string) => Promise<Piece[]>
}
