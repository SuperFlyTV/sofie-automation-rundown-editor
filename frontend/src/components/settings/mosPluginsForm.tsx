import { useForm } from '@tanstack/react-form'
import { Button, ButtonGroup, Form } from 'react-bootstrap'
import type { ApplicationSettings, MosPluginConfig } from '~backend/background/interfaces'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { updateSettings } from '~/store/settings'
import { useToasts } from '../toasts/useToasts'

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

export function MosPluginsForm({ settings }: { settings: ApplicationSettings }) {
	const dispatch = useAppDispatch()
	const toasts = useToasts()
	const pieceTypes = useAppSelector((state) =>
		state.typeManifests.manifests?.filter((m) => m.entityType === 'piece')
	)

	const form = useForm({
		defaultValues: { mosPlugins: settings.mosPlugins ?? ([] as MosPluginConfig[]) },
		onSubmit: async (values) => {
			try {
				await dispatch(updateSettings({ settings: { mosPlugins: values.value.mosPlugins } })).unwrap()
				form.reset()
			} catch (e) {
				console.error(e)
				toasts.show({
					headerContent: 'Saving MOS plugins',
					bodyContent: 'Encountered an unexpected error'
				})
			}
		}
	})

	return (
		<div className="mt-4">
			<h3>MOS Plugins</h3>
			<Form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					form.handleSubmit()
				}}
			>
				<form.Field
					name="mosPlugins"
					mode="array"
					children={(field) => (
						<>
							{field.state.value.map((_, i) => (
								<div key={field.state.value[i].id} className="d-flex gap-2 mb-2">
									<form.Field
										name={`mosPlugins[${i}].name`}
										children={(f) => (
											<Form.Control
												type="text"
												placeholder="Name"
												value={f.state.value}
												onBlur={f.handleBlur}
												onChange={(e) => f.handleChange(e.target.value)}
											/>
										)}
									/>
									<form.Field
										name={`mosPlugins[${i}].url`}
										children={(f) => (
											<Form.Control
												type="text"
												placeholder="https://plugin.example.com/"
												value={f.state.value}
												onBlur={f.handleBlur}
												onChange={(e) => f.handleChange(e.target.value)}
											/>
										)}
									/>
									<form.Field
										name={`mosPlugins[${i}].pieceType`}
										children={(f) => (
											<Form.Select
												value={f.state.value}
												onBlur={f.handleBlur}
												onChange={(e) => f.handleChange(e.target.value)}
											>
												<option value="">Piece type...</option>
												{pieceTypes?.map((m) => (
													<option key={m.id} value={m.id}>
														{m.name}
													</option>
												))}
											</Form.Select>
										)}
									/>
									<Button variant="danger" onClick={() => field.removeValue(i)}>
										Remove
									</Button>
								</div>
							))}
							<Button
								variant="secondary"
								className="mb-3"
								onClick={() =>
									field.pushValue({ id: newId(), name: '', url: '', pieceType: '' })
								}
							>
								Add plugin
							</Button>
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
