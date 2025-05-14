import { useForm } from '@tanstack/react-form'
import { Button, ButtonGroup, Form, Modal } from 'react-bootstrap'
import type { Rundown, SerializedRundown } from '~backend/background/interfaces'
import { CustomDateTimePicker, FieldInfo } from '../form'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { removeRundown, updateRundown } from '~/store/rundowns'
import { useAppDispatch, useAppStore } from '~/store/app'

export function RundownPropertiesForm({ rundown }: { rundown: Rundown }) {
	const dispatch = useAppDispatch()
	const store = useAppStore()

	const form = useForm({
		defaultValues: rundown,
		onSubmit: async (values) => {
			console.log('submit', values)

			await dispatch(updateRundown({ rundown: values.value })).unwrap()

			// Mark as pristine
			form.reset()
		}
	})

	const exportRundown = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		const state = store.getState()

		const serializedRundown: SerializedRundown = {
			rundown: state.rundowns.find((r) => r.id === rundown.id) as Rundown,
			segments: state.segments.segments.filter((segment) => segment.rundownId === rundown.id),
			parts: state.parts.parts.filter((part) => part.rundownId === rundown.id),
			pieces: state.pieces.pieces.filter((piece) => piece.rundownId === rundown.id)
		}

		// Should never happen, but just in case
		if (!serializedRundown.rundown) return

		electronApi
			.saveToFile({
				title: 'Export rundown',
				document: serializedRundown
			})
			.catch((e) => {
				// eslint-disable-next-line no-console
				console.error(e)
				// nocommit TODO
			})
	}

	return (
		<div>
			<h2>Rundown</h2>

			<Form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					form.handleSubmit()
				}}
			>
				<form.Field
					name="name"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Name:</Form.Label>
								<Form.Control
									name={field.name}
									type="text"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>
				<form.Field
					name="sync"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Sync to Sofie:</Form.Label>
								<Form.Switch
									name={field.name}
									type="text"
									checked={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.checked)}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>

				<form.Field
					name="expectedStartTime"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Start time:</Form.Label>
								<CustomDateTimePicker
									name={field.name}
									isClearable
									placeholderText="No start selected"
									selected={field.state.value ? new Date(field.state.value) : null}
									onChange={(date) => field.handleChange(date?.getTime())}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>

				<form.Field
					name="expectedEndTime"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>End time:</Form.Label>
								<CustomDateTimePicker
									name={field.name}
									isClearable
									placeholderText="No end selected"
									selected={field.state.value ? new Date(field.state.value) : null}
									onChange={(date) => field.handleChange(date?.getTime())}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting, state.isPristine]}
					children={([canSubmit, isSubmitting, isPristine]) => (
						<div className="d-flex justify-content-between">
							<DeleteRundownButton
								rundownId={rundown.id}
								rundownName={rundown.name}
								disabled={!canSubmit}
							/>

							<div>
								<Button onClick={exportRundown} variant="secondary" className="me-4">
									Export
								</Button>

								<ButtonGroup>
									<Button
										type="reset"
										onClick={() => form.reset()}
										variant="secondary"
										disabled={isSubmitting || isPristine}
									>
										Discard
									</Button>
									<Button type="submit" disabled={!canSubmit || isPristine} variant="primary">
										{isSubmitting ? '...' : 'Save'}
									</Button>
								</ButtonGroup>
							</div>
						</div>
					)}
				/>
			</Form>
		</div>
	)
}

function DeleteRundownButton({
	rundownId,
	rundownName,
	disabled
}: {
	rundownId: string
	rundownName: string
	disabled: boolean
}) {
	const navigate = useNavigate({ from: '/rundown/$rundownId' })
	const dispatch = useAppDispatch()

	const [showDelete, setShowDelete] = useState(false)
	const handleDeleteClose = () => setShowDelete(false)

	const deleteRundown = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		setShowDelete(true)
	}
	const performDeleteRundown = () => {
		// Navigate user to the list of rundowns
		navigate({ to: '/' })

		// perform operation
		dispatch(removeRundown({ id: rundownId })).unwrap()
	}

	return (
		<>
			<Button onClick={deleteRundown} disabled={disabled} variant="danger">
				Delete
			</Button>

			<Modal show={showDelete} onHide={handleDeleteClose}>
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
