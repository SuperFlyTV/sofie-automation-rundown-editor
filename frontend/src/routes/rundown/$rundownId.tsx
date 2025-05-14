import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { EditorNavbar } from '~/components/navbar/navbar'
import { RundownBreadcrumbs } from '~/components/rundown/breadcrumbs'
import { RundownNavbar } from '~/components/rundown/navbar'
import { RundownSidebar } from '~/components/rundown/sidebar'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { loadParts } from '~/store/parts'
import { loadPieces } from '~/store/pieces'
import { loadSegments } from '~/store/segments'

export const Route = createFileRoute('/rundown/$rundownId')({
	component: RouteComponent
})

function RouteComponent() {
	const { rundownId } = Route.useParams()

	const dispatch = useAppDispatch()
	const loadStatus = useAppSelector((state) => ({
		segmentsStatus: state.segments.status,
		segmentsRundownId: state.segments.rundownId,
		partsStatus: state.parts.status,
		partsRundownId: state.parts.rundownId,
		piecesStatus: state.pieces.status,
		piecesRundownId: state.pieces.rundownId
	}))

	// TODO: This is not the correct way to do this, but it works for now
	useEffect(() => {
		if (loadStatus.segmentsStatus === 'idle' || loadStatus.segmentsRundownId !== rundownId) {
			dispatch(loadSegments({ rundownId }))
		}
		if (loadStatus.partsStatus === 'idle' || loadStatus.partsRundownId !== rundownId) {
			dispatch(loadParts({ rundownId }))
		}
		if (loadStatus.piecesStatus === 'idle' || loadStatus.piecesRundownId !== rundownId) {
			dispatch(loadPieces({ rundownId }))
		}
	}, [
		loadStatus.segmentsStatus,
		loadStatus.segmentsRundownId,
		loadStatus.partsStatus,
		loadStatus.partsRundownId,
		loadStatus.piecesStatus,
		loadStatus.piecesRundownId,
		rundownId,
		dispatch
	])

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

			<RundownBreadcrumbs rundownId={rundown.id} rundownName={rundown.name} />
		</>
	)
}

const layoutStyle: React.CSSProperties = {
	display: 'grid',
	gridAutoFlow: 'column',
	gridTemplateColumns: '1fr 3fr'
}
