import { useForm } from '@tanstack/react-form'
import { Button, ButtonGroup, Form } from 'react-bootstrap'
import { BsTrash } from 'react-icons/bs'
import type { ApplicationSettings, MosPluginConfig } from '~backend/background/interfaces'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { updateSettings } from '~/store/settings'
import { FieldInfo } from '../form'
import { IconButton } from '../iconButton'
import { parseUrl } from '~/lib/parseUrl'
import { useToasts } from '../toasts/useToasts'

type TextKey = 'name' | 'url'

/** Returns an error message, or undefined when valid. */
const validators: Record<keyof Omit<MosPluginConfig, 'id'>, (v: string) => string | undefined> = {
	name: (v) => (v.trim() ? undefined : 'Name is required'),
	url: (v) => (parseUrl(v) ? undefined : 'Enter a valid http(s) URL'),
	pieceType: (v) => (v ? undefined : 'Piece type is required')
}

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

	/** One validated input. Validates on mount too, so new blank rows block Save. */
	const textField = (i: number, key: TextKey, placeholder: string) => (
		<form.Field
			name={`mosPlugins[${i}].${key}`}
			validators={{
				onMount: ({ value }) => validators[key](value),
				onChange: ({ value }) => validators[key](value)
			}}
			children={(f) => (
				<div className="flex-grow-1">
					<Form.Control
						type="text"
						placeholder={placeholder}
						aria-label={`Plugin ${i + 1} ${key}`}
						isInvalid={f.state.meta.isTouched && !f.state.meta.isValid}
						value={f.state.value}
						onBlur={f.handleBlur}
						onChange={(e) => f.handleChange(e.target.value)}
					/>
					<FieldInfo field={f} />
				</div>
			)}
		/>
	)

	// Also fails when the saved type was deleted, which blocks Save until a new one is picked
	const validatePieceType = ({ value }: { value: string }) =>
		validators.pieceType(value) ??
		(pieceTypes && !pieceTypes.some((m) => m.id === value)
			? 'This piece type no longer exists'
			: undefined)

	const pieceTypeField = (i: number) => (
		<form.Field
			name={`mosPlugins[${i}].pieceType`}
			validators={{
				onMount: validatePieceType,
				onChange: validatePieceType
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
				</div>
			)}
		/>
	)

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
							{field.state.value.length === 0 ? (
								<p className="text-muted">No MOS plugins configured</p>
							) : (
								<div className="d-flex gap-2 mb-1 fw-bold">
									<div className="flex-grow-1">Name</div>
									<div className="flex-grow-1">URL</div>
									<div className="flex-grow-1">Piece type</div>
									<div style={{ width: '1.5em' }} />
								</div>
							)}
							{/* The row id must stay stable: pieces reference a plugin through mosPluginId. */}
							{field.state.value.map((plugin, i) => (
								<div key={plugin.id} className="d-flex gap-2 mb-2 align-items-start">
									{textField(i, 'name', 'Name')}
									{textField(i, 'url', 'https://plugin.example.com/')}
									{pieceTypeField(i)}
									<IconButton
										icon={<BsTrash />}
										aria-label={`Remove ${plugin.name || 'plugin'}`}
										onClick={() => field.removeValue(i)}
									/>
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

				<Form.Text as="p" className="text-muted">
					Each plugin page must allow being embedded in an iframe (set <code>frame-ancestors</code>{' '}
					to include this app) and receives an <code>?origin=</code> parameter. Removing a plugin
					keeps its existing pieces, which then show &quot;plugin no longer configured&quot;.
				</Form.Text>

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
