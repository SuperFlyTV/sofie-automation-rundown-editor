import { useForm } from '@tanstack/react-form'
import { Button, ButtonGroup, Form } from 'react-bootstrap'
import type { ApplicationSettings } from '~backend/background/interfaces'
import { FieldInfo } from '../form'
import { useAppDispatch } from '~/store/app'
import { reloadOGrafGraphics, updateSettings } from '~/store/settings'
import { useToasts } from '../toasts/useToasts'
import React from 'react'

export function ConnectionSettingsForm({ settings }: { settings: ApplicationSettings }) {
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	const [isOgrafLoading, setIsOgrafLoading] = React.useState(false)
	const reloadOGraf = () => {
		console.log('reloadOGraf')

		const ografUrl = settings.ografUrl ?? ''
		if (ografUrl.length === 0) throw new Error('No Ograf URL set!')

		setIsOgrafLoading(true)
		dispatch(reloadOGrafGraphics(ografUrl))
		.then(() => {
			setIsOgrafLoading(false)
		})
		.catch((e) => {
			console.error(e)
			toasts.show({ headerContent: `Error when loading Ograf graphics`, bodyContent: 'Unexpected error' })
		})
	}

	const form = useForm({
		defaultValues: settings,
		onSubmit: async (values) => {
			console.log('submit', values)

			try {
				await dispatch(updateSettings({ settings: values.value })).unwrap()

				// Mark as pristine
				form.reset()
			} catch (e) {
				console.error(e)
				toasts.show({
					headerContent: 'Saving settings',
					bodyContent: 'Encountered an unexpected error'
				})
			}
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
								<Form.Label htmlFor={field.name}>Sofie Core address:</Form.Label>
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
								<Form.Label htmlFor={field.name}>Sofie Core port:</Form.Label>
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
				<form.Field
					name="ografUrl"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Ograf Server url (optional):</Form.Label>
								<Form.Control
									name={field.name}
									type="string"
									value={field.state.value}
									onBlur={field.handleBlur}
									placeholder="http://my-ograf-server/api/ograf/v1/"
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting, state.isPristine]}
					children={([canSubmit, isSubmitting, isPristine]) => (
						<div>

							<div className="d-flex justify-content-start">
								<ButtonGroup>
									<Button
										type="reset"
										onClick={() => reloadOGraf()}
										variant="secondary"
										disabled={(settings.ografUrl ?? '').length === 0 || isOgrafLoading}
									>
										{isOgrafLoading ? 'Fetching...' : 'Load Ograf graphics'}

									</Button>
								</ButtonGroup>
							</div>
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
						</div>
					)}
				/>
			</Form>
		</div>
	)
}
