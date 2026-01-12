import { useNavigate } from '@tanstack/react-router'
import { createSelector } from '@reduxjs/toolkit'
import { useAppDispatch, useAppSelector, type RootState } from '~/store/app'
import { addNewPart, movePart, reorderParts } from '~/store/parts'
import { copySegment } from '~/store/segments'
import type { Part, Segment } from '~backend/background/interfaces'
import { DragTypes } from '~/components/drag-and-drop/DragTypes'
import { DraggableContainer } from '~/components/drag-and-drop/DraggableContainer'
import { SidebarPart } from './part'
import { SidebarElementHeader } from './sidebarElementHeader'
import { useToasts } from '~/components/toasts/useToasts'

const selectAllParts = (state: RootState) => state.parts.parts

const selectPartsBySegmentId = createSelector(
	[selectAllParts, (_: RootState, segmentId: string) => segmentId],
	(parts, segmentId) => parts.filter((p) => p.segmentId === segmentId)
)

export function SidebarSegment({ segment }: { segment: Segment }) {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const toasts = useToasts()

	const parts = useAppSelector((s) => selectPartsBySegmentId(s, segment.id))
	const sortedParts = [...parts].sort((a, b) => a.rank - b.rank)

	const segmentDuration = sortedParts.reduce((acc, part) => acc + (part.payload?.duration ?? 0), 0)

	const handleAddPart = () =>
		dispatch(
			addNewPart({
				rundownId: segment.rundownId,
				playlistId: segment.playlistId,
				segmentId: segment.id
			})
		)
			.unwrap()
			.then((part) =>
				navigate({
					to: `/rundown/${segment.rundownId}/segment/${segment.id}/part/${part.id}`
				})
			)
			.catch(() =>
				toasts.show({
					headerContent: 'Adding part',
					bodyContent: 'Encountered an unexpected error'
				})
			)

	const handleReorderPart = (
		targetPart: Part,
		sourcePart: Part,
		sourceIndex: number,
		targetIndex: number
	) => {
		if (targetPart.segmentId !== sourcePart.segmentId) {
			return dispatch(movePart({ targetPart, sourcePart, sourceIndex, targetIndex }))
				.unwrap()
				.then(async (newPart) => {
					await navigate({
						to: `/rundown/${segment.rundownId}/segment/${newPart.segmentId}/part/${newPart.id}`
					})
				})
				.catch((e) => {
					console.error(e)
					toasts.show({
						headerContent: 'Reordering part',
						bodyContent: 'Encountered an unexpected error'
					})
				})

			// remove part from old segment
		} else {
			return dispatch(reorderParts({ element: sourcePart, sourceIndex, targetIndex }))
				.unwrap()
				.then(async () => {
					await navigate({
						to: `/rundown/${segment.rundownId}/segment/${segment.id}/part/${sourcePart.id}`
					})
				})
				.catch((e) => {
					console.error(e)
					toasts.show({
						headerContent: 'Reordering part',
						bodyContent: 'Encountered an unexpected error'
					})
				})
		}
	}

	const handleCopySegment = () =>
		dispatch(copySegment({ id: segment.id, rundownId: segment.rundownId }))
			.unwrap()
			.then((newSegment) =>
				navigate({
					to: `/rundown/${newSegment.rundownId}/segment/${newSegment.id}`
				})
			)
			.catch(() =>
				toasts.show({
					headerContent: 'Adding segment',
					bodyContent: 'Encountered an unexpected error'
				})
			)

	return (
		<div>
			<div className={'copy-item'}>
				<SidebarElementHeader
					label={segment.name}
					handleCopy={handleCopySegment}
					linkTo={'/rundown/$rundownId/segment/$segmentId'}
					linkParams={{ rundownId: segment.rundownId, segmentId: segment.id }}
					floated={segment.float}
					buttonClassName="segment-button"
					duration={segmentDuration}
				/>
			</div>

			<div className="ps-3">
				<DraggableContainer
					items={sortedParts}
					itemType={DragTypes.PART}
					id={segment.id}
					reorder={handleReorderPart}
					Component={({ data }) => <SidebarPart part={data} segment={segment} />}
				/>

				<button
					className="part-button add-button"
					style={{ marginTop: '2px' }}
					onClick={handleAddPart}
				>
					+ Add Part
				</button>
			</div>
		</div>
	)
}
