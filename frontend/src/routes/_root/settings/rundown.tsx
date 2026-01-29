import { createFileRoute } from '@tanstack/react-router'
import { Alert } from 'react-bootstrap'
import { TypeManifestForm } from '~/components/settings/typeManifestForm/typeManifestForm'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute('/_root/settings/rundown')({
	component: RouteComponent
})

function RouteComponent() {
	const typeManifests = useAppSelector((state) => state.typeManifests)
	const manifest = typeManifests.manifests?.find((m) => m.id === 'rundown')

	return (
		<>
			<h2>Rundown Metadata</h2>

			{manifest && <TypeManifestForm manifest={manifest} showTypefields={false} />}
			{typeManifests.error && <Alert variant="danger">{typeManifests.error}</Alert>}
		</>
	)
}
