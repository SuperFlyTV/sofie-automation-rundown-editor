import { useForm } from '@tanstack/react-form'
import { Button, ButtonGroup, Form } from 'react-bootstrap'
import type { Rundown, SerializedRundown } from '~backend/background/interfaces'
import { CustomDateTimePicker, FieldInfo } from '../form'
import { updateRundown } from '~/store/rundowns'
import { useAppDispatch, useAppSelector, useAppStore } from '~/store/app'
import { ipcAPI } from '~/lib/IPC'
import { DeleteRundownButton } from './deleteRundownButton'
import { useToasts } from '../toasts/useToasts'

export function RundownPropertiesForm({ rundown }: { rundown: Rundown }) {
	const dispatch = useAppDispatch()
	const store = useAppStore()
	const toasts = useToasts()

	const metadataFields = useAppSelector((state) => state.settings.settings?.rundownMetadata)

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

		ipcAPI
			.saveToFile({
				title: 'Export rundown',
				document: serializedRundown
			})
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: 'Exporting rundown',
					bodyContent: 'Encountered an unexpected error'
				})
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
				<form.Subscribe selector={(state) => state.values.isTemplate}>
					{(isTemplate) => (
						<form.Field name="sync">
							{(syncField) => {
								// UI should show unchecked while isTemplate is true,
								// but the underlying value remains unchanged
								const displayChecked = isTemplate ? false : syncField.state.value

								return (
									<>
										<Form.Group className="mb-3">
											<Form.Label htmlFor={syncField.name}>Sync to Sofie:</Form.Label>
											<Form.Switch
												name={syncField.name}
												checked={displayChecked}
												onBlur={syncField.handleBlur}
												onChange={(e) => syncField.handleChange(e.target.checked)}
												disabled={isTemplate} // greyed out when template is on
											/>
										</Form.Group>
										<FieldInfo field={syncField} />
									</>
								)
							}}
						</form.Field>
					)}
				</form.Subscribe>
				<form.Field name="isTemplate">
					{(templateField) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={templateField.name}>Template:</Form.Label>
								<Form.Switch
									name={templateField.name}
									type="text"
									checked={templateField.state.value}
									onBlur={templateField.handleBlur}
									onChange={(e) => {
										const checked = e.target.checked
										templateField.handleChange(checked)
									}}
								/>
							</Form.Group>
							<FieldInfo field={templateField} />
						</>
					)}
				</form.Field>

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

				{metadataFields?.map((fieldInfo) => {
					return (
						<form.Field
							key={`metaData.${fieldInfo.id}`}
							name={`metaData.${fieldInfo.id}`}
							children={(field) => (
								<>
									<Form.Group className="mb-3">
										<Form.Label htmlFor={field.name}>{fieldInfo.label}:</Form.Label>

										{fieldInfo.type === 'string' && (
											<Form.Control
												name={field.name}
												type="text"
												// eslint-disable-next-line @typescript-eslint/no-explicit-any
												value={field.state.value as any}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										)}

										{fieldInfo.type === 'number' && (
											<Form.Control
												name={field.name}
												type="number"
												value={Number(field.state.value)}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(Number(e.target.value))}
											/>
										)}

										{fieldInfo.type === 'boolean' && (
											<Form.Switch
												name={field.name}
												type="text"
												checked={Boolean(field.state.value)}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.checked)}
											/>
										)}
									</Form.Group>
									<FieldInfo field={field} />
								</>
							)}
						/>
					)
				})}

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
