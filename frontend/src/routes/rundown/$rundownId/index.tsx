import { createFileRoute, redirect } from '@tanstack/react-router'
import { RundownPropertiesForm } from '~/components/rundown/rundownPropertiesForm'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute('/rundown/$rundownId/')({
	component: RouteComponent
})

function RouteComponent() {
	const { rundownId } = Route.useParams()

	const rundown = useAppSelector((state) => state.rundowns.find((r) => r.id === rundownId))
	if (!rundown) throw redirect({ to: '/' })

	return (
		<div className="p-4">
			<RundownPropertiesForm rundown={rundown} />
		</div>
	)
}
