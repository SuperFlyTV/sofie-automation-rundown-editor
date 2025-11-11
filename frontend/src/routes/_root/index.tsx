import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { Badge, Button, ListGroup, Stack } from 'react-bootstrap'
import { CopyIconButton } from '~/components/copyIconButton'
import { EditIconButton } from '~/components/editIconButton'
import { useToasts } from '~/components/toasts/toasts'
import { ipcAPI } from '~/lib/IPC'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { addNewRundown, copyRundown, importRundown } from '~/store/rundowns'
import { verifyImportIsRundown } from '~/util/verifyImport'
import type { Rundown } from '~backend/background/interfaces'

export const Route = createFileRoute('/_root/')({
	component: Index
})

function Index() {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const rundowns = useAppSelector((state) => state.rundowns)
	const toasts = useToasts()

	const createNewRundown = useCallback(() => {
		dispatch(addNewRundown({ playlistId: null })).unwrap()
	}, [dispatch])

	const selectImportRundown = () => {
		ipcAPI
			.openFromFile({ title: 'Import rundown' })
			.then(async (serializedRundown) => {
				console.log('opening rundown', serializedRundown)

				if (verifyImportIsRundown(serializedRundown)) {
					const existing = rundowns.find((rd) => rd.id === serializedRundown.rundown.id)
					if (existing) {
						toasts.show({
							headerContent: 'Importing rundown',
							bodyContent: 'Rundown already exists'
						})
					} else {
						try {
							await dispatch(importRundown(serializedRundown))

							await navigate({
								to: `/rundown/${serializedRundown.rundown.id}`
							})
						} catch (e: unknown) {
							console.error(e)
							toasts.show({
								headerContent: 'Importing rundown',
								bodyContent: 'Encountered an unexepcted error'
							})
						}
					}
				} else {
					toasts.show({
						headerContent: 'Importing rundown',
						bodyContent: 'Imported file is not a valid rundown'
					})
				}
			})
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: 'Importing rundown',
					bodyContent: 'Encountered an unexepcted error'
				})
			})
	}
	const templateRundowns = rundowns.filter((r) => r.isTemplate)
	const normalRundowns = rundowns.filter((r) => !r.isTemplate)
	return (
		<div className="p-2">
			<div className="d-flex justify-content-between align-items-center">
				<h2>Home</h2>
				<div className="d-flex">
					<Button className="m-2" onClick={createNewRundown}>
						New
					</Button>
					<Button className="m-2" onClick={selectImportRundown}>
						Import
					</Button>
				</div>
			</div>

			<RundownList title="" rundowns={templateRundowns} />
			<RundownList title="Rundowns" rundowns={normalRundowns} hideIfEmpty={false} />
		</div>
	)
}

function RundownListItem({ rundown }: { rundown: Rundown }) {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const toasts = useToasts()

	const handleCopyRundown = (sourceRundown: Rundown, fromTemplate: boolean = false) => {
		// perform operation
		dispatch(
			copyRundown({
				id: sourceRundown.id,
				fromTemplate
			})
		)
			.unwrap()
			.then(async (newRundownResult) => {
				// Navigate user to the new rundown
				await navigate({
					to: `/rundown/${newRundownResult.id}`
				})
			})
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: 'Adding rundown',
					bodyContent: 'Encountered an unexpected error'
				})
			})
	}
	const handleClick = () => {
		if (rundown.isTemplate) {
			// Clicking template creates a new rundown based on it
			handleCopyRundown(rundown)
		} else {
			// Navigate to the rundown page
			navigate({ to: `/rundown/${rundown.id}` })
		}
	}

	return (
		<ListGroup.Item action onClick={handleClick} className="copy-item">
			<Stack direction="horizontal">
				{rundown.isTemplate ? (
					<Badge pill bg="danger" className="me-2">
						Template
					</Badge>
				) : null}
				{rundown.name}
				{rundown.isTemplate ? (
					<EditIconButton
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							navigate({ to: `/rundown/${rundown.id}` })
						}}
						className="ms-auto copy-icon-button"
						style={{ position: 'relative', top: '-.25em' }}
					/>
				) : (
					<CopyIconButton
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							handleCopyRundown(rundown)
						}}
						className="ms-auto copy-icon-button"
						style={{ position: 'relative', top: '-.25em' }}
					/>
				)}
			</Stack>
		</ListGroup.Item>
	)
}

interface RundownListProps {
	title: string
	rundowns: Rundown[]
	hideIfEmpty?: boolean
}

function RundownList({ title, rundowns, hideIfEmpty = true }: RundownListProps) {
	if (hideIfEmpty && rundowns.length === 0) return null

	return (
		<div className="mb-4">
			<h4 className="mt-3 mb-2">{title}</h4>
			<ListGroup>
				{rundowns.length > 0 ? (
					rundowns.map((rd) => <RundownListItem key={rd.id} rundown={rd} />)
				) : (
					<ListGroup.Item
						className="text-muted fst-italic"
						style={{ textAlign: 'center', opacity: '50%' }}
					>
						No rundowns found, create or import one!
					</ListGroup.Item>
				)}
			</ListGroup>
		</div>
	)
}
