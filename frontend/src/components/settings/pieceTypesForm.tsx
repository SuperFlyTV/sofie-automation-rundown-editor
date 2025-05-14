import { useForm } from '@tanstack/react-form'
import { Accordion, Button, ButtonGroup, Form } from 'react-bootstrap'
import {
	ManifestFieldType,
	type PiecePayloadManifest,
	type PiecesManifest,
	type PieceTypeManifest
} from '~backend/background/interfaces'
import { FieldInfo } from '../form'
import { useAppDispatch } from '~/store/app'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import './pieceTypesForm.scss'
import {
	addNewPiecesManifest,
	importPiecesManifest,
	removePiecesManifest,
	updatePiecesManifest
} from '~/store/piecesManifest'
import { useToasts } from '../toasts/toasts'

export function PieceTypesForm({ piecesManifest }: { piecesManifest: PiecesManifest }) {
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	const addPieceType = () => {
		dispatch(addNewPiecesManifest()).catch((e) => {
			console.error(e)
			toasts.show({
				headerContent: 'Adding piece type',
				bodyContent: 'Encountered an unexpected error'
			})
		})
	}

	const exportPieceTypes = () => {
		electronApi
			.saveToFile({
				title: 'Export piece types',
				document: piecesManifest
			})
			.catch((error) => {
				console.error('Error exporting piece types:', error)
			})
	}
	const importPieceTypes = () => {
		electronApi
			.openFromFile({ title: 'Import piece types' })
			.then(async (serializedPieceTypes) => {
				console.log('importing piece types', serializedPieceTypes)

				const verify = (pieceTypes: unknown): pieceTypes is PiecesManifest =>
					Array.isArray(pieceTypes) &&
					!!pieceTypes
						.map((t) => 'id' in t && 'name' in t && 'payload' in t)
						.filter((p) => p === false)

				if (verify(serializedPieceTypes)) {
					Promise.all(
						serializedPieceTypes.map(async (p) => {
							const existing = piecesManifest.find((type) => type.id === p.id)

							try {
								if (existing) {
									await dispatch(
										updatePiecesManifest({ originalId: existing.id, piecesManifest: p })
									)
								} else {
									await dispatch(importPiecesManifest({ piecesManifest: p }))
								}
							} catch (e) {
								console.error(e)
								toasts.show({
									headerContent: 'Importing piece types',
									bodyContent: 'Encountered an unexpected error'
								})
							}
						})
					).then(() => {
						toasts.show({
							headerContent: 'Importing piece types',
							bodyContent: 'Successfully imported piece types'
						})
					})
				} else {
					toasts.show({
						headerContent: 'Importing piece types',
						bodyContent: 'Imported file is not valid piece types'
					})
				}
			})
			.catch((e) => {
				// eslint-disable-next-line no-console
				console.error(e)
				toasts.show({
					headerContent: 'Importing piece types',
					bodyContent: 'Encountered an unexpected error'
				})
			})
	}

	return (
		<>
			<h2>
				Piece Types
				<ButtonGroup className="float-end">
					<Button size="sm" variant="secondary" onClick={importPieceTypes}>
						Import
					</Button>
					<Button size="sm" variant="secondary" onClick={exportPieceTypes}>
						Export
					</Button>
					<Button size="sm" onClick={addPieceType}>
						+ Add type
					</Button>
				</ButtonGroup>
			</h2>

			<Accordion alwaysOpen className="settings-piece-types">
				{piecesManifest.map((pieceType) => (
					<Accordion.Item eventKey={pieceType.id} key={pieceType.id}>
						<Accordion.Header>
							<div
								className="colour-preview me-2"
								style={{ backgroundColor: pieceType.colour }}
							></div>
							{pieceType.name}
						</Accordion.Header>
						<Accordion.Body>
							<SinglePieceTypeForm manifest={pieceType} />
						</Accordion.Body>
					</Accordion.Item>
				))}
			</Accordion>
		</>
	)
}

export function SinglePieceTypeForm({ manifest }: { manifest: PieceTypeManifest }) {
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	const form = useForm({
		defaultValues: manifest,
		onSubmit: async (values) => {
			console.log('submit', values)

			try {
				// TODO - this can have issues if the id is changed to be a duplicate of another
				await dispatch(
					updatePiecesManifest({ originalId: manifest.id, piecesManifest: values.value })
				).unwrap()

				// Mark as pristine
				form.reset()
			} catch (e) {
				console.error(e)
				toasts.show({
					headerContent: 'Saving piece type',
					bodyContent: 'Encountered an unexpected error'
				})
			}
		}
	})

	const addMetadataField = () => {
		const newField: PiecePayloadManifest = {
			id: '',
			label: '',
			type: ManifestFieldType.String
		}
		form.setFieldValue('payload', [...(form.getFieldValue('payload') || []), newField])
	}

	const deletePieceType = () => {
		dispatch(removePiecesManifest({ id: manifest.id })).catch((e) => {
			console.error(e)
			toasts.show({
				headerContent: 'Deleting piece type',
				bodyContent: 'Encountered an unexpected error'
			})
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
					Metadata Fields:
					<Button size="sm" onClick={addMetadataField} className="float-end">
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
							{(payload) => {
								if (!payload || payload.length === 0) {
									return (
										<tr>
											<td colSpan={5} className="text-center">
												No fields are defined
											</td>
										</tr>
									)
								}

								return payload.map((_, index) => (
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
							}}
						</form.Subscribe>
					</tbody>
				</table>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting, state.isPristine]}
					children={([canSubmit, isSubmitting, isPristine]) => (
						<div className="d-flex justify-content-between">
							<Button onClick={deletePieceType} variant="danger">
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
