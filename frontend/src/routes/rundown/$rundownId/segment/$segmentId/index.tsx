import { createFileRoute, redirect } from '@tanstack/react-router'
import { Stack } from 'react-bootstrap'
import { RundownBreadcrumbs } from '~/components/rundown/breadcrumbs'
import { SegmentPropertiesForm } from '~/components/rundown/segmentPropertiesForm'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute('/rundown/$rundownId/segment/$segmentId/')({
	component: RouteComponent
})

function RouteComponent() {
	const { rundownId, segmentId } = Route.useParams()

	const segment = useAppSelector((state) =>
		state.segments.segments.find((s) => s.rundownId === rundownId && s.id === segmentId)
	)
	if (!segment) throw redirect({ to: '/rundown/$rundownId', params: { rundownId } })

	const rundown = useAppSelector((state) => state.rundowns.find((r) => r.id === rundownId))
	return (
		<Stack>
			<RundownBreadcrumbs rundownId={rundownId} />
			<div className="p-4" style={{ backgroundColor: 'rgb(30, 30, 30)', height: '100%' }}>
				<SegmentPropertiesForm segment={segment} rundownIsTemplate={rundown?.isTemplate ?? false} />
			</div>
		</Stack>
	)
}
