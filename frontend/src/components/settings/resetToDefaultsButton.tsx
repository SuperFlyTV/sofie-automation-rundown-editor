import { Button, Modal } from 'react-bootstrap'
import { useState } from 'react'

export function ResetToDefaults() {
	const [showDelete, setShowDelete] = useState(false)
	const handleDeleteClose = () => setShowDelete(false)

	const deletePart = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		setShowDelete(true)
	}
	const performDeletePart = () => {
		electronApi
			.resetSettings()
			.then(() => {
				console.log('reset settings')
				window.location.reload()
			})
			.catch((e) => {
				console.error('Error resetting settings:', e)
			})
	}

	return (
		<>
			<Button onClick={deletePart} variant="warning">
				Reset to defaults
			</Button>

			<Modal show={showDelete} onHide={handleDeleteClose}>
				<Modal.Header closeButton>
					<Modal.Title>Reset to defaults</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					Are you sure you want to reset all settings and piece types to their defaults? This action
					cannot be undone.
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={handleDeleteClose}>
						Cancel
					</Button>
					<Button variant="danger" onClick={performDeletePart}>
						Reset
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
