import { createFileRoute } from '@tanstack/react-router'
import { Stack } from 'react-bootstrap'
import { RundownBreadcrumbs } from '~/components/rundown/breadcrumbs'
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
	const navigate = Route.useNavigate()

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
	if (!piece || !part) {
		navigate({
			to: `/rundown/${rundownId}/segment/${segmentId}/${partId}`
		})
		return null
	}

	return (
		<Stack>
			<RundownBreadcrumbs rundownId={rundownId} />
			<Stack
				direction="horizontal"
				key={`form_${partId}`}
				style={{ height: '100%', overflowY: 'auto' }}
			>
				<div style={{ backgroundColor: '#000000', flexGrow: 1, height: '100%' }} className="p-4">
					<PiecesList key={`piecesList_${partId}`} part={part} />
				</div>
				<div
					style={{ backgroundColor: 'rgb(30, 30, 30)', flexGrow: 2, height: '100%' }}
					className="p-4"
				>
					<PiecePropertiesForm key={`piecesProperties_${piece.id}`} piece={piece} />
				</div>
			</Stack>
		</Stack>
	)
}
