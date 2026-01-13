import { useState } from 'react'
import { Button, Modal, type ButtonProps } from 'react-bootstrap'
import { useToasts } from './toasts/useToasts'

type DeleteButtonWrapperProps = {
	entityLabel: string
	entityName?: string
	disabled: boolean
	onDelete: () => Promise<unknown>
	onSuccessNavigate?: () => void
	renderButton?: (props: {
		onClick: (e: React.MouseEvent) => void
		disabled: boolean
	}) => React.ReactNode
} & ButtonProps

export function DeleteButtonWrapper({
	entityLabel,
	entityName,
	disabled,
	onDelete,
	onSuccessNavigate,
	renderButton,
	...rest
}: DeleteButtonWrapperProps) {
	const toasts = useToasts()
	const [show, setShow] = useState(false)

	const title = `Delete ${entityLabel}`
	const toastHeader = `Deleting ${entityLabel}`
	const body = entityName
		? `Are you sure you want to delete "${entityName}"?`
		: `Are you sure you want to delete this ${entityLabel}?`

	const open = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setShow(true)
	}

	const close = () => setShow(false)

	const confirm = () => {
		close()

		onDelete()
			.then(() => {
				onSuccessNavigate?.()
			})
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: toastHeader,
					bodyContent: 'Encountered an unexpected error'
				})
			})
	}

	return (
		<>
			{renderButton ? (
				renderButton({ onClick: open, disabled })
			) : (
				<Button variant="danger" disabled={disabled} onClick={open} {...rest}>
					Delete
				</Button>
			)}

			<Modal show={show} onHide={close} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
				<Modal.Header closeButton>
					<Modal.Title>{title}</Modal.Title>
				</Modal.Header>
				<Modal.Body>{body}</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={close}>
						Cancel
					</Button>
					<Button variant="danger" onClick={confirm}>
						Delete
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
