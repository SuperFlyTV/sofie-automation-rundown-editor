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
			<div className="rundown-main-content-properties">
				<Stack
					direction="horizontal"
					key={`form_${partId}`}
					style={{ overflowY: 'auto', alignItems: 'stretch' }}
				>
					<Stack
						style={{
							backgroundColor: 'rgb(30, 30, 30)',
							flexGrow: 2,
							minHeight: '100%'
						}}
						className="p-4"
					>
						<PartPropertiesForm key={`partForm_${partId}`} part={part} />
					</Stack>
					<Stack
						style={{ backgroundColor: '#000000', flexGrow: 1, minHeight: '100%' }}
						className="p-4"
					>
						<PiecesList key={`piecesList_${partId}`} part={part} />
					</Stack>
				</Stack>
			</div>
		</Stack>
	)
}
