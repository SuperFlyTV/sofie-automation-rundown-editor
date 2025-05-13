import { createFileRoute, redirect } from '@tanstack/react-router'
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

	return <SegmentPropertiesForm segment={segment} />
}
