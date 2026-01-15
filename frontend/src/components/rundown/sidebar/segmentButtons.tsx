import { useNavigate } from '@tanstack/react-router'
import { type Dispatch, type SetStateAction } from 'react'
import { Stack } from 'react-bootstrap'
import { BsPlus, BsBoxArrowInUp } from 'react-icons/bs'
import { useToasts } from '~/components/toasts/useToasts'
import { useAppDispatch } from '~/store/app'
import { addNewSegment } from '~/store/segments'

export function SegmentButtons({
	rundownId,
	playlistId,
	rank,
	setShowImportModal
}: {
	rundownId: string
	playlistId: string | null
	rank: number
	setShowImportModal: Dispatch<SetStateAction<number | undefined>>
}) {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const toasts = useToasts()

	const handleAddSegment = () => {
		dispatch(addNewSegment({ rundownId, playlistId, rank }))
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

	return (
		<>
			<Stack className="segment-buttons" direction="horizontal">
				<button className="segment-button add-button" onClick={handleAddSegment}>
					<BsPlus className="icon-lg" aria-hidden />
					New Segment
				</button>
				<button className="segment-button add-button" onClick={() => setShowImportModal(rank)}>
					<BsBoxArrowInUp aria-hidden style={{ marginRight: '.2em' }} />
					Import Segments
				</button>
			</Stack>
		</>
	)
}
