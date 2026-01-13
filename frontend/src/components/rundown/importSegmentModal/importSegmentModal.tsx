import { useEffect, useState } from 'react'
import { Modal, Spinner, Button, ListGroup } from 'react-bootstrap'
import { useNavigate } from '@tanstack/react-router'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { loadTemplateSegments } from '~/store/templateSegments'
import { cloneSegmentsFromRundownToRundown } from '~/store/segments'
import type { Rundown } from '~backend/background/interfaces'
import RundownItem from './rundownItem'
import TemplateRundownCard from './templateRundownCard'
import { useToasts } from '~/components/toasts/useToasts'

interface ImportSegmentModalProps {
	onClose: () => void
	targetRundownId: string
	rank?: number
}

export default function ImportSegmentModal({
	onClose,
	targetRundownId,
	rank
}: ImportSegmentModalProps) {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const toasts = useToasts()

	const { templateSegments, status: templateStatus } = useAppSelector((state) => ({
		templateSegments: state.templateSegments.templates,
		status: state.templateSegments.status
	}))

	const currentRundown = useAppSelector((state) =>
		state.rundowns.find((r) => r.id === targetRundownId)
	)

	const rundowns = useAppSelector((state) =>
		state.rundowns.slice().sort((a, b) => {
			if (!currentRundown) return 0
			const aMatch = a.isTemplate && currentRundown.name.includes(a.name) ? -1 : 1
			const bMatch = b.isTemplate && currentRundown.name.includes(b.name) ? -1 : 1
			return aMatch - bMatch
		})
	)

	const [loading, setLoading] = useState(false)
	const [expandedTemplates, setExpandedTemplates] = useState<string[]>(() =>
		rundowns
			.filter((rd) => rd.isTemplate && currentRundown?.name.includes(rd.name))
			.map((rd) => rd.id)
	)

	useEffect(() => {
		if (rank !== undefined) {
			dispatch(loadTemplateSegments())
				.unwrap()
				.catch(() =>
					toasts.show({
						headerContent: 'Loading segments',
						bodyContent: 'Failed to load template segments'
					})
				)
		}
	}, [rank, dispatch, toasts])

	const toggleTemplate = (id: string, hasSegments: boolean) => {
		if (!hasSegments) return
		setExpandedTemplates((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		)
	}

	const handleCloneRundownSegments = (sourceRundown: Rundown) => {
		setLoading(true)
		dispatch(
			cloneSegmentsFromRundownToRundown({
				fromRundownId: sourceRundown.id,
				toRundownId: targetRundownId
			})
		)
			.unwrap()
			.then(() => onClose())
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: 'Importing segments',
					bodyContent: 'Encountered an unexpected error'
				})
			})
			.finally(() => setLoading(false))
	}

	return (
		<Modal show={rank !== undefined} onHide={onClose} size="lg">
			<Modal.Header closeButton>
				<Modal.Title>Import Segment</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<h6>Templates:</h6>
				{templateStatus === 'pending' ? (
					<div className="d-flex justify-content-center py-3">
						<Spinner animation="border" />
					</div>
				) : templateSegments.length > 0 || rundowns.some((rd) => rd.isTemplate) ? (
					rundowns
						.filter((rd) => rd.isTemplate)
						.map((rd) => (
							<TemplateRundownCard
								key={rd.id}
								rundown={rd}
								segments={templateSegments.filter((s) => s.rundownId === rd.id)}
								isExpanded={expandedTemplates.includes(rd.id)}
								toggle={() => toggleTemplate(rd.id, !!rd)}
								onClone={() => handleCloneRundownSegments(rd)}
								targetRundownId={targetRundownId}
								onClose={onClose}
								navigate={navigate}
								rank={rank ?? 0}
							/>
						))
				) : (
					<p className="text-muted fst-italic">No template segments or rundowns available</p>
				)}

				<h6>Rundowns:</h6>
				<ListGroup>
					{rundowns.filter((rd) => !rd.isTemplate).length > 0 ? (
						rundowns
							.filter((rd) => !rd.isTemplate)
							.map((rd) => (
								<RundownItem
									key={rd.id}
									rundown={rd}
									onClone={() => handleCloneRundownSegments(rd)}
								/>
							))
					) : (
						<p className="text-muted fst-italic">No rundowns available</p>
					)}
				</ListGroup>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={onClose} disabled={loading}>
					Cancel
				</Button>
			</Modal.Footer>
		</Modal>
	)
}
