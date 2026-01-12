import type { UseNavigateResult } from '@tanstack/react-router'
import { ListGroup, Stack, Button } from 'react-bootstrap'
import { useToasts } from '~/components/toasts/useToasts'
import { useAppDispatch } from '~/store/app'
import { copySegment } from '~/store/segments'
import type { Segment } from '~backend/background/interfaces'

interface Props {
	segment: Segment
	targetRundownId: string
	onClose: () => void
	navigate: UseNavigateResult<string>
}

export default function SegmentItem({ segment, targetRundownId, onClose, navigate }: Props) {
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	const handleCopySegment = (sourceSegment: Segment) => {
		dispatch(copySegment({ id: sourceSegment.id, rundownId: targetRundownId, preserveName: true }))
			.unwrap()
			.then((newSegmentResult) => {
				onClose()
				navigate({ to: `/rundown/${newSegmentResult.rundownId}/segment/${newSegmentResult.id}` })
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
		<ListGroup.Item className="copy-item">
			<Stack direction="horizontal" className="justify-content-between align-items-center">
				<div>{segment.name}</div>
				<Button
					size="sm"
					variant="outline-primary"
					onClick={() => handleCopySegment(segment)}
					className="ms-auto copy-icon-button"
				>
					Import
				</Button>
			</Stack>
		</ListGroup.Item>
	)
}
