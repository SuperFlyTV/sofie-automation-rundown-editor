import { Accordion, Button, ButtonGroup } from 'react-bootstrap'
import { useAppDispatch } from '~/store/app'
import { addNewTypeManifest, importTypeManifest, updateTypeManifest } from '~/store/typeManifest'
import { ipcAPI } from '~/lib/IPC'
import { TypeManifestEntity } from '~backend/background/interfaces'
import type { TypeManifest } from '~backend/background/interfaces'
import './typesForm.scss'
import { useToasts } from '~/components/toasts/useToasts'
import { TypeManifestForm } from './typeManifestForm'

export function TypeManifestsForm({
	typeManifests,
	entityType,
	title
}: {
	typeManifests: TypeManifest[]
	entityType: TypeManifestEntity
	title: string
}) {
	const dispatch = useAppDispatch()
	const toasts = useToasts()

	// Add new type
	const addType = () => {
		dispatch(addNewTypeManifest(entityType)).catch((e) => {
			console.error(e)
			toasts.show({ headerContent: `Adding ${title}`, bodyContent: 'Unexpected error' })
		})
	}

	// Export types
	const exportTypes = () => {
		ipcAPI.saveToFile({ title: `Export ${title}`, document: typeManifests }).catch(console.error)
	}

	// Import types
	const importTypes = () => {
		ipcAPI.openFromFile({ title: `Import ${title}` }).then(async (imported) => {
			const verify = (arr: unknown): arr is TypeManifest[] =>
				Array.isArray(arr) &&
				arr.every((t) => 'id' in t && 'entityType' in t && 'name' in t && 'payload' in t)

			if (!verify(imported)) {
				toasts.show({ headerContent: `Import ${title}`, bodyContent: 'Invalid file' })
				return
			}

			await Promise.all(
				imported.map(async (t) => {
					const existing = typeManifests.find((m) => m.id === t.id)
					try {
						if (existing) {
							await dispatch(updateTypeManifest({ originalId: existing.id, typeManifest: t }))
						} else {
							await dispatch(importTypeManifest({ typeManifest: t }))
						}
					} catch (e) {
						console.error(e)
						toasts.show({
							headerContent: `Import ${title}`,
							bodyContent: 'Unexpected error'
						})
					}
				})
			)

			toasts.show({ headerContent: `Import ${title}`, bodyContent: 'Import complete' })
		})
	}

	return (
		<>
			<h2>
				{title}
				<ButtonGroup className="float-end">
					<Button size="sm" variant="secondary" onClick={importTypes}>
						Import
					</Button>
					<Button size="sm" variant="secondary" onClick={exportTypes}>
						Export
					</Button>
					<Button size="sm" onClick={addType}>
						+ Add type
					</Button>
				</ButtonGroup>
			</h2>

			<Accordion alwaysOpen className="settings-types">
				{typeManifests.length === 0
					? 'No types found, create or import types!'
					: typeManifests.map((manifest) => (
							<Accordion.Item eventKey={manifest.id} key={manifest.id}>
								<Accordion.Header>
									<div
										className="colour-preview me-2"
										style={{ backgroundColor: manifest.colour }}
									/>
									{manifest.name}
								</Accordion.Header>
								<Accordion.Body>
									<TypeManifestForm manifest={manifest} />
								</Accordion.Body>
							</Accordion.Item>
						))}
			</Accordion>
		</>
	)
}
