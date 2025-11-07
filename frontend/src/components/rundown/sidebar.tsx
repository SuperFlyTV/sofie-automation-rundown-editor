import { Link, useNavigate } from '@tanstack/react-router'
import { useAppDispatch, useAppSelector, type RootState } from '~/store/app'
import { addNewPart, copyPart, movePart, reorderParts } from '~/store/parts'
import { addNewSegment, copySegment, reorderSegments } from '~/store/segments'
import type { Part, Segment } from '~backend/background/interfaces'
import './sidebar.scss'
import classNames from 'classnames'
import { useToasts } from '../toasts/toasts'
import { DragTypes } from '~/components/drag-and-drop/DragTypes'
import { DraggableContainer } from '../drag-and-drop/DraggableContainer'
import { createSelector } from '@reduxjs/toolkit'
import { CopyIconButton } from '../copyIconButton'

const selectAllParts = (state: RootState) => state.parts.parts

const selectPartsBySegmentId = createSelector(
	[selectAllParts, (_state, segmentId) => segmentId],
	(allParts, segmentId) => allParts.filter((part) => part.segmentId === segmentId)
)

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
			<button className="segment-button add-button" onClick={handleAddSegment}>
				+ Add Segment
			</button>
		</div>
	)
}

function SidebarSegment({ segment }: { segment: Segment }) {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const toasts = useToasts()

	const parts = useAppSelector((state) => selectPartsBySegmentId(state, segment.id))
	const sortedParts = [...parts].sort((a, b) => a.rank - b.rank)

	const handleAddPart = () => {
		dispatch(
			addNewPart({
				rundownId: segment.rundownId,
				playlistId: segment.playlistId,
				segmentId: segment.id
			})
		)
			.unwrap()
			.then(async (part) => {
				await navigate({
					to: `/rundown/${segment.rundownId}/segment/${segment.id}/part/${part.id}`
				})
			})
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: 'Adding part',
					bodyContent: 'Encountered an unexpected error'
				})
			})
	}

	const handleCopyPart = (sourcePart: Part) => {
		// perform operation
		dispatch(
			copyPart({
				id: sourcePart.id,
				rundownId: sourcePart.rundownId
			})
		)
			.unwrap()
			.then((newPartResult) => {
				// Navigate user to the new part
				navigate({
					to: '/rundown/$rundownId/segment/$segmentId/part/$partId',
					params: {
						rundownId: newPartResult.rundownId,
						segmentId: newPartResult.segmentId,
						partId: newPartResult.id
					}
				})
			})
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: 'Adding piece',
					bodyContent: 'Encountered an unexpected error'
				})
			})
	}

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

	const segmentDuration = sortedParts.reduce((acc, part) => acc + (part.payload?.duration ?? 0), 0)
	const handleCopySegment = (sourceSegment: Segment) => {
		// perform operation
		dispatch(
			copySegment({
				id: sourceSegment.id,
				rundownId: sourceSegment.rundownId
			})
		)
			.unwrap()
			.then((newSegmentResult) => {
				// Navigate user to the new part
				navigate({
					to: '/rundown/$rundownId/segment/$segmentId',
					params: {
						rundownId: newSegmentResult.rundownId,
						segmentId: newSegmentResult.id
					}
				})
			})
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: 'Adding segment',
					bodyContent: 'Encountered an unexpected error'
				})
			})
	}
	return (
		<div>
			<div className={'copy-item'}>
				<Link
					to="/rundown/$rundownId/segment/$segmentId"
					params={{ rundownId: segment.rundownId, segmentId: segment.id }}
				>
					<button
						className={classNames('segment-button', {
							floated: segment.float
						})}
						style={{ marginBottom: '2px' }}
					>
						{segment.name}
						<span className="item-duration">{displayTime(segmentDuration)}</span>
					</button>
				</Link>
				<CopyIconButton
					onClick={() => handleCopySegment(segment)}
					style={{ position: 'absolute', zIndex: '99', top: '.5em', width: 'auto', right: '.25em' }}
					className="copy-icon-button"
				/>
			</div>
			<div className="ps-3">
				<DraggableContainer
					items={sortedParts}
					itemType={DragTypes.PART}
					Component={({ data: part }) => (
						<div className={'copy-item'}>
							<Link
								key={`sidebarPart_${part.id}`}
								to="/rundown/$rundownId/segment/$segmentId/part/$partId"
								params={{
									rundownId: segment.rundownId,
									segmentId: segment.id,
									partId: part.id
								}}
							>
								<button
									className={classNames('part-button', {
										floated: segment.float || part.float
									})}
								>
									{part.name}
									<span className="item-duration">{displayTime(part.payload?.duration)}</span>
								</button>
							</Link>

							<CopyIconButton
								onClick={() => handleCopyPart(part)}
								style={{ position: 'absolute', zIndex: '99', top: '0', width: 'auto', right: 0 }}
								className="copy-icon-button"
							/>
						</div>
					)}
					id={segment.id}
					reorder={handleReorderPart}
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

function displayTime(seconds: number | undefined) {
	if (!seconds) return

	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = Math.floor(seconds % 60)
	const pad = (t: number) => ('00' + t).substr(-2)

	return `${h > 0 ? pad(h) + ':' : ''}${pad(m)}:${pad(s)}`
}
