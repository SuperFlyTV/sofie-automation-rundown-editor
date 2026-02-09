import { useForm } from '@tanstack/react-form'
import { Button, ButtonGroup, Form, Modal } from 'react-bootstrap'
import type { Part } from '~backend/background/interfaces'
import { FieldInfo } from '../form'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { removePart, updatePart } from '~/store/parts'
import { useToasts } from '../toasts/useToasts'

export function PartPropertiesForm({ part }: { part: Part }) {
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	const manifests = useAppSelector((state) => state.typeManifests.manifests)

	const form = useForm({
		defaultValues: part,
		onSubmit: async (values) => {
			console.log('submit', values)

			try {
				await dispatch(updatePart({ part: values.value })).unwrap()

				// Mark as pristine
				form.reset()
			} catch (e) {
				console.error(e)
				toasts.show({
					headerContent: 'Saving part',
					bodyContent: 'Encountered an unexpected error'
				})
			}
		}
	})

	return (
		<div>
			<h2>Part</h2>

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
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>
				<form.Field
					name="float"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Float:</Form.Label>
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
					name="partType"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Type:</Form.Label>
								<Form.Select
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								>
									<PartTypeOptions />
								</Form.Select>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>
				<form.Field
					name="duration"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Duration (seconds):</Form.Label>
								<Form.Control
									name={field.name}
									type="number"
									value={Number(field.state.value ?? 0)}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(Number(e.target.value))}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>
				<form.Field
					name="script"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Script:</Form.Label>
								<Form.Control
									name={field.name}
									as="textarea"
									rows={3}
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>

				<form.Subscribe selector={(state) => state.values.partType}>
					{(segmentType) => {
						const manifest = manifests?.find((m) => m.id === segmentType)

						if (!manifest) {
							return (
								<Form.Group className="mb-3">
									<Form.Text>Type not found</Form.Text>
								</Form.Group>
							)
						}

						return (
							<>
								{manifest.payload?.map((fieldInfo) => (
									<form.Field key={`payload.${fieldInfo.id}`} name={`payload.${fieldInfo.id}`}>
										{(field) => (
											<>
												<Form.Group className="mb-3">
													<Form.Label htmlFor={field.name}>{fieldInfo.label}:</Form.Label>

													{fieldInfo.type === 'string' && (
														<Form.Control
															type="text"
															value={String(field.state.value ?? '')}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.value)}
														/>
													)}

													{fieldInfo.type === 'number' && (
														<Form.Control
															name={field.name}
															type="number"
															value={Number(field.state.value ?? 0)}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(Number(e.target.value))}
														/>
													)}

													{fieldInfo.type === 'boolean' && (
														<Form.Switch
															name={field.name}
															checked={Boolean(field.state.value)}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.checked)}
														/>
													)}
												</Form.Group>
												<FieldInfo field={field} />
											</>
										)}
									</form.Field>
								))}
							</>
						)
					}}
				</form.Subscribe>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting, state.isPristine]}
					children={([canSubmit, isSubmitting, isPristine]) => (
						<div className="d-flex justify-content-between">
							<DeletePartButton
								rundownId={part.rundownId}
								segmentId={part.segmentId}
								partId={part.id}
								partName={part.name}
								disabled={!canSubmit}
							/>

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
					)}
				/>
			</Form>
		</div>
	)
}

function PartTypeOptions() {
	const partTypeManifests = useAppSelector((state) =>
		state.typeManifests.manifests?.filter((m) => m.entityType === 'part')
	)

	if (!partTypeManifests?.length) return null

	return partTypeManifests.map((m) => (
		<option key={m.id} value={m.id}>
			{m.name ?? m.id}
		</option>
	))
}

function DeletePartButton({
	rundownId,
	segmentId,
	partId,
	partName,
	disabled
}: {
	rundownId: string
	segmentId: string
	partId: string
	partName: string
	disabled: boolean
}) {
	const navigate = useNavigate({ from: '/rundown/$rundownId/segment/$segmentId/part/$partId' })
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	const [showDelete, setShowDelete] = useState(false)
	const handleDeleteClose = () => setShowDelete(false)

	const deletePart = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		setShowDelete(true)
	}
	const performDeletePart = () => {
		// Navigate user to the list of segments
		navigate({ to: '/rundown/$rundownId/segment/$segmentId', params: { rundownId, segmentId } })

		// perform operation
		dispatch(removePart({ id: partId })).catch((e) => {
			console.error(e)
			toasts.show({
				headerContent: 'Deleting part',
				bodyContent: 'Encountered an unexpected error'
			})
		})
	}

	return (
		<>
			<Button onClick={deletePart} disabled={disabled} variant="danger">
				Delete
			</Button>

			<Modal show={showDelete} onHide={handleDeleteClose}>
				<Modal.Header closeButton>
					<Modal.Title>Delete part</Modal.Title>
				</Modal.Header>
				<Modal.Body>Are you sure you want to delete "{partName}"?</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={handleDeleteClose}>
						Cancel
					</Button>
					<Button variant="danger" onClick={performDeletePart}>
						Delete
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
