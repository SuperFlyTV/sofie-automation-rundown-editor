import type { SetOptional } from 'type-fest'

export interface Playlist {
	/** Id of the playlist. */
	id: string
	/** Name of the playlist */
	name: string
}

export type MutationPlaylistCreate = SetOptional<Playlist, 'id'>

export type MutationPlaylistRead = SetOptional<Pick<Playlist, 'id'>, 'id'>

export type MutationPlaylistUpdate = Playlist

export type MutationPlaylistDelete = Pick<Playlist, 'id'>

/** Base payload value type */
export type PayloadValue = string | number | boolean | undefined
/** Generic payload container */
export interface IHasPayload<TPayload extends Record<string, any> = Record<string, PayloadValue>> {
	/** User configurable fields */
	payload: TPayload
}

export interface Rundown extends IHasPayload {
	/** Id of the rundown as reported by the ingest gateway. Must be unique for each rundown owned by the gateway */
	id: string
	/** id of the playlist this rundown is in */
	playlistId: string | null
	/** Name of the rundown */
	name: string
	/** Whether to sync the rundown to Sofie */
	sync: boolean
	/** Flags the rundown as template. Template rundowns cannot sync to Sofie. */
	isTemplate: boolean

	/** Date of when the rundown is supposed to start */
	expectedStartTime?: number
	/** Date of when the rundown is supposed to end */
	expectedEndTime?: number
}
export interface Segment extends IHasPayload {
	/** Id of the segment as reported by the ingest gateway. Must be unique for each segment in the rundown */
	id: string
	/** Id of the playlist this segment belongs to */
	playlistId: string | null
	/** Id of the rundown this segment belongs to */
	rundownId: string
	/** Name of the segment */
	name: string
	/** Rank of the segment within the rundown */
	rank: number
	/** Whether this segment is floated */
	float: boolean
	/** Flags the segment as template. Template segments can be selected individually to be imported into other rundowns. */
	isTemplate: boolean

	segmentType: string
}

export interface Part extends IHasPayload {
	/** Id of the part as reported by the ingest gateway. Must be unique for each part in the rundown */
	id: string
	/** Id of the playlist this part belongs to */
	playlistId: string | null
	/** Id of the rundown this part belongs to */
	rundownId: string
	/** Id of the segment this part belongs to */
	segmentId: string
	/** Name of the part */
	name: string
	/** Rank of the part within the segmetn */
	rank: number
	/** Whether this part is floated */
	float: boolean

	script?: string
	duration?: number
	partType: string
}
export interface Piece extends IHasPayload {
	/** Id of the adlib as reported by the ingest source. Must be unique for each adlib */
	id: string
	/** Id of the playlist this piece belongs to */
	playlistId: string | null
	/** Id of the rundown this piece belongs to */
	rundownId: string
	/** Id of the segment this piece belongs to */
	segmentId: string
	/** Id of the part this piece belongs to */
	partId: string
	/** Name of the piece */
	name: string

	start?: number
	duration?: number // todo - timing type for infintes

	pieceType: string
}

export interface DBPlaylist {
	document: string // Omit<Playlist, 'id'>
	id: string
}
export interface DBRundown {
	document: string // Omit<Rundown, 'id'>
	id: string
	playlistId?: string
}
export interface DBSegment {
	document: string // Omit<Segment, 'id'>
	id: string
	playlistId?: string
	rundownId: string
}
export interface DBPart {
	document: string // Omit<Part, 'id'>
	id: string
	playlistId?: string
	rundownId: string
	segmentId: string
}
export interface DBPiece {
	document: string // Omit<Piece, 'id'>
	id: string
	playlistId?: string
	rundownId: string
	segmentId: string
	partId: string
}

export enum ManifestFieldType {
	String = 'string',
	Number = 'number',
	Boolean = 'boolean'
}
export enum TypeManifestEntity {
	Rundown = 'rundown',
	Segment = 'segment',
	Part = 'part',
	Piece = 'piece'
}

export interface TypeManifest {
	id: string
	entityType: TypeManifestEntity
	name: string
	shortName: string
	colour: string
	includeTypeInName?: boolean

	payload: PayloadManifest[]
}
export interface DBTypeManifest {
	id: string
	entityType: TypeManifestEntity
	document: string
}

export interface PayloadManifest {
	id: string
	label: string
	type: ManifestFieldType
	includeInName?: boolean
}

export interface ApplicationSettings {
	coreUrl?: string
	corePort?: number
}
export interface DBSettings {
	id: string
	document: string
}

export enum IpcOperationType {
	Create = 'create',
	Copy = 'copy',
	Read = 'read',
	Update = 'update',
	Reorder = 'reorder',
	Delete = 'delete',
	CloneSet = 'cloneSet',
	Move = 'move'
}

export interface MutationCopy {
	preserveName?: boolean
	preserveTemplate?: boolean
}

export interface IpcOperation {
	type: IpcOperationType
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload: any
}

export type MutationPieceCreate = SetOptional<Piece, 'id'>

