import type { BackendApi } from '../../../backend/src/background/api/api.js'
import type {
	MutationPartCopy,
	// CoreConnectionInfo,
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
	TypeManifest,
	SaveToFileArgs
} from '../../../backend/src/background/interfaces.js'
import { openFromFile, saveToFile } from './files.js'
import { getSocket } from './socket.js'

export const ipcAPI: BackendApi = {
	openFromFile: (args: OpenFromFileArgs) => {
		return openFromFile(args)
	},
	saveToFile: (args: SaveToFileArgs) => {
		return saveToFile(args)
	},

	onCoreConnectionInfo: (callback) => {
		return getSocket().on('coreConnectionInfo', (newInfo) => {
			callback(newInfo)
		})
	},
	getCoreConnectionInfo: () => {
		return getSocket().emitWithAck('coreConnectionInfo', 'read', undefined)
	},

	resetSettings: () => {
		return getSocket().emitWithAck('settings', 'reset', undefined)
	},
	getSettings: () => {
		return getSocket().emitWithAck('settings', 'read', undefined)
	},
	updateSettings: (settings) => {
		return getSocket().emitWithAck('settings', 'update', settings)
	},

	getTypeManifests: () => {
		return getSocket().emitWithAck('typeManifests', 'read', undefined)
	},
	addNewTypeManifest: (manifest: TypeManifest) => {
		return getSocket().emitWithAck('typeManifests', 'create', manifest)
	},
	updateTypeManifest: (id: string, manifest: TypeManifest) => {
		return getSocket().emitWithAck('typeManifests', 'update', { update: manifest, id: id })
	},
	removeTypeManifest: (id: string) => {
		return getSocket().emitWithAck('typeManifests', 'delete', { id })
	},

	getPlaylists: () => {
		return getSocket().emitWithAck('playlists', 'read', undefined)
	},
	getRundowns: async () => {
		return getSocket().emitWithAck('rundowns', 'read', undefined)
	},
	addNewRundown: (rundown: MutationRundownCreate) => {
		return getSocket().emitWithAck('rundowns', 'create', rundown)
	},
	copyRundown: (rundown: MutationRundownCopy) => {
		return getSocket().emitWithAck('rundowns', 'copy', rundown)
	},
	updateRundown: (rundown: MutationRundownUpdate) => {
		return getSocket().emitWithAck('rundowns', 'update', rundown)
	},
	deleteRundown: (rundownId: string) => {
		return getSocket().emitWithAck('rundowns', 'delete', { id: rundownId })
	},

	getSegments: (payload: MutationSegmentsRead) => {
		return getSocket().emitWithAck('segments', 'read', payload)
	},
	addNewSegment: (segment: MutationSegmentCreate) => {
		return getSocket().emitWithAck('segments', 'create', segment)
	},
	copySegment: (segment: MutationSegmentCopy) => {
		return getSocket().emitWithAck('segments', 'copy', segment)
	},
	cloneSegmentsFromRundownToRundown: (payload: MutationSegmentCloneFromRundownToRundown) => {
		return getSocket().emitWithAck('segments', 'cloneSet', payload)
	},
	updateSegment: (segment: MutationSegmentUpdate) => {
		return getSocket().emitWithAck('segments', 'update', segment)
	},
	reorderSegments: (payload: MutationReorder<MutationSegmentUpdate>) => {
		return getSocket().emitWithAck('segments', 'reorder', payload)
	},
	deleteSegment: (segmentId: string) => {
		return getSocket().emitWithAck('segments', 'delete', {
			id: segmentId
		})
	},

	getParts: (rundownId: string) => {
		return getSocket().emitWithAck('parts', 'read', { rundownId })
	},
	copyPart: (part: MutationPartCopy) => {
		return getSocket().emitWithAck('parts', 'copy', part)
	},
	addNewPart: (part: MutationPartCreate) => {
		return getSocket().emitWithAck('parts', 'create', part)
	},
	movePart: function (payload: MutationPartMove): Promise<Part> {
		return getSocket().emitWithAck('parts', 'move', payload)
	},
	updatePart: (part: MutationPartUpdate) => {
		return getSocket().emitWithAck('parts', 'update', part)
	},
	reorderParts: (payload: MutationReorder<MutationPartUpdate>) => {
		return getSocket().emitWithAck('parts', 'reorder', payload)
	},
	deletePart: (partId: string) => {
		return getSocket().emitWithAck('parts', 'delete', {
			id: partId
		})
	},

	getPieces: (rundownId: string) => {
		return getSocket().emitWithAck('pieces', 'read', { rundownId })
	},
	addNewPiece: (piece: MutationPieceCreate) => {
		return getSocket().emitWithAck('pieces', 'create', piece)
	},
	copyPiece: (piece: MutationPieceCopy) => {
		return getSocket().emitWithAck('pieces', 'copy', piece)
	},
	updatePiece: (piece: MutationPieceUpdate) => {
		return getSocket().emitWithAck('pieces', 'update', piece)
	},
	deletePiece: (pieceId: string) => {
		return getSocket().emitWithAck('pieces', 'delete', {
			id: pieceId
		})
	},
	clonePiecesFromPartToPart: (payload: MutationPieceCloneFromParToPart) => {
		return getSocket().emitWithAck('pieces', 'cloneSet', payload)
	},

	onPiecesUpdate: (callback) => {
		return getSocket().on('pieces:update', callback)
	},
	onPartsUpdate: (callback) => {
		return getSocket().on('parts:update', callback)
	},
	onSegmentsUpdate: (callback) => {
		return getSocket().on('segments:update', callback)
	}
}

export type { ipcAPI as electronApi }
