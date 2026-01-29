import { useForm } from '@tanstack/react-form'
import { Button, ButtonGroup, Form } from 'react-bootstrap'
import type { Segment } from '~backend/background/interfaces'
import { FieldInfo } from '../form'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { updateSegment } from '~/store/segments'
import { useToasts } from '../toasts/useToasts'
import { DeleteSegmentButton } from './deleteSegmentButton'

export function SegmentPropertiesForm({
	segment,
	rundownIsTemplate
}: {
	segment: Segment
	rundownIsTemplate: boolean
}) {
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	const manifest = useAppSelector((state) =>
		state.typeManifests.manifests?.find((p) => p.id === segment.segmentType)
	)

	const form = useForm({
		defaultValues: segment,
		onSubmit: async (values) => {
			console.log('submit', values)

			try {
				await dispatch(updateSegment({ segment: values.value })).unwrap()

				// Mark as pristine
				form.reset()
			} catch (e) {
				console.error(e)
				toasts.show({
					headerContent: 'Saving segment',
					bodyContent: 'Encountered an unexpected error'
				})
			}
		}
	})

	return (
		<div>
			<h2>Segment</h2>

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
				{rundownIsTemplate && (
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
				)}

				<form.Field
					name="segmentType"
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
									<SegmentTypeOptions />
								</Form.Select>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>

				{manifest?.payload?.map((fieldInfo) => {
					console.log(fieldInfo)
					return (
						<form.Field
							key={`payload.${fieldInfo.id}`}
							name={`payload.${fieldInfo.id}`}
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

				{!manifest && (
					<Form.Group className="mb-3">
						<Form.Text>Type not found</Form.Text>
					</Form.Group>
				)}
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting, state.isPristine]}
					children={([canSubmit, isSubmitting, isPristine]) => (
						<div className="d-flex justify-content-between">
							<DeleteSegmentButton
								rundownId={segment.rundownId}
								segmentId={segment.id}
								segmentName={segment.name}
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

function SegmentTypeOptions() {
	const partTypeManifests = useAppSelector((state) =>
		state.typeManifests.manifests?.filter((m) => m.entityType === 'segment')
	)

	if (!partTypeManifests?.length) return null

	return partTypeManifests.map((m) => (
		<option key={m.id} value={m.id}>
			{m.name ?? m.id}
		</option>
	))
}