export type MutationPieceCopy = SetOptional<Pick<Piece, 'id' | 'partId'>, 'partId'> & MutationCopy

export type MutationPieceRead = Pick<Piece, 'id' | 'rundownId' | 'segmentId' | 'partId'>

export type MutationPieceUpdate = Piece

export type MutationPieceDelete = Pick<Piece, 'id'>

export type MutationPieceCloneFromParToPart = {
	fromPartId: string
	toPartId: string
}

export interface MutatedRundown {
	externalId: string
	name: string
	type: 'sofie-rundown-editor'
	segments: MutatedSegment[]
	payload: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any
		name: string
		expectedStart: number | undefined
		expectedEnd: number | undefined
	}
}

export interface MutatedSegment {
	externalId: string
	name: string
	rank: number
	payload: { name: string; rank: number; type: string }
	parts: MutatedPart[]
}

export interface MutatedPart {
	externalId: string
	name: string
	rank: number
	payload: {
		segmentId: string
		externalId: string
		rank: number
		name: string
		type: string | undefined
		float: boolean
		script: string | undefined
		duration: number | undefined
		pieces: MutatedPiece[]
	}
}

export interface MutatedPiece {
	id: string
	name: string
	objectType: string
	objectTime: number | undefined
	duration: number | undefined
	clipName: string | undefined
	attributes: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any
		adlib: boolean
	}
	position: number | undefined
}

export type MutationPartCreate = SetOptional<Part, 'id' | 'rank'>

export type MutationPartCopy = SetOptional<
	Pick<Part, 'id' | 'rundownId' | 'segmentId'>,
	'segmentId'
> &
	MutationCopy

export type MutationPartCopyResult = { part: Part; pieces: Piece[] }

export type MutationPartCloneFromSegmentToSegment = {
	fromSegmentId: string
	toSegmentId: string
}

export type MutationPartMove = {
	sourcePart: Part
	targetPart: Part
	targetIndex: number
}

export type MutationPartRead = Pick<Part, 'id' | 'rundownId' | 'segmentId' | 'rank'>

export type MutationPartUpdate = Part

export type MutationPartDelete = Pick<Part, 'id'>

export type MutationTypeManifestCreate = Pick<TypeManifest, 'id' | 'entityType'> &
	Partial<TypeManifest>

export type MutationTypeManifestRead = Pick<DBTypeManifest, 'id' | 'entityType'>

export type MutationTypeManifestUpdate = Pick<TypeManifest, 'id'> & {
	update: Pick<TypeManifest, 'name' | 'shortName' | 'colour' | 'includeTypeInName' | 'id'> &
		Partial<TypeManifest>
}

export type MutationTypeManifestDelete = Pick<TypeManifest, 'id'>

export type MutationRundownCreate = SetOptional<Rundown, 'id'>

export type MutationSegmentCopy = Pick<SetOptional<Segment, 'rank'>, 'id' | 'rundownId' | 'rank'> &
	MutationCopy

export type MutationSegmentCopyResult = { segment: Segment; parts: Part[]; pieces: Piece[] }

export type MutationSegmentCloneFromRundownToRundown = {
	fromRundownId: string
	toRundownId: string
	insertRank?: number
}

export type MutationRundownRead = Pick<Rundown, 'id'>

export type MutationRundownCopy = Pick<Rundown, 'id'> & MutationCopy

export type MutationRundownCopyResult = {
	rundown: Rundown
	segments: Segment[]
	parts: Part[]
	pieces: Piece[]
}

export type MutationRundownUpdate = Rundown

export type MutationRundownDelete = Pick<Rundown, 'id'>

export type MutationSegmentsRead = { rundownId: string } | { isTemplate: boolean }

export type MutationSegmentCreate = SetOptional<Segment, 'id' | 'rank' | 'isTemplate'>

export type MutationSegmentRead = Pick<Segment, 'id' | 'rundownId'>

export type MutationSegmentUpdate = Segment

export type MutationSegmentDelete = Pick<Segment, 'id'>

export type MutationApplicationSettingsCreate = ApplicationSettings

export type MutationApplicationSettingsUpdate = ApplicationSettings

export enum CoreConnectionStatus {
	CONNECTED = 'Connected',
	DISCONNECTED = 'Disconnected'
}

export interface CoreConnectionInfo {
	status: CoreConnectionStatus
	url?: string
	port?: number
}

export interface SerializedRundown {
	rundown: Rundown
	segments: Segment[]
	parts: Part[]
	pieces: Piece[]
	isTemplate?: boolean
}

export interface OpenFromFileArgs {
	title: string
}
export interface SaveToFileArgs {
	title: string
	document: unknown
}

export interface MutationReorder<T> {
	element: T
	sourceIndex: number
	targetIndex: number
}
export interface PiecesUpdateEvent {
	pieces?: Piece[]
}
export interface PartsUpdateEvent {
	parts?: Part[]
}
export interface SegmentsUpdateEvent {
	segments?: Segment[]
}
