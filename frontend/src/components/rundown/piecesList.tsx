import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { useAppDispatch, useAppSelector } from '~/store/app'
import './piecesList.scss'
import { addNewPiece, copyPiece, type NewPiecePayload } from '~/store/pieces'
import type { MosPluginConfig, Part, Piece } from '~backend/background/interfaces'
import { toTime } from '~/util/lib'
import { createSelector } from '@reduxjs/toolkit'
import { IconButton } from '../iconButton'
import { useToasts } from '../toasts/useToasts'
import { MosPluginFrame } from './mosPluginFrame'
import { useMosPlugins } from './useMosPlugins'

const selectPiecesByPart = createSelector(
	[
		(state) => state.pieces.pieces,
		(_state, props: { rundownId: string; segmentId: string; partId: string }) => props
	],
	(pieces, props) =>
		pieces.filter(
			(p: Piece) =>
				p.rundownId === props.rundownId &&
				p.segmentId === props.segmentId &&
				p.partId === props.partId
		)
)

export function PiecesList({ part }: { part: Part }) {
	const { rundownId, segmentId, id: partId } = part
	const partIds = useMemo(() => ({ rundownId, segmentId, partId }), [rundownId, segmentId, partId])

	const pieces = useAppSelector((state) => selectPiecesByPart(state, partIds))

	return (
		<table className="rundown-pieces-list">
			<tbody>
				{pieces.map((piece: Piece) => (
					<PieceRow key={piece.id} piece={piece} />
				))}

				<tr>
					<td colSpan={4}>
						<NewPieceButton
							playlistId={part.playlistId}
							rundownId={part.rundownId}
							segmentId={part.segmentId}
							partId={part.id}
						/>
					</td>
				</tr>
			</tbody>
		</table>
	)
}

function PieceRow({ piece }: { piece: Piece }) {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const toasts = useToasts()

	const manifest = useAppSelector((state) =>
		state.typeManifests.manifests?.find((p) => p.id === piece.pieceType)
	)

	const pieceRowClick = () => {
		navigate({
			to: '/rundown/$rundownId/segment/$segmentId/part/$partId/piece/$pieceId',
			params: {
				rundownId: piece.rundownId,
				segmentId: piece.segmentId,
				partId: piece.partId,
				pieceId: piece.id
			}
		})
	}

	const performCopyPiece = () => {
		// perform operation
		dispatch(
			copyPiece({
				id: piece.id
			})
		)
			.unwrap()
			.then(async (newPiece) => {
				// Navigate user to the new piece
				await navigate({
					to: '/rundown/$rundownId/segment/$segmentId/part/$partId/piece/$pieceId',
					params: {
						rundownId: newPiece.rundownId,
						segmentId: newPiece.segmentId,
						partId: newPiece.partId,
						pieceId: newPiece.id
					}
				})
			})
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: 'Adding piece',
					bodyContent: 'Encountered an unexpected error'
				})
			})
	}

	return (
		<tr onClick={pieceRowClick}>
			<td className="piece-type" style={{ backgroundColor: manifest?.colour }}>
				{manifest?.shortName || piece.pieceType}
			</td>
			<td className="piece-name">{piece.name}</td>
			<td>
				<IconButton onClick={performCopyPiece} />
			</td>
			<td className="piece-start">{piece.start !== undefined ? toTime(piece.start) : ''}</td>
			<td className="piece-duration">
				{piece.duration !== undefined ? toTime(piece.duration) : ''}
			</td>
		</tr>
	)
}

