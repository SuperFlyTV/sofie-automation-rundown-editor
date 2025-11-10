import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import { useAppDispatch, useAppSelector } from '~/store/app'
import './piecesList.scss'
import { addNewPiece, copyPiece } from '~/store/pieces'
import type { Part, Piece } from '~backend/background/interfaces'
import { toTime } from '~/util/lib'
import { useToasts } from '../toasts/toasts'
import { createSelector } from '@reduxjs/toolkit'
import { CopyIconButton } from '../copyIconButton'

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
		state.piecesManifest.manifest?.find((p) => p.id === piece.pieceType)
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
				<CopyIconButton onClick={performCopyPiece} />
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
	const toasts = useToasts()

	const piecesManifest = useAppSelector((state) => state.piecesManifest.manifest)

	const [show, setShow] = useState(false)
	const handleDeleteClose = () => setShow(false)

	const newPiece = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		setShow(true)
	}
	const performCreatePiece = () => {
		if (!selectedPieceType) return

		const manifest = piecesManifest?.find((piece) => piece.id === selectedPieceType)

		setShow(false)

		// perform operation
		dispatch(
			addNewPiece({
				playlistId,
				rundownId,
				segmentId,
				partId,
				name: manifest && manifest.includeTypeInName ? manifest.name : 'New piece',
				pieceType: selectedPieceType
			})
		)
			.unwrap()
			.then(async (piece) => {
				// Navigate user to the new piece
				await navigate({
					to: '/rundown/$rundownId/segment/$segmentId/part/$partId/piece/$pieceId',
					params: { rundownId, segmentId, partId, pieceId: piece.id }
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

	const firstPieceType = piecesManifest?.[0]?.id
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

			<Modal show={show} onHide={handleDeleteClose}>
				<Modal.Header closeButton>
					<Modal.Title>New piece</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form.Group className="mb-3">
						<Form.Label htmlFor="pieceType">Piece type:</Form.Label>
						<Form.Select
							name="pieceType"
							value={selectedPieceType}
							onChange={(e) => setSelectedPieceType(e.target.value)}
						>
							{piecesManifest?.map((piece) => (
								<option key={`pieceManifest_${piece.id}`} value={piece.id}>
									{piece.name}
								</option>
							))}
						</Form.Select>
					</Form.Group>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={handleDeleteClose}>
						Cancel
					</Button>
					<Button variant="primary" onClick={performCreatePiece}>
						Create
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
