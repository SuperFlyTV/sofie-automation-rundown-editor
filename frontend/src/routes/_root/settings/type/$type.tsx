import { createFileRoute } from '@tanstack/react-router'
import { Alert } from 'react-bootstrap'
import { TypeManifestsForm } from '~/components/settings/typeManifestForm/typeManifestForm'
import { useAppSelector } from '~/store/app'
import { TypeManifestEntity } from '~backend/background/interfaces'

export const Route = createFileRoute('/_root/settings/type/$type')({
	component: RouteComponent
})

function RouteComponent() {
	const { type } = Route.useParams()
	const typeManifests = useAppSelector((state) => state.typeManifests)

	let entityType: TypeManifestEntity
	let title: string

	switch (type) {
		case 'piece':
			entityType = TypeManifestEntity.Piece
			title = 'Piece Types'
			break
		case 'segment':
			entityType = TypeManifestEntity.Segment
			title = 'Segment Types'
			break
		case 'part':
			entityType = TypeManifestEntity.Part
			title = 'Part Types'
			break
		default:
			return <Alert variant="danger">Unknown type: {type}</Alert>
	}

	const manifests = typeManifests.manifest?.filter((m) => m.entityType === entityType)

	return (
		<>
			{manifests && (
				<TypeManifestsForm title={title} entityType={entityType} typeManifests={manifests} />
			)}
			{typeManifests.error && <Alert variant="danger">{typeManifests.error}</Alert>}
		</>
	)
}
