import { useForm } from '@tanstack/react-form'
import { Button, ButtonGroup, Form } from 'react-bootstrap'
import type { ApplicationSettings } from '~backend/background/interfaces'
import { FieldInfo } from '../form'
import { useAppDispatch } from '~/store/app'
import { updateSettings } from '~/store/settings'

export function CoreConnectionSettingsForm({ settings }: { settings: ApplicationSettings }) {
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
					name="coreUrl"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Address:</Form.Label>
								<Form.Control
									name={field.name}
									type="text"
									value={field.state.value}
									onBlur={field.handleBlur}
									placeholder="127.0.0.1"
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>
				<form.Field
					name="corePort"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Float:</Form.Label>
								<Form.Control
									name={field.name}
									type="number"
									value={field.state.value}
									onBlur={field.handleBlur}
									placeholder="3000"
									onChange={(e) => field.handleChange(Number(e.target.value))}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>

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
