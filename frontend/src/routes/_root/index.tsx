import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { Button, Dropdown, SplitButton, Stack, Tab, Tabs } from 'react-bootstrap'
import { BsBoxArrowInUp, BsPlus } from 'react-icons/bs'
import { RundownList } from '~/components/rundownList/rundownList'
import { useToasts } from '~/components/toasts/useToasts'
import { ipcAPI } from '~/lib/IPC'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { addNewRundown, copyRundown, importRundown } from '~/store/rundowns'
import { verifyImportIsRundown } from '~/util/verifyImport'
import type { Rundown } from '~backend/background/interfaces'

export const Route = createFileRoute('/_root/')({
	component: Index
})

function Index() {
	const [activeTab, setActiveTab] = useState<string | null>('rundowns')
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const rundowns = useAppSelector((state) => state.rundowns)
	const toasts = useToasts()

	const createNewRundown = useCallback(
		(isTemplate: boolean) => {
			dispatch(addNewRundown({ playlistId: null, isTemplate })).unwrap()
		},
		[dispatch]
	)
	const handleCopyRundown = (sourceRundown: Rundown, preserveTemplate: boolean = false) => {
		dispatch(
			copyRundown({
				id: sourceRundown.id,
				preserveTemplate
			})
		)
			.unwrap()
			.then(async (newRundownResult) => {
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

	const selectImportRundown = (isTemplate: boolean) => {
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
							await dispatch(importRundown({ ...serializedRundown, isTemplate }))

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
			<Stack direction="horizontal" className="mb-2">
				<Tabs
					style={{
						flexGrow: 2
					}}
					defaultActiveKey="rundowns"
					activeKey={activeTab ?? 'rundowns'}
					onSelect={(k) => setActiveTab(k)}
				>
					<Tab eventKey="rundowns" title="Rundowns" />
					<Tab eventKey="templates" title="Templates" />
				</Tabs>
				<Stack
					direction="horizontal"
					className="align-items-end justify-content-end"
					style={{
						borderBottom: '1px solid #495057'
					}}
				>
					<div>
						<SplitButton
							className="m-1 split-button-divider"
							size="sm"
							title={
								<span className="d-inline-flex align-items-center">
									<BsPlus className="bttn-icon icon-lg" aria-hidden />
									<span className="ms-4 ml-3">New</span>
								</span>
							}
							onClick={() => createNewRundown(activeTab === 'templates')}
							variant="primary"
						>
							{templateRundowns.map((templateRundown) => (
								<Dropdown.Item
									onClick={() => handleCopyRundown(templateRundown, activeTab === 'templates')}
								>
									{templateRundown.name}
								</Dropdown.Item>
							))}
						</SplitButton>
						<Button
							className="m-1"
							onClick={() => selectImportRundown(activeTab === 'templates')}
							size="sm"
						>
							<BsBoxArrowInUp className="bttn-icon icon-md mt-1" aria-hidden />
							<span className="ms-4 ml-3">Import</span>
						</Button>
					</div>
				</Stack>
			</Stack>
			{activeTab === 'rundowns' && <RundownList title="Rundown" rundowns={normalRundowns} />}

			{activeTab === 'templates' && <RundownList rundowns={templateRundowns} title="Template" />}
		</div>
	)
}
