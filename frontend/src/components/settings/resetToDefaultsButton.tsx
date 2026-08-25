import { Button, Modal } from 'react-bootstrap'
import { useState } from 'react'
import { ipcAPI } from '~/lib/IPC'

export function ResetToDefaults() {
	const [showDelete, setShowDelete] = useState(false)
	const handleDeleteClose = () => setShowDelete(false)

	const resetSettings = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		setShowDelete(true)
	}
	const performResetSettings = () => {
		ipcAPI
			.resetSettings()
			.then(() => {
				window.location.reload()
			})
			.catch((e) => {
				console.error('Error resetting settings:', e)
			})
	}

	return (
		<>
			<Button onClick={resetSettings} variant="warning">
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
					<Button variant="danger" onClick={performResetSettings}>
						Reset
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
