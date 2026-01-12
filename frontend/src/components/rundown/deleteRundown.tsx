import { Button, Modal, type ButtonProps } from 'react-bootstrap'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { removeRundown } from '~/store/rundowns'
import { useAppDispatch } from '~/store/app'
import { useToasts } from '../toasts/useToasts'

export function DeleteRundownButton({
	rundownId,
	rundownName,
	disabled,
	renderButton,
	...rest
}: {
	rundownId: string
	rundownName: string
	disabled: boolean
	renderButton?: (props: {
		onClick: (e: React.MouseEvent) => void
		disabled: boolean
	}) => React.ReactNode
} & ButtonProps) {
	const navigate = useNavigate()
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	const [showDelete, setShowDelete] = useState(false)
	const handleDeleteClose = () => {
		setShowDelete(false)
	}

	const showModal = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		setShowDelete(true)
	}
	const performDeleteRundown = () => {
		setShowDelete(false)

		dispatch(removeRundown({ id: rundownId }))
			.unwrap()
			.then(() => {
				// Only navigate if we are currently on the deleted rundown
				navigate({ to: '/' })
			})
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: 'Deleting rundown',
					bodyContent: 'Encountered an unexpected error'
				})
			})
	}

	return (
		<>
			{renderButton ? (
				renderButton({
					disabled,
					...rest,
					onClick: showModal
				})
			) : (
				<Button onClick={showModal} disabled={disabled} variant="danger">
					Delete
				</Button>
			)}

			<Modal
				show={showDelete}
				onHide={handleDeleteClose}
				onClick={(e: React.MouseEvent) => e.stopPropagation()}
			>
				<Modal.Header closeButton>
					<Modal.Title>Delete rundown</Modal.Title>
				</Modal.Header>
				<Modal.Body>Are you sure you want to delete "{rundownName}"?</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={handleDeleteClose}>
						Cancel
					</Button>
					<Button variant="danger" onClick={performDeleteRundown}>
						Delete
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