function NewPieceButton({
	playlistId,
	rundownId,
	segmentId,
	partId
}: {
	playlistId: string | null
	rundownId: string
	segmentId: string
	partId: string
}) {
	const navigate = useNavigate({})
	const dispatch = useAppDispatch()
	const typeManifest = useAppSelector((state) =>
		state.typeManifests.manifests?.filter((m) => m.entityType === 'piece')
	)

	const mosPlugins = useMosPlugins()
	const [activePlugin, setActivePlugin] = useState<MosPluginConfig>()
	const [error, setError] = useState<string>()

	const [show, setShow] = useState(false)
	const closeModal = () => {
		setShow(false)
		setActivePlugin(undefined)
		setError(undefined)
	}

	const newPiece = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		setShow(true)
	}

	const getNewPieceName = (pieceType: string) => {
		const manifest = typeManifest?.find((m) => m.id === pieceType)
		return manifest?.includeTypeInName ? manifest.name : 'New piece'
	}

	const pieceTypeName = (id: string) => typeManifest?.find((m) => m.id === id)?.name ?? id

	const performCreatePiece = async (
		piece: Pick<NewPiecePayload, 'name' | 'pieceType' | 'start' | 'duration' | 'payload'>,
		pluginName?: string
	) => {
		try {
			const created = await dispatch(
				addNewPiece({ playlistId, rundownId, segmentId, partId, ...piece })
			).unwrap()
			// Close only after success: closing unmounts the plugin frame and loses its work
			closeModal()

			// Navigate user to the new piece
			await navigate({
				to: '/rundown/$rundownId/segment/$segmentId/part/$partId/piece/$pieceId',
				params: { rundownId, segmentId, partId, pieceId: created.id }
			})
		} catch (e) {
			console.error(e)
			// Keep the modal open so the user can retry
			throw new Error(
				`Could not create piece "${piece.name}"${pluginName ? ` from ${pluginName}` : ''}. Try again.`
			)
		}
	}

	const firstPieceType = typeManifest?.[0]?.id
	const [selectedPieceType, setSelectedPieceType] = useState(firstPieceType)
	useEffect(() => {
		setSelectedPieceType((oldType) => {
			if (oldType) return oldType
			return firstPieceType
		})
	}, [firstPieceType])

	return (
		<>
			<button className="add-piece-button mb-1" onClick={newPiece}>
				+ Add Piece
			</button>

			<Modal
				show={show}
				onHide={closeModal}
				size={activePlugin ? 'xl' : undefined}
				// A stray click or Esc must not throw away work in the plugin
				backdrop={activePlugin ? 'static' : true}
				keyboard={!activePlugin}
			>
				<Modal.Header closeButton={!activePlugin}>
					<Modal.Title>
						{activePlugin ? `New piece from ${activePlugin.name}` : 'New piece'}
					</Modal.Title>
				</Modal.Header>
				{activePlugin ? (
					<Modal.Body>
						<MosPluginFrame
							plugin={activePlugin}
							onItem={(item) =>
								performCreatePiece(
									{
										name: item.name,
										pieceType: activePlugin.pieceType,
										start: item.start,
										duration: item.duration,
										payload: { mosItem: item.mosItem, mosPluginId: activePlugin.id }
									},
									activePlugin.name
								)
							}
							onCancel={closeModal}
							workingLabel="Creating..."
						/>
					</Modal.Body>
				) : (
					<>
						<Modal.Body>
							{error && <Alert variant="danger">{error}</Alert>}
							{mosPlugins.length > 0 && (
								<>
									<h6>Add from a plugin</h6>
									<div className="d-flex flex-wrap gap-2">
										{mosPlugins.map((plugin) => (
											<Button
												key={plugin.id}
												variant="outline-primary"
												title={`Uses piece type ${pieceTypeName(plugin.pieceType)}`}
												onClick={() => setActivePlugin(plugin)}
											>
												Add from {plugin.name}
											</Button>
										))}
									</div>
									<Form.Text>
										Each plugin creates pieces of its own configured piece type.
									</Form.Text>
									<div className="text-center text-muted my-3">or</div>
								</>
							)}
							<Form.Group className="mb-3">
								<Form.Label htmlFor="pieceType">Blank piece type:</Form.Label>
								<Form.Select
									id="pieceType"
									name="pieceType"
									value={selectedPieceType}
									onChange={(e) => setSelectedPieceType(e.target.value)}
								>
									{typeManifest
										?.filter((type) => type.entityType === 'piece')
										.map((piece) => (
											<option key={`pieceManifest_${piece.id}`} value={piece.id}>
												{piece.name}
											</option>
										))}
								</Form.Select>
							</Form.Group>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="secondary" onClick={closeModal}>
								Cancel
							</Button>
							<Button
								variant="primary"
								disabled={!selectedPieceType}
								onClick={() => {
									if (!selectedPieceType) return
									setError(undefined)
									performCreatePiece({
										name: getNewPieceName(selectedPieceType),
										pieceType: selectedPieceType
									}).catch((e: Error) => setError(e.message))
								}}
							>
								Create
							</Button>
						</Modal.Footer>
					</>
				)}
			</Modal>
		</>
	)
}
