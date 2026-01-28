import { Accordion, Button, ButtonGroup, Form } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { useAppDispatch } from '~/store/app'
import {
	addNewTypeManifest,
	importTypeManifest,
	removeTypeManifest,
	updateTypeManifest
} from '~/store/typeManifest'
import { ipcAPI } from '~/lib/IPC'
import { ManifestFieldType, TypeManifestEntity } from '~backend/background/interfaces'
import type { TypeManifest, PayloadManifest } from '~backend/background/interfaces'
import '../pieceTypesForm.scss'
import { useForm } from '@tanstack/react-form'
import { FieldInfo } from '~/components/form'
import { useToasts } from '~/components/toasts/useToasts'

export function TypeManifestsForm({
	typeManifests,
	entityType,
	title
}: {
	typeManifests: TypeManifest[]
	entityType: TypeManifestEntity
	title: string
}) {
	console.log(typeManifests)
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	// Add new type
	const addType = () => {
		dispatch(addNewTypeManifest(entityType)).catch((e) => {
			console.error(e)
			toasts.show({ headerContent: `Adding ${title}`, bodyContent: 'Unexpected error' })
		})
	}

	// Export types
	const exportTypes = () => {
		ipcAPI.saveToFile({ title: `Export ${title}`, document: typeManifests }).catch(console.error)
	}

	// Import types
	const importTypes = () => {
		ipcAPI.openFromFile({ title: `Import ${title}` }).then(async (imported) => {
			const verify = (arr: unknown): arr is TypeManifest[] =>
				Array.isArray(arr) &&
				arr.every((t) => 'id' in t && 'entityType' in t && 'name' in t && 'payload' in t)

			if (!verify(imported)) {
				toasts.show({ headerContent: `Import ${title}`, bodyContent: 'Invalid file' })
				return
			}

			await Promise.all(
				imported.map(async (t) => {
					const existing = typeManifests.find((m) => m.id === t.id)
					try {
						if (existing) {
							await dispatch(updateTypeManifest({ originalId: existing.id, piecesManifest: t }))
						} else {
							await dispatch(importTypeManifest({ piecesManifest: t }))
						}
					} catch (e) {
						console.error(e)
						toasts.show({
							headerContent: `Import ${title}`,
							bodyContent: 'Unexpected error'
						})
					}
				})
			)

			toasts.show({ headerContent: `Import ${title}`, bodyContent: 'Import complete' })
		})
	}

	return (
		<>
			<h2>
				{title}
				<ButtonGroup className="float-end">
					<Button size="sm" variant="secondary" onClick={importTypes}>
						Import
					</Button>
					<Button size="sm" variant="secondary" onClick={exportTypes}>
						Export
					</Button>
					<Button size="sm" onClick={addType}>
						+ Add type
					</Button>
				</ButtonGroup>
			</h2>

			<Accordion alwaysOpen className="settings-piece-types">
				{typeManifests.map((manifest) => (
					<Accordion.Item eventKey={manifest.id} key={manifest.id}>
						<Accordion.Header>
							<div className="colour-preview me-2" style={{ backgroundColor: manifest.colour }} />
							{manifest.name}
						</Accordion.Header>
						<Accordion.Body>
							<SingleTypeManifestForm manifest={manifest} />
						</Accordion.Body>
					</Accordion.Item>
				))}
			</Accordion>
		</>
	)
}

