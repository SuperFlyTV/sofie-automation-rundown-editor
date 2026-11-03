import { useForm } from '@tanstack/react-form'
import { Button, ButtonGroup, Form } from 'react-bootstrap'
import type { ApplicationSettings, MosPluginConfig } from '~backend/background/interfaces'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { updateSettings } from '~/store/settings'
import { FieldInfo } from '../form'
import { parseUrl } from '~/lib/parseUrl'
import { useToasts } from '../toasts/useToasts'

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
				await dispatch(
					updateSettings({ settings: { mosPlugins: values.value.mosPlugins } })
				).unwrap()
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
							{field.state.value.map((plugin, i) => (
								<div key={plugin.id} className="d-flex flex-wrap gap-2 mb-2 align-items-start">
									<form.Field
										name={`mosPlugins[${i}].name`}
										validators={{
											onChange: ({ value }) => (value.trim() ? undefined : 'Name is required')
										}}
										children={(f) => (
											<div className="flex-grow-1">
												<Form.Control
													type="text"
													placeholder="Name"
													aria-label={`Plugin ${i + 1} name`}
													isInvalid={f.state.meta.isTouched && !f.state.meta.isValid}
													value={f.state.value}
													onBlur={f.handleBlur}
													onChange={(e) => f.handleChange(e.target.value)}
												/>
												<FieldInfo field={f} />
											</div>
										)}
									/>
									<form.Field
										name={`mosPlugins[${i}].url`}
										validators={{
											onChange: ({ value }) =>
												parseUrl(value) ? undefined : 'Enter a valid http(s) URL'
										}}
										children={(f) => (
											<div className="flex-grow-1">
												<Form.Control
													type="text"
													placeholder="https://plugin.example.com/"
													aria-label={`Plugin ${i + 1} URL`}
													isInvalid={f.state.meta.isTouched && !f.state.meta.isValid}
													value={f.state.value}
													onBlur={f.handleBlur}
													onChange={(e) => f.handleChange(e.target.value)}
												/>
												<FieldInfo field={f} />
											</div>
										)}
									/>
									<form.Field
										name={`mosPlugins[${i}].pieceType`}
										validators={{
											onChange: ({ value }) => (value ? undefined : 'Piece type is required')
										}}
										children={(f) => (
											<div className="flex-grow-1">
												<Form.Select
													aria-label={`Plugin ${i + 1} piece type`}
													isInvalid={f.state.meta.isTouched && !f.state.meta.isValid}
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
												<FieldInfo field={f} />
												{/* The type may have been deleted since this plugin was saved. */}
												{pieceTypes &&
													f.state.value &&
													!pieceTypes.some((m) => m.id === f.state.value) && (
														<em className="text-warning">This piece type no longer exists</em>
													)}
											</div>
										)}
									/>
									<Button
										variant="danger"
										aria-label={`Remove ${plugin.name || 'plugin'}`}
										onClick={() => field.removeValue(i)}
									>
										Remove
									</Button>
								</div>
							))}
							<Button
								variant="secondary"
								className="mb-3"
								onClick={() =>
									field.pushValue({ id: crypto.randomUUID(), name: '', url: '', pieceType: '' })
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
									{isSubmitting ? 'Saving...' : 'Save'}
								</Button>
							</ButtonGroup>
						</div>
					)}
				/>
			</Form>
		</div>
	)
}
