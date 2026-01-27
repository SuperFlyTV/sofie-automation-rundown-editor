import { createFileRoute } from '@tanstack/react-router'
import { Alert } from 'react-bootstrap'
import { PieceTypesForm } from '~/components/settings/pieceTypesForm'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute('/_root/settings/piece-types')({
	component: RouteComponent
})

function RouteComponent() {
	const piecesManifest = useAppSelector((state) => state.typeManifests)

	return (
		<>
			{piecesManifest.manifest && <PieceTypesForm piecesManifest={piecesManifest.manifest} />}
			{piecesManifest.error && <Alert variant="danger">{piecesManifest.error}</Alert>}
		</>
	)
}
