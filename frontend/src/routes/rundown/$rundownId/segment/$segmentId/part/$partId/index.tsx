import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Stack } from 'react-bootstrap'
import { RundownBreadcrumbs } from '~/components/rundown/breadcrumbs'
import { PartPropertiesForm } from '~/components/rundown/partPropertiesForm'
import { PiecesList } from '~/components/rundown/piecesList'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute('/rundown/$rundownId/segment/$segmentId/part/$partId/')({
	component: RouteComponent
})

function RouteComponent() {
	const navigate = useNavigate()
	const { rundownId, segmentId, partId } = Route.useParams()

	const part = useAppSelector((state) =>
		state.parts.parts.find(
			(s) => s.rundownId === rundownId && s.segmentId === segmentId && s.id === partId
		)
	)

	if (!part) {
		navigate({
			to: `/rundown/${rundownId}/segment/${segmentId}`
		})
		return null
	}

	return (
		<Stack className="rundown-main-content">
			<RundownBreadcrumbs rundownId={rundownId} />
			<Stack
				direction="horizontal"
				key={`form_${partId}`}
				style={{ height: '100%', overflowY: 'auto' }}
			>
				<div
					style={{ backgroundColor: 'rgb(30, 30, 30)', flexGrow: 2, height: '100%' }}
					className="p-4"
				>
					<PartPropertiesForm key={`partForm_${partId}`} part={part} />
				</div>
				<div style={{ backgroundColor: '#000000', flexGrow: 1, height: '100%' }} className="p-4">
					<PiecesList key={`piecesList_${partId}`} part={part} />
				</div>
			</Stack>
		</Stack>
	)
}
