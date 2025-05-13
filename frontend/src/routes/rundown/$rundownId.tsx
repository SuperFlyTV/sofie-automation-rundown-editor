import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rundown/$rundownId')({
	component: RouteComponent
})

function RouteComponent() {
	const { rundownId } = Route.useParams()

	return <div>Hello {rundownId}!</div>
}
