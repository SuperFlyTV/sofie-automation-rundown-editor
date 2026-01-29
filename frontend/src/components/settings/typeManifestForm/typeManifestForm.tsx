import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useForm } from '@tanstack/react-form'
import { Form, Button, ButtonGroup } from 'react-bootstrap'
import { FieldInfo } from '~/components/form'
import { useToasts } from '~/components/toasts/useToasts'
import { useAppDispatch } from '~/store/app'
import { updateTypeManifest, removeTypeManifest } from '~/store/typeManifest'
import type { TypeManifest, PayloadManifest } from '~backend/background/interfaces'
import { ManifestFieldType } from '~backend/background/interfaces'

// Generic type manifest form
export function TypeManifestForm({
	manifest,
	showTypefields
}: {
	manifest: TypeManifest
	showTypefields?: boolean
}) {
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	const form = useForm({
		defaultValues: manifest,
		onSubmit: async (values) => {
			try {
				await dispatch(
					updateTypeManifest({ originalId: manifest.id, typeManifest: values.value })
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
				{showTypefields !== undefined || showTypefields ? null : (
					<>
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
					</>
				)}

				<h3>
					{showTypefields !== undefined || showTypefields ? null : <>Metadata Fields</>}
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
