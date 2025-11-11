import type { UseNavigateResult } from '@tanstack/react-router'
import { Card, Stack, ListGroup, Button } from 'react-bootstrap'
import { BsChevronDown, BsChevronRight } from 'react-icons/bs'
import type { Segment, Rundown } from '~backend/background/interfaces'
import SegmentItem from './segmentItem'

interface Props {
	rundown: Rundown
	segments: Segment[]
	isExpanded: boolean
	toggle: () => void
	onClone: () => void
	targetRundownId: string
	onClose: () => void
	navigate: UseNavigateResult<string>
}

export default function TemplateRundownCard({
	rundown,
	segments,
	isExpanded,
	toggle,
	onClone,
	targetRundownId,
	onClose,
	navigate
}: Props) {
	const hasSegments = segments.length > 0

	return (
		<Card className="mb-2 shadow-sm">
			<Card.Header
				onClick={toggle}
				style={{ cursor: hasSegments ? 'pointer' : 'default' }}
				className="copy-item"
			>
				<Stack direction="horizontal" className="justify-content-between align-items-center">
					<div className="d-flex align-items-center">
						{hasSegments && (
							<span
								className="me-2"
								style={{ display: 'inline-flex', transition: 'transform 0.2s' }}
							>
								{isExpanded ? <BsChevronDown /> : <BsChevronRight />}
							</span>
						)}
						{rundown.name}
					</div>
					<Button
						size="sm"
						variant="outline-primary"
						onClick={(e) => {
							e.stopPropagation()
							onClone()
						}}
						className="ms-auto copy-icon-button"
					>
						Import full rundown
					</Button>
				</Stack>
			</Card.Header>
			{isExpanded && hasSegments && (
				<Card.Body className="pt-2 pb-2">
					<ListGroup>
						{segments
							.sort((a, b) => a.rank - b.rank)
							.map((segment) => (
								<SegmentItem
									key={segment.id}
									segment={segment}
									targetRundownId={targetRundownId}
									onClose={onClose}
									navigate={navigate}
								/>
							))}
					</ListGroup>
				</Card.Body>
			)}
		</Card>
	)
}
