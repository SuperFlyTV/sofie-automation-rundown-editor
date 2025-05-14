import { createFileRoute, redirect } from '@tanstack/react-router'
import { Col, Row } from 'react-bootstrap'
import { PiecePropertiesForm } from '~/components/rundown/piecePropertiesForm'
import { PiecesList } from '~/components/rundown/piecesList'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute(
	'/rundown/$rundownId/segment/$segmentId/part/$partId/piece/$pieceId'
)({
	component: RouteComponent
})

function RouteComponent() {
	const { rundownId, segmentId, partId, pieceId } = Route.useParams()

	const part = useAppSelector((state) =>
		state.parts.parts.find(
			(s) => s.rundownId === rundownId && s.segmentId === segmentId && s.id === partId
		)
	)

	const piece = useAppSelector((state) =>
		state.pieces.pieces.find(
			(s) =>
				s.rundownId === rundownId &&
				s.segmentId === segmentId &&
				s.partId === partId &&
				s.id === pieceId
		)
	)
	if (!piece || !part)
		throw redirect({
			to: '/rundown/$rundownId/segment/$segmentId/part/$partId',
			params: { rundownId, segmentId, partId }
		})

	return (
		<Row>
			<Col xs={6} style={{ backgroundColor: '#000000' }} className="p-4">
				<PiecesList part={part} />
			</Col>

			<Col xs={6} className="p-4">
				<PiecePropertiesForm piece={piece} />
			</Col>
		</Row>
	)
}
