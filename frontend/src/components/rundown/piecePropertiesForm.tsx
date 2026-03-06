import { useForm } from '@tanstack/react-form'
import { Button, ButtonGroup, Form, Modal } from 'react-bootstrap'
import type { Piece } from '~backend/background/interfaces'
import { FieldInfo } from '../form'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as OGrafForm from 'ograf-form'
import { useNavigate } from '@tanstack/react-router'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { removePiece, updatePiece } from '~/store/pieces'
import { useToasts } from '../toasts/useToasts'

export function PiecePropertiesForm({ piece }: { piece: Piece }) {
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	const manifest = useAppSelector((state) =>
		state.typeManifests.manifests?.find((p) => p.id === piece.pieceType)
	)

	const form = useForm({
		defaultValues: piece,
		onSubmit: async (values) => {
			try {
				await dispatch(updatePiece({ piece: values.value })).unwrap()

				// Mark as pristine
				form.reset()
			} catch (e) {
				console.error(e)
				toasts.show({
					headerContent: 'Saving piece',
					bodyContent: 'Encountered an unexpected error'
				})
			}
		}
	})

	return (
		<div>
			<h2>Piece</h2>

			<Form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					form.handleSubmit()
				}}
			>
				<Form.Group className="mb-3">
					<Form.Text>
						Piece type: {piece.pieceType} {!piece.start && piece.start !== 0 ? '(AdLib)' : ''}
					</Form.Text>
				</Form.Group>

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
					name="start"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Start (seconds):</Form.Label>
								<Form.Control
									name={field.name}
									type="number"
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const val = e.target.value
										field.handleChange(val === '' ? undefined : Number(val))
									}}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>
				<form.Field
					name="duration"
					children={(field) => (
						<>
							<Form.Group className="mb-3">
								<Form.Label htmlFor={field.name}>Duration (seconds):</Form.Label>
								<Form.Control
									name={field.name}
									type="number"
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const val = e.target.value
										field.handleChange(val === '' ? undefined : Number(val))
									}}
								/>
							</Form.Group>
							<FieldInfo field={field} />
						</>
					)}
				/>

				{manifest?.payload?.map((fieldInfo) => {
					return (
						<form.Field
							key={`payload.${fieldInfo.id}`}
							name={`payload.${fieldInfo.id}`}
							children={(field) => (
								<>
									<Form.Group className="mb-3">
										<Form.Label htmlFor={field.name}>{fieldInfo.label}:&nbsp;</Form.Label>

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
										{fieldInfo.type === 'ograf-form' && (
											<ReactOGrafForm
												schema={fieldInfo.ografManifest?.schema as OGrafForm.GDDSchema}
												data={field.state.value}
												onDataChangeCallback={(value: any) => {
													field.handleChange(value)
												}}
											/>
										)}

										{fieldInfo.type === 'enum' && (
											<>
												<Form.Select
													name={field.name}
													value={String(field.state.value)}
													onBlur={field.handleBlur}
													onChange={(e) => {
														console.log(e.target.value)
														field.handleChange(e.target.value)
													}}
												>
													{fieldInfo.enumValues?.map((ev, i) => (
														<option key={i} value={ev.value}>
															{ev.label}
														</option>
													))}
												</Form.Select>
											</>
										)}
										{fieldInfo.type === 'const' && <span>{field.state.value}</span>}
									</Form.Group>
									<FieldInfo field={field} />
								</>
							)}
						/>
					)
				})}

				{!manifest && (
					<Form.Group className="mb-3">
						<Form.Text>Piece type not found</Form.Text>
					</Form.Group>
				)}

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting, state.isPristine]}
					children={([canSubmit, isSubmitting, isPristine]) => (
						<div className="d-flex justify-content-between">
							<DeletePieceButton
								rundownId={piece.rundownId}
								segmentId={piece.segmentId}
								partId={piece.partId}
								pieceId={piece.id}
								pieceName={piece.name}
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

function DeletePieceButton({
	rundownId,
	segmentId,
	partId,
	pieceId,
	pieceName,
	disabled
}: {
	rundownId: string
	segmentId: string
	partId: string
	pieceId: string
	pieceName: string
	disabled: boolean
}) {
	const navigate = useNavigate({
		from: '/rundown/$rundownId/segment/$segmentId/part/$partId/piece/$pieceId'
	})
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	const [showDelete, setShowDelete] = useState(false)
	const handleDeleteClose = () => setShowDelete(false)

	const deleteSegment = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		setShowDelete(true)
	}
	const performDeleteSegment = () => {
		// Navigate user to the list of parts
		navigate({
			to: '/rundown/$rundownId/segment/$segmentId/part/$partId',
			params: { rundownId, segmentId, partId }
		})

		// perform operation
		dispatch(removePiece({ id: pieceId })).catch((e) => {
			console.error(e)
			toasts.show({
				headerContent: 'Deleting piece',
				bodyContent: 'Encountered an unexpected error'
			})
		})
	}

	return (
		<>
			<Button onClick={deleteSegment} disabled={disabled} variant="danger">
				Delete
			</Button>

			<Modal show={showDelete} onHide={handleDeleteClose}>
				<Modal.Header closeButton>
					<Modal.Title>Delete piece</Modal.Title>
				</Modal.Header>
				<Modal.Body>Are you sure you want to delete "{pieceName}"?</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={handleDeleteClose}>
						Cancel
					</Button>
					<Button variant="danger" onClick={performDeleteSegment}>
						Delete
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

declare global {
	namespace React {
		namespace JSX {
			interface IntrinsicElements {
				'superflytv-ograf-form': React.DetailedHTMLProps<
					React.HTMLAttributes<HTMLElement> & {
						schema: string // OGraf.GraphicsManifest['schema']
						value: any
					},
					HTMLElement
				>
			}
		}
	}
}

function ReactOGrafForm(props: {
	data: any
	schema: OGrafForm.GDDSchema
	onDataChangeCallback: (value: any) => void
}) {
	const containerRef = useRef<HTMLDivElement>(null)
	const ografFormRef = useRef<OGrafForm.SuperFlyTvOgrafDataForm>(null)

	useLayoutEffect(() => {
		if (ografFormRef.current) return // Already initialized
		if (!containerRef.current) {
			// Should really not happen
			console.error('Div ref not set for OGraf form')
			return
		}

		// Initialize the form OGraf form element:
		ografFormRef.current = new OGrafForm.SuperFlyTvOgrafDataForm()
		ografFormRef.current.addEventListener('change', () => {
			if (ografFormRef.current) props.onDataChangeCallback(ografFormRef.current.value)
		})
		if (props.schema) ografFormRef.current.schema = props.schema as any
		ografFormRef.current.value = props.data ?? {}

		containerRef.current.appendChild(ografFormRef.current)
	}, [])

	useEffect(() => {
		if (ografFormRef.current && props.schema) ografFormRef.current.schema = props.schema as any
	}, [props.schema])
	useEffect(() => {
		if (ografFormRef.current) ografFormRef.current.value = props.data
	}, [props.data])

	return <div ref={containerRef} />
}
