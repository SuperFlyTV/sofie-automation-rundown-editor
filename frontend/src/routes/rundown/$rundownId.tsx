import { createFileRoute, Outlet } from '@tanstack/react-router'
import { EditorNavbar } from '~/components/navbar/navbar'
import { RundownNavbar } from '~/components/rundown/navbar'
import { RundownSidebar } from '~/components/rundown/sidebar'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute('/rundown/$rundownId')({
	component: RouteComponent
})

function RouteComponent() {
	const { rundownId } = Route.useParams()

	// TODO - load content from the backend

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

			<div style={layoutStyle}>
				<RundownSidebar />

				<Outlet />
			</div>

			<div>Breadcrumbs: TODO (sticky bottom)</div>
		</>
	)
}

const layoutStyle: React.CSSProperties = {
	display: 'grid',
	gridAutoFlow: 'column',
	gridTemplateColumns: '1fr 3fr'
}
