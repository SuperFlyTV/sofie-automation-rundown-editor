import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback } from 'react'
import { Button, ListGroup } from 'react-bootstrap'
import { useAppDispatch, useAppSelector } from '~/store/app'
import { addNewRundown } from '~/store/rundowns'

export const Route = createFileRoute('/')({
	component: Index
})

function Index() {
	const dispatch = useAppDispatch()
	const rundowns = useAppSelector((state) => state.rundowns)

	const createNewRundown = useCallback(() => {
		dispatch(addNewRundown({ playlistId: null })).unwrap()
	}, [])

	const selectImportRundown = useCallback(() => {
		// nocommit TODO
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
