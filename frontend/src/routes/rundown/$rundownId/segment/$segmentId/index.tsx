import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rundown/$rundownId/segment/$segmentId/')({
	component: RouteComponent
})

function RouteComponent() {
	const { segmentId } = Route.useParams()

	return <div>Hello {segmentId}!</div>
}
