import { Link, useNavigate } from '@tanstack/react-router'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { addNewPart } from '~/store/parts'
import { addNewSegment } from '~/store/segments'
import type { Segment } from '~backend/background/interfaces'
import './sidebar.scss'
import classNames from 'classnames'

export function RundownSidebar({
	rundownId,
	playlistId
}: {
	rundownId: string
	playlistId: string | null
}) {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	const segments = useAppSelector((state) => state.segments.segments)
	const sortedSegments = [...segments].sort((a, b) => a.rank - b.rank)

	const handleAddSegment = () => {
		dispatch(addNewSegment({ rundownId, playlistId, rank: sortedSegments.length }))
			.unwrap()
			.then(async (segment) => {
				await navigate({ to: `/rundown/${rundownId}/segment/${segment.id}` })
			})
	}

	return (
		<div className="rundown-sidebar">
			{sortedSegments.map((segment) => (
				<SidebarSegment key={segment.id} segment={segment} />
			))}
			<button className="segment-button add-button" onClick={handleAddSegment}>
				+ Add Segment
			</button>
		</div>
	)
}

function SidebarSegment({ segment }: { segment: Segment }) {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	const parts = useAppSelector((state) =>
		state.parts.parts.filter((part) => part.segmentId === segment.id)
	)
	const sortedParts = [...parts].sort((a, b) => a.rank - b.rank)

	const handleAddPart = () => {
		dispatch(
			addNewPart({
				rundownId: segment.rundownId,
				playlistId: segment.playlistId,
				segmentId: segment.id,
				rank: sortedParts.length
			})
		)
			.unwrap()
			.then(async (part) => {
				await navigate({
					to: `/rundown/${segment.rundownId}/segment/${segment.id}/part/${part.id}`
				})
			})
	}

	const segmentDuration = sortedParts.reduce((acc, part) => acc + (part.payload.duration ?? 0), 0)

	return (
		<div className="mb-1">
			<Link
				to="/rundown/$rundownId/segment/$segmentId"
				params={{ rundownId: segment.rundownId, segmentId: segment.id }}
			>
				{/* // TODO - highlight when active */}
				<button
					className={classNames('segment-button mb-1', {
						floated: segment.float
					})}
				>
					{segment.name}
					<span className="item-duration">{displayTime(segmentDuration)}</span>
				</button>
			</Link>

			<div className="ps-3">
				{sortedParts.map((part) => (
					<Link
						key={part.id}
						to="/rundown/$rundownId/segment/$segmentId/part/$partId"
						params={{ rundownId: segment.rundownId, segmentId: segment.id, partId: part.id }}
					>
						{/* // TODO - highlight when active */}
						<button
							className={classNames('part-button mb-1', {
								floated: segment.float || part.float
							})}
						>
							{part.name}
							<span className="item-duration">{displayTime(part.payload.duration)}</span>
						</button>
					</Link>
				))}
				<button className="part-button add-button mb-2" onClick={handleAddPart}>
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
