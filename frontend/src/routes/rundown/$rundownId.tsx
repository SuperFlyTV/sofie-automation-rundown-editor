import { createFileRoute } from '@tanstack/react-router'
import { EditorNavbar } from '~/components/navbar/navbar'
import { RundownNavbar } from '~/components/rundown/navbar'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute('/rundown/$rundownId')({
	component: RouteComponent
})

function RouteComponent() {
	const { rundownId } = Route.useParams()

	const rundown = useAppSelector((state) => state.rundowns.find((r) => r.id === rundownId))
	if (!rundown) {
		// TODO - or redirect back to the list?
		return (
			<>
				<EditorNavbar />
				<div>Rundown not found</div>
			</>
		)
	}

	return (
		<>
			<RundownNavbar rundown={rundown} />

			<div>Hello {rundownId}!</div>
		</>
	)
}
