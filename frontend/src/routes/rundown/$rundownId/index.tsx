import { createFileRoute } from '@tanstack/react-router'
import { RundownPropertiesForm } from '~/components/rundown/rundownPropertiesForm'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute('/rundown/$rundownId/')({
	component: RouteComponent
})

function RouteComponent() {
	const { rundownId } = Route.useParams()

	const rundown = useAppSelector((state) => state.rundowns.find((r) => r.id === rundownId))
	if (!rundown) {
		// TODO - or redirect back to the list?
		return <div>Rundown not found</div>
	}

	return <RundownPropertiesForm rundown={rundown} />
}
