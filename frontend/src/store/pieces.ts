import type {
	MutationPieceCloneFromParToPart,
	MutationPieceCopy,
	Piece
} from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'
import { ipcAPI } from '~/lib/IPC'
import { removeRundown } from './rundowns'

export interface LoadPiecesPayload {
	rundownId: string
}
export interface NewPiecePayload {
	playlistId: string | null // TODO - this should be handled by the server..
	rundownId: string
	segmentId: string
	partId: string

	name: string
	pieceType: string
}
export interface UpdatePiecePayload {
	piece: Piece
}
export interface RemovePiecePayload {
	id: string
}

export const addNewPiece = createAppAsyncThunk(
	'pieces/addNewPiece',
	async (payload: NewPiecePayload) => {
		return ipcAPI.addNewPiece({
			name: payload.name,
			playlistId: payload.playlistId,
			rundownId: payload.rundownId,
			segmentId: payload.segmentId,
			partId: payload.partId,
			pieceType: payload.pieceType,
			payload: {}
		})
	}
)
export const copyPiece = createAppAsyncThunk(
	'pieces/copyPiece',
	async (payload: MutationPieceCopy) => {
		return ipcAPI.copyPiece(payload)
	}
)
export const updatePiece = createAppAsyncThunk(
	'pieces/updatePiece',
	async (payload: UpdatePiecePayload) => {
		return ipcAPI.updatePiece(payload.piece)
	}
)
export const removePiece = createAppAsyncThunk(
	'pieces/removePiece',
	async (payload: RemovePiecePayload) => {
		await ipcAPI.deletePiece(payload.id)
		return payload
	}
)
export const clonePiecesFromPartToPart = createAppAsyncThunk(
	'pieces/clonePiecesFromPartToPart',
	async (payload: MutationPieceCloneFromParToPart) => {
		return ipcAPI.clonePiecesFromPartToPart(payload)
	}
)

interface PiecesState {
	rundownId: string | null
	pieces: Piece[]
	status: 'idle' | 'pending' | 'succeeded' | 'failed'
	error: string | null
}

export const loadPieces = createAppAsyncThunk(
	'pieces/loadPieces',
	async (payload: LoadPiecesPayload) => {
		const pieces = await ipcAPI.getPieces(payload.rundownId)
		return {
			rundownId: payload.rundownId,
			pieces
		}
	}
)

const piecesSlice = createSlice({
	name: 'pieces',
	initialState: {
		rundownId: null,
		pieces: [],
		status: 'idle',
		error: null
	} as PiecesState,
	reducers: {
		// initPieces: (_state, action: { type: string; payload: Piece[] }) => {
		// 	console.log('initPieces', action)
		// 	return action.payload
		// }
	},
	extraReducers(builder) {
		builder
			.addCase(loadPieces.pending, (state) => {
				state.status = 'pending'
				state.rundownId = null
				state.pieces = []
				state.error = null
			})
			.addCase(loadPieces.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.rundownId = action.payload.rundownId
				state.pieces = action.payload.pieces
				state.error = null
			})
			.addCase(loadPieces.rejected, (state, action) => {
				state.status = 'failed'
				state.rundownId = null
				state.pieces = []
				state.error = action.error.message ?? 'Unknown Error'
			})
			.addCase(addNewPiece.fulfilled, (state, action) => {
				state.pieces.push(action.payload)
			})
			.addCase(copyPiece.fulfilled, (state, action) => {
				state.pieces.push(action.payload)
			})
			.addCase(updatePiece.fulfilled, (state, action) => {
				const index = state.pieces.findIndex((piece) => piece.id === action.payload.id)
				if (index !== -1) {
					state.pieces[index] = action.payload
				}
			})
			.addCase(removePiece.fulfilled, (state, action) => {
				const index = state.pieces.findIndex((piece) => piece.id === action.payload.id)
				if (index !== -1) {
					state.pieces.splice(index, 1)
				}
			})
			.addCase(clonePiecesFromPartToPart.fulfilled, (state, action) => {
				action.payload.map((piece) => {
					state.pieces.push(piece)
				})
			})
			.addCase(removeRundown.fulfilled, (state, action) => {
				// Check if the rundown being removed is the one currently loaded in the pieces slice
				if (state.rundownId === action.payload.id) {
					// Reset the state to initial values
					state.rundownId = null
					state.pieces = []
					state.status = 'idle'
					state.error = null
				}
			})
	}
})

// Export the auto-generated action creator with the same name
// export const {} = piecesSlice.actions

export default piecesSlice.reducer
