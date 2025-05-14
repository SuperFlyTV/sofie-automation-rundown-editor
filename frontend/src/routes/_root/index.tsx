import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { Button, ListGroup } from 'react-bootstrap'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { addNewRundown, importRundown } from '~/store/rundowns'
import { verifyImportIsRundown } from '~/util/verifyImport'

export const Route = createFileRoute('/_root/')({
	component: Index
})

function Index() {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const rundowns = useAppSelector((state) => state.rundowns)

	const createNewRundown = useCallback(() => {
		dispatch(addNewRundown({ playlistId: null })).unwrap()
	}, [dispatch])

	const selectImportRundown = useCallback(() => {
		electronApi
			.openFromFile({ title: 'Import rundown' })
			.then(async (serializedRundown) => {
				console.log('opening rundown', serializedRundown)
				// nocommit TODO

				if (verifyImportIsRundown(serializedRundown)) {
					const existing = rundowns.find((rd) => rd.id === serializedRundown.rundown.id)
					if (existing) {
						// nocommit TODO
						// this.$bvModal.show('rundown-import-already-exists')
					} else {
						try {
							await dispatch(importRundown(serializedRundown))

							await navigate({
								to: '/rundown/$rundownId',
								params: {
									rundownId: serializedRundown.rundown.id
								}
							})
						} catch (e: unknown) {
							console.error(e)
							// nocommit TODO
							// this.$bvModal.show('rundown-import-failed')
						}
					}
				} else {
					// nocommit TODO
					// this.$bvModal.show('rundown-import-is-invalid')
				}
			})
			.catch((e) => {
				// eslint-disable-next-line no-console
				console.error(e)
				// nocommit 'rundown-import-is-invalid'
			})
	}, [])

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
					<ListGroup.Item key={rd.id} action as={Link} to={`/rundown/${rd.id}`}>
						{rd.name}
					</ListGroup.Item>
				))}
			</ListGroup>
		</div>
	)
}
