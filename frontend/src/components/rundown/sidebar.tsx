import { useNavigate } from '@tanstack/react-router'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { addNewSegment, reorderSegments } from '~/store/segments'
import type { Segment } from '~backend/background/interfaces'
import './sidebar.scss'
import { DragTypes } from '~/components/drag-and-drop/DragTypes'
import { DraggableContainer } from '../drag-and-drop/DraggableContainer'
import { BsBoxArrowInDownRight } from 'react-icons/bs'
import { useState } from 'react'
import ImportSegmentModal from './importSegmentModal/importSegmentModal'
import { SidebarSegment } from './sidebar/segment'
import { useToasts } from '../toasts/useToasts'

export function RundownSidebar({
	rundownId,
	playlistId
}: {
	rundownId: string
	playlistId: string | null
}) {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const toasts = useToasts()
	const [showImportModal, setShowImportModal] = useState(false)

	const segments = useAppSelector((state) => state.segments.segments)
	const sortedSegments = [...segments].sort((a, b) => a.rank - b.rank)

	const handleAddSegment = () => {
		dispatch(addNewSegment({ rundownId, playlistId, rank: sortedSegments.length }))
			.unwrap()
			.then(async (segment) => {
				await navigate({ to: `/rundown/${rundownId}/segment/${segment.id}` })
			})
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: 'Adding segment',
					bodyContent: 'Encountered an unexpected error'
				})
			})
	}

	const handleReorderSegment = (
		_targetSegment: Segment,
		sourceSegment: Segment,
		sourceIndex: number,
		targetIndex: number
	) => {
		return dispatch(reorderSegments({ element: sourceSegment, sourceIndex, targetIndex }))
			.unwrap()
			.then(async () => {
				await navigate({
					to: `/rundown/${sourceSegment.rundownId}/segment/${sourceSegment.id}`
				})
			})
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: 'Reordering Segment',
					bodyContent: 'Encountered an unexpected error'
				})
			})
	}

	return (
		<div className="rundown-sidebar" style={{ marginTop: '2px' }}>
			<DraggableContainer
				items={sortedSegments}
				itemType={DragTypes.SEGMENT}
				Component={({ data: segment }) => (
					<>
						<SidebarSegment key={segment.id} segment={segment} />
					</>
				)}
				id={rundownId}
				reorder={handleReorderSegment}
			/>
			<div className="d-flex gap-1">
				<button className="segment-button add-button" onClick={handleAddSegment}>
					+ Add Segment
				</button>

				<button className="segment-button add-button" onClick={() => setShowImportModal(true)}>
					<BsBoxArrowInDownRight style={{ top: '-.15em', position: 'relative' }} /> Import Segment
				</button>
			</div>

			<ImportSegmentModal
				show={showImportModal}
				onClose={() => setShowImportModal(false)}
				targetRundownId={rundownId}
			/>
		</div>
	)
}
