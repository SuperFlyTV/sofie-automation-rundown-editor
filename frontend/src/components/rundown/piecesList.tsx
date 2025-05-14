import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import { useAppDispatch, useAppSelector } from '~/store/app'
import './piecesList.scss'
import { addNewPiece } from '~/store/pieces'
import type { Part, Piece } from '~backend/background/interfaces'
import { toTime } from '~/util/lib'

export function PiecesList({ part }: { part: Part }) {
	const pieces = useAppSelector((state) =>
		state.pieces.pieces.filter(
			(piece) =>
				piece.rundownId === part.rundownId &&
				piece.segmentId === part.segmentId &&
				piece.partId === part.id
		)
	)

	return (
		<table className="rundown-pieces-list">
			<tbody>
				{pieces.map((piece) => (
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
	const navigate = useNavigate({ from: '/rundown/$rundownId/segment/$segmentId/part/$partId' })

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

	return (
		<tr onClick={pieceRowClick}>
			<td className="piece-type" style={{ backgroundColor: manifest?.colour }}>
				{manifest?.shortName || piece.pieceType}
			</td>
			<td className="piece-name">{piece.name}</td>
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
	const navigate = useNavigate({ from: '/rundown/$rundownId/segment/$segmentId/part/$partId' })
	const dispatch = useAppDispatch()

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
			.then((piece) => {
				// Navigate user to the new piece
				navigate({
					to: '/rundown/$rundownId/segment/$segmentId/part/$partId/piece/$pieceId',
					params: { rundownId, segmentId, partId, pieceId: piece.id }
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
								<option key={piece.id} value={piece.id}>
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
