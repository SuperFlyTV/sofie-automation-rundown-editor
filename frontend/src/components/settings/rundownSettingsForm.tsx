import { useForm } from '@tanstack/react-form'
import { Button, ButtonGroup, Form } from 'react-bootstrap'
import {
	ManifestFieldType,
	type ApplicationSettings,
	type RundownMetadataEntryManifest
} from '~backend/background/interfaces'
import { FieldInfo } from '../form'
import { useAppDispatch } from '~/store/app'
import { updateSettings } from '~/store/settings'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'

export function RundownSettingsForm({ settings }: { settings: ApplicationSettings }) {
	const dispatch = useAppDispatch()

	const form = useForm({
		defaultValues: settings,
		onSubmit: async (values) => {
			console.log('submit', values)

			await dispatch(updateSettings({ settings: values.value })).unwrap()

			// Mark as pristine
			form.reset()
		}
	})

	const addRundownMetadataField = () => {
		const newField: RundownMetadataEntryManifest = {
			id: '',
			label: '',
			type: ManifestFieldType.String
		}
		form.setFieldValue('rundownMetadata', [...form.getFieldValue('rundownMetadata'), newField])
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
					name="partTypes"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Part types:</Form.Label>
								<Form.Control
									name={field.name}
									type="text"
									value={field.state.value?.join(', ') ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value.split(', '))}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>

				<h3>Rundown Metadata Fields:</h3>
				<table className="table table-striped">
					<thead>
						<tr>
							<th>Id</th>
							<th>Label</th>
							<th>Type</th>
							<th>&nbsp;</th>
						</tr>
					</thead>
					<tbody>
						<form.Subscribe selector={(state) => state.values.rundownMetadata}>
							{(rundownMetadata) => {
								if (rundownMetadata.length === 0) {
									return (
										<tr>
											<td colSpan={4} className="text-center">
												No fields are defined
											</td>
										</tr>
									)
								}

								return rundownMetadata.map((_, index) => (
									<tr key={`rundownMetadata-${index}`}>
										<td>
											<form.Field
												name={`rundownMetadata[${index}].id`}
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
												key={`rundownMetadata-${index}-label`}
												name={`rundownMetadata[${index}].label`}
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
												key={`rundownMetadata-${index}-type`}
												name={`rundownMetadata[${index}].type`}
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
											<Button
												size="sm"
												variant="danger"
												onClick={() => {
													const newFields = [...form.getFieldValue('rundownMetadata')]
													newFields.splice(index, 1)
													form.setFieldValue('rundownMetadata', newFields)
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

				<Button size="sm" onClick={addRundownMetadataField}>
					+ Add field
				</Button>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting, state.isPristine]}
					children={([canSubmit, isSubmitting, isPristine]) => (
						<div className="d-flex justify-content-end">
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
