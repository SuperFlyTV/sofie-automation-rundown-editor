export interface Playlist {
	/** Id of the playlist. */
	id: string
	/** Name of the playlist */
	name: string
}
export interface Rundown {
	/** Id of the rundown as reported by the ingest gateway. Must be unique for each rundown owned by the gateway */
	id: string
	/** id of the playlist this rundown is in */
	playlistId?: string
	/** Name of the rundown */
	name: string
	/** Whether to sync the rundown to Sofie */
	sync: boolean

	/** Date of when the rundown is supposed to start */
	expectedStartTime?: number
	/** Date of when the rundown is supposed to end */
	expectedEndTime?: number
	/** User configurable fields */
	metaData?: Record<string, string | number | boolean>
}
export interface Segment {
	/** Id of the segment as reported by the ingest gateway. Must be unique for each segment in the rundown */
	id: string
	/** Id of the rundown this segment belongs to */
	rundownId: string
	/** Name of the segment */
	name: string
	/** Rank of the segment within the rundown */
	rank: number
	/** Whether this segment is floated */
	float: boolean
}
export interface Part {
	/** Id of the part as reported by the ingest gateway. Must be unique for each part in the rundown */
	id: string
	/** Id of the rundown this segment belongs to */
	rundownId: string
	/** Id of the segment this part belongs to */
	segmentId: string
	/** Name of the part */
	name: string
	/** Rank of the part within the segmetn */
	rank: number
	/** Whether this segment is floated */
	float: boolean

	/** Raw payload of the part. Only used by the blueprints */
	payload: {
		script?: string
		type?: string
		duration?: number
	}
}
export interface Piece {
	/** Id of the adlib as reported by the ingest source. Must be unique for each adlib */
	id: string
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
	payload: Record<string, string | number | boolean>
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

export type RundownMetadataManifest = RundownMetadataEntryManifest[]
export interface RundownMetadataEntryManifest {
	id: string
	label: string
	type: ManifestFieldType
}

export type PiecesManifest = PieceTypeManifest[]

export interface PieceTypeManifest {
	id: string
	name: string
	shortName: string
	colour: string
	includeTypeInName?: boolean

	payload: PiecePayloadManifest[]
}
export interface DBPieceTypeManifest {
	id: string
	document: string
}

export interface PiecePayloadManifest {
	id: string
	label: string
	type: ManifestFieldType
	includeInName?: boolean
}

export interface ApplicationSettings {
	coreUrl?: string
	corePort?: number

	partTypes: string[]
	rundownMetadata: RundownMetadataManifest
}
export interface DBSettings {
	id: string
	document: string
}

export enum IpcOperationType {
	Create = 'create',
	Read = 'read',
	Update = 'update',
	Delete = 'delete'
}

export interface IpcOperation {
	type: IpcOperationType
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload: any
}

export interface MutationPieceCreate {
	name: string
	playlistId: string | null
	rundownId: string
	segmentId: string
	partId: string
	pieceType: string
}

export interface MutationPieceRead {
	id: string
	rundownId: string
	segmentId: string
	partId: string
}

export interface MutationPieceUpdate {
	name: string
	pieceType: string
	duration: number
	start: number
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload: { [key: string]: any }
	id: string
	playlistId: string | null
	rundownId: string
	segmentId: string
	partId: string
}

export interface MutationPieceDelete {
	id: string
}

export interface MutatedPiece {
	id: string
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

export interface MutationPartCreate {
	name: string
	playlistId: string | null
	rundownId: string
	segmentId: string
	rank: number
}

export interface MutationPartRead {
	id: string
	rundownId: string
	segmentId: string
}

export interface MutationPartUpdate {
	name: string
	rank: number
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload: { [key: string]: any }
	id: string
	playlistId: string | null
	rundownId: string
	segmentId: string
}

export interface MutationPartDelete {
	id: string
}

export interface MutationPieceManifestCreate {
	id: string
	name: string
}

export interface MutationPieceManifestRead {
	id: string
}

export interface MutationPieceManifestUpdate {
	id: string
	update: {
		name: string
		shortName: string
		colour: string
		includeTypeInName: boolean
		id: string
	}
}

export interface MutationPieceManifestDelete {
	id: string
}

export interface MutationRundownCreate {
	id: string
	playlistId: string | null
	document: {
		name: string
	}
}

export interface MutationRundownRead {
	id: string
}

export interface MutationRundownUpdate {
	name: string
	id: string
	playlistId: string | null
	expectedStartTime?: number
	expectedEndTime?: number
	sync?: boolean
}

export interface MutationRundownDelete {
	id: string
}

export interface MutationSegmentCreate {
	name: string
	playlistId: string | null
	rundownId: string
	rank: number
}

export interface MutationSegmentRead {
	id: string
	rundownId: string
}

export interface MutationSegmentUpdate {
	name: string
	rank: number
	id: string
	rundownId: string
	playlistId: string | null
	float: boolean
}

export interface MutationSegmentDelete {
	id: string
}

export interface RundownMetadataField {
	id: string
	label: string
	type: 'string' | 'number' | 'boolean'
}

export interface MutationSettingsCreate {
	partTypes: string[]
	rundownMetadata: RundownMetadataField[]
}

export interface MutationSettingsUpdate {
	partTypes: string[]
	rundownMetadata: RundownMetadataField[]
}
