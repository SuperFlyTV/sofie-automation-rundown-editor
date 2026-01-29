import type {
	ApplicationSettings,
	CoreConnectionInfo,
	MutationPartCopy,
	MutationPartCreate,
	MutationPartMove,
	MutationPartUpdate,
	MutationPieceCloneFromParToPart,
	MutationPieceCopy,
	MutationPieceCreate,
	MutationPieceUpdate,
	MutationReorder,
	MutationRundownCopy,
	MutationRundownCreate,
	MutationRundownUpdate,
	MutationSegmentCloneFromRundownToRundown,
	MutationSegmentCopy,
	MutationSegmentCreate,
	MutationSegmentsRead,
	MutationSegmentUpdate,
	OpenFromFileArgs,
	Part,
	PartsUpdateEvent,
	Piece,
	PiecesUpdateEvent,
	TypeManifest,
	Playlist,
	Rundown,
	SaveToFileArgs,
	Segment,
	SegmentsUpdateEvent
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

	getTypeManifests: () => Promise<TypeManifest[]>
	addNewTypeManifest: (manifest: TypeManifest) => Promise<TypeManifest>
	updateTypeManifest: (id: string, manifest: TypeManifest) => Promise<TypeManifest>
	removeTypeManifest: (id: string) => Promise<void>

	getPlaylists: () => Promise<Playlist[]>

	getRundowns: () => Promise<Rundown[]>
	addNewRundown: (rundown: MutationRundownCreate) => Promise<Rundown>
	copyRundown: (payload: MutationRundownCopy) => Promise<Rundown>
	updateRundown: (rundown: MutationRundownUpdate) => Promise<Rundown>
	deleteRundown: (rundownId: string) => Promise<void>

	getSegments: (payload: MutationSegmentsRead) => Promise<Segment[]>
	addNewSegment: (segment: MutationSegmentCreate) => Promise<Segment>
	copySegment: (payload: MutationSegmentCopy) => Promise<Segment>
	cloneSegmentsFromRundownToRundown: (
		payload: MutationSegmentCloneFromRundownToRundown
	) => Promise<Segment[]>
	updateSegment: (segment: MutationSegmentUpdate) => Promise<Segment>
	reorderSegments: (payload: MutationReorder<MutationSegmentUpdate>) => Promise<Segment[]>
	deleteSegment: (segmentId: string) => Promise<void>

	getParts: (rundownId: string) => Promise<Part[]>
	addNewPart: (part: MutationPartCreate) => Promise<Part>
	copyPart: (payload: MutationPartCopy) => Promise<Part>
	movePart: (payload: MutationPartMove) => Promise<Part>
	updatePart: (part: MutationPartUpdate) => Promise<Part>
	reorderParts: (payload: MutationReorder<MutationPartUpdate>) => Promise<Part[]>
	deletePart: (partId: string) => Promise<void>

	getPieces: (rundownId: string) => Promise<Piece[]>
	addNewPiece: (piece: MutationPieceCreate) => Promise<Piece>
	copyPiece: (payload: MutationPieceCopy) => Promise<Piece>
	updatePiece: (piece: MutationPieceUpdate) => Promise<Piece>
	deletePiece: (pieceId: string) => Promise<void>
	clonePiecesFromPartToPart: (payload: MutationPieceCloneFromParToPart) => Promise<Piece[]>
	onPiecesUpdate: (callback: (update: PiecesUpdateEvent) => void) => void
	onPartsUpdate: (callback: (update: PartsUpdateEvent) => void) => void
	onSegmentsUpdate: (callback: (update: SegmentsUpdateEvent) => void) => void
}
