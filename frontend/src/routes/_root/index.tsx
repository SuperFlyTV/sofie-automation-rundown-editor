import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { Button, ListGroup, Stack } from 'react-bootstrap'
import { CopyIconButton } from '~/components/copyIconButton'
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

	const handleCopyRundown = (sourceRundown: Rundown) => {
		// perform operation
		dispatch(
			copyRundown({
				id: sourceRundown.id
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

			<ListGroup>
				{rundowns.map((rd) => (
					<ListGroup.Item
						key={rd.id}
						action
						as={Link}
						to={`/rundown/${rd.id}`}
						className="copy-item"
					>
						<Stack direction="horizontal">
							{rd.name}
							<CopyIconButton
								onClick={() => handleCopyRundown(rd)}
								className="ms-auto copy-icon-button"
								style={{ position: 'relative', top: '-.25em' }}
							/>
						</Stack>
					</ListGroup.Item>
				))}
			</ListGroup>
		</div>
	)
}
