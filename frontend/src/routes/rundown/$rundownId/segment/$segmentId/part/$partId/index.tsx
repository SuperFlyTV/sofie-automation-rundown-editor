import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rundown/$rundownId/segment/$segmentId/part/$partId/')({
	component: RouteComponent
})

function RouteComponent() {
	const { segmentId, partId } = Route.useParams()

	return (
		<div>
			Hello {segmentId}/{partId}!
		</div>
	)
}
