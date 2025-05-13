import { Link, useNavigate } from '@tanstack/react-router'
import { useAppDispatch, useAppSelector } from '~/store/app'
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
	return (
		<div className="mb-1">
			<Link
				to="/rundown/$rundownId/segment/$segmentId"
				params={{ rundownId: segment.rundownId, segmentId: segment.id }}
			>
				{/* // TODO - highlight when active */}
				<button style={segmentStyle}>{segment.name}</button>
			</Link>
		</div>
	)
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
	// height: 2.4em;
	color: 'white'
}

const addSegmentStyle: React.CSSProperties = {
	...segmentStyle,
	color: '#777'
}