// Generic single type manifest form
export function SingleTypeManifestForm({ manifest }: { manifest: TypeManifest }) {
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	const form = useForm({
		defaultValues: manifest,
		onSubmit: async (values) => {
			try {
				await dispatch(
					updateTypeManifest({ originalId: manifest.id, piecesManifest: values.value })
				).unwrap()
				form.reset()
			} catch (e) {
				console.error(e)
				toasts.show({ headerContent: 'Saving type', bodyContent: 'Unexpected error' })
			}
		}
	})

	const addField = () => {
		const newField: PayloadManifest = { id: '', label: '', type: ManifestFieldType.String }
		const current = form.getFieldValue('payload') ?? []
		form.setFieldValue('payload', [...current, newField])
	}

	const deleteType = () => {
		dispatch(removeTypeManifest({ id: manifest.id })).catch((e) => {
			console.error(e)
			toasts.show({ headerContent: 'Deleting type', bodyContent: 'Unexpected error' })
		})
	}

	return (
		<div>
			<Form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					form.handleSubmit()
				}}
			>
				<form.Field
					name="id"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Id:</Form.Label>
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
					name="shortName"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Short Name:</Form.Label>
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
					name="colour"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Colour:</Form.Label>
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
					name="includeTypeInName"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Include in name:</Form.Label>
								<Form.Switch
									name={field.name}
									checked={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.checked)}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>

				<h3>
					Metadata Fields
					<Button size="sm" onClick={addField} className="float-end">
						+ Add field
					</Button>
				</h3>
				<table className="table table-striped">
					<thead>
						<tr>
							<th>Id</th>
							<th>Label</th>
							<th>Type</th>
							<th>Include in name</th>
							<th>&nbsp;</th>
						</tr>
					</thead>
					<tbody>
						<form.Subscribe selector={(state) => state.values.payload}>
							{(payload) =>
								!payload || payload.length === 0 ? (
									<tr>
										<td colSpan={5} className="text-center">
											No fields defined
										</td>
									</tr>
								) : (
									payload.map((_, index) => (
										<tr key={`payload-${index}`}>
											<td>
												<form.Field
													name={`payload[${index}].id`}
													children={(field) => (
														<>
															<Form.Control
																name={field.name}
																type="text"
																value={field.state.value ?? ''}
																onBlur={field.handleBlur}
																onChange={(e) => field.handleChange(e.target.value)}
															/>
															<FieldInfo field={field} />
														</>
													)}
												/>
											</td>
											<td>
												<form.Field
													name={`payload[${index}].label`}
													children={(field) => (
														<>
															<Form.Control
																name={field.name}
																type="text"
																value={field.state.value ?? ''}
																onBlur={field.handleBlur}
																onChange={(e) => field.handleChange(e.target.value)}
															/>
															<FieldInfo field={field} />
														</>
													)}
												/>
											</td>
											<td>
												<form.Field
													name={`payload[${index}].type`}
													children={(field) => (
														<>
															<Form.Select
																name={field.name}
																value={field.state.value ?? ''}
																onBlur={field.handleBlur}
																onChange={(e) =>
																	field.handleChange(e.target.value as ManifestFieldType)
																}
															>
																<option value={ManifestFieldType.String}>String</option>
																<option value={ManifestFieldType.Number}>Number</option>
																<option value={ManifestFieldType.Boolean}>Boolean</option>
															</Form.Select>
															<FieldInfo field={field} />
														</>
													)}
												/>
											</td>
											<td>
												<form.Field
													name={`payload[${index}].includeInName`}
													children={(field) => (
														<>
															<Form.Switch
																name={field.name}
																checked={field.state.value ?? false}
																onBlur={field.handleBlur}
																onChange={(e) => field.handleChange(e.target.checked)}
															/>
															<FieldInfo field={field} />
														</>
													)}
												/>
											</td>
											<td>
												<Button
													size="sm"
													variant="danger"
													onClick={() => {
														const newFields = [...form.getFieldValue('payload')]
														newFields.splice(index, 1)
														form.setFieldValue('payload', newFields)
													}}
												>
													<FontAwesomeIcon icon={faTrash} />
												</Button>
											</td>
										</tr>
									))
								)
							}
						</form.Subscribe>
					</tbody>
				</table>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting, state.isPristine]}
					children={([canSubmit, isSubmitting, isPristine]) => (
						<div className="d-flex justify-content-between">
							<Button onClick={deleteType} variant="danger">
								Delete
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
					)}
				/>
			</Form>
		</div>
	)
}
