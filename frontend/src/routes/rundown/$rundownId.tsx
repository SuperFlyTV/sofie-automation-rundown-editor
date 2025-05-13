import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { EditorNavbar } from '~/components/navbar/navbar'
import { RundownNavbar } from '~/components/rundown/navbar'
import { RundownSidebar } from '~/components/rundown/sidebar'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { loadSegments } from '~/store/segments'

export const Route = createFileRoute('/rundown/$rundownId')({
	component: RouteComponent
})

function RouteComponent() {
	const { rundownId } = Route.useParams()

	const dispatch = useAppDispatch()
	const segmentsStatus = useAppSelector((state) => ({
		status: state.segments.status,
		rundownId: state.segments.rundownId
	}))

	// TODO - load content from the backend

	useEffect(() => {
		if (segmentsStatus.status === 'idle' || segmentsStatus.rundownId !== rundownId) {
			dispatch(loadSegments({ rundownId }))
		}
	}, [segmentsStatus.status, segmentsStatus.rundownId, dispatch])

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
				<RundownSidebar rundownId={rundown.id} playlistId={rundown.playlistId} />

				<div className="p-4">
					<Outlet />
				</div>
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
