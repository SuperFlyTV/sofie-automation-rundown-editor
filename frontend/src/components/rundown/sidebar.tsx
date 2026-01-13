import { useNavigate } from '@tanstack/react-router'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { reorderSegments } from '~/store/segments'
import type { Segment } from '~backend/background/interfaces'
import './sidebar.scss'
import { DragTypes } from '~/components/drag-and-drop/DragTypes'
import { DraggableContainer } from '../drag-and-drop/DraggableContainer'
import { useCallback, useState } from 'react'
import ImportSegmentModal from './importSegmentModal/importSegmentModal'
import { SidebarSegment } from './sidebar/segment'
import { useToasts } from '../toasts/useToasts'
import { SegmentButtons } from './sidebar/segmentButtons'

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
	const [showImportModal, setShowImportModal] = useState<number | undefined>(undefined)

	const segments = useAppSelector((state) => state.segments.segments)
	const sortedSegments = [...segments].sort((a, b) => a.rank - b.rank)

	const [openSegments, setOpenSegments] = useState<Record<string, boolean>>({})

	const isSegmentOpen = useCallback(
		(segmentId: string) => openSegments[segmentId] ?? true,
		[openSegments]
	)

	const toggleSegmentOpen = useCallback((segmentId: string) => {
		setOpenSegments((prev) => ({
			...prev,
			[segmentId]: !(prev[segmentId] ?? true)
		}))
	}, [])

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
		<div
			className="rundown-sidebar"
			style={{ marginTop: '2px', overflowY: 'auto', overflowX: 'hidden' }}
		>
			<DraggableContainer
				items={sortedSegments}
				itemType={DragTypes.SEGMENT}
				Component={({ data: segment }) => (
					<>
						<SidebarSegment
							key={segment.id}
							segment={segment}
							isOpen={isSegmentOpen(segment.id)}
							onToggleOpen={() => toggleSegmentOpen(segment.id)}
							setShowImportModal={setShowImportModal}
						/>
					</>
				)}
				id={rundownId}
				reorder={handleReorderSegment}
			/>

			<SegmentButtons
				rundownId={rundownId}
				playlistId={playlistId}
				rank={sortedSegments.length}
				setShowImportModal={setShowImportModal}
			/>

			<ImportSegmentModal
				rank={showImportModal}
				onClose={() => setShowImportModal(undefined)}
				targetRundownId={rundownId}
			/>
		</div>
	)
}
