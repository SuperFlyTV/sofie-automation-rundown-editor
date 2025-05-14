import { Link, useNavigate } from '@tanstack/react-router'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { addNewPart } from '~/store/parts'
import { addNewSegment } from '~/store/segments'
import type { Segment } from '~backend/background/interfaces'

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
		<div>
			{sortedSegments.map((segment) => (
				<SidebarSegment key={segment.id} segment={segment} />
			))}
			<button style={addSegmentStyle} onClick={handleAddSegment}>
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
				<button style={segment.float ? floatedSegmentStyle : segmentStyle} className="mb-1">
					{segment.name}
					<span style={timeStyle}>{displayTime(segmentDuration)}</span>
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
							style={segment.float || part.float ? floatedPartStyle : partStyle}
							className="mb-1"
						>
							{part.name}
							<span style={timeStyle}>{displayTime(part.payload.duration)}</span>
						</button>
					</Link>
				))}
				<button style={addPartStyle} onClick={handleAddPart} className="mb-2">
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

const baseButtonStyle: React.CSSProperties = {
	padding: '0.2em',
	textDecoration: 'none',

	display: 'block',
	border: 'none',
	width: '100%',
	textAlign: 'left'
}

const segmentStyle: React.CSSProperties = {
	...baseButtonStyle,

	backgroundColor: '#4b4b4b',
	fontSize: '1.2em',
	lineHeight: '2em',
	color: 'white'
}
const floatedSegmentStyle: React.CSSProperties = {
	...segmentStyle,
	textDecoration: 'line-through'
}

const addSegmentStyle: React.CSSProperties = {
	...segmentStyle,
	color: '#777'
}

const partStyle: React.CSSProperties = {
	...baseButtonStyle,

	backgroundColor: '#353535',
	fontSize: '1em',
	lineHeight: '1.5em',
	color: 'white'
}
const floatedPartStyle: React.CSSProperties = {
	...partStyle,
	textDecoration: 'line-through'
}

const addPartStyle: React.CSSProperties = {
	...partStyle,
	color: '#777'
}

const timeStyle: React.CSSProperties = {
	fontSize: '0.7em',
	color: '#b2b2b2',
	marginLeft: '0.5em'
}
