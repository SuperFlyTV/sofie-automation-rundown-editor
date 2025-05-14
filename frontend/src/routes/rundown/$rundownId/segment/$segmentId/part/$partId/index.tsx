import { createFileRoute, redirect } from '@tanstack/react-router'
import { Col, Row } from 'react-bootstrap'
import { PartPropertiesForm } from '~/components/rundown/partPropertiesForm'
import { PiecesList } from '~/components/rundown/piecesList'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute('/rundown/$rundownId/segment/$segmentId/part/$partId/')({
	component: RouteComponent
})

function RouteComponent() {
	const { rundownId, segmentId, partId } = Route.useParams()

	const part = useAppSelector((state) =>
		state.parts.parts.find(
			(s) => s.rundownId === rundownId && s.segmentId === segmentId && s.id === partId
		)
	)
	if (!part)
		throw redirect({
			to: '/rundown/$rundownId/segment/$segmentId',
			params: { rundownId, segmentId }
		})

	return (
		<Row>
			<Col xs={6} style={{ backgroundColor: 'rgb(30, 30, 30)' }}>
				<PartPropertiesForm part={part} />
			</Col>

			<Col xs={6} style={{ backgroundColor: '#000000' }}>
				<PiecesList part={part} />
			</Col>
		</Row>
	)
}
