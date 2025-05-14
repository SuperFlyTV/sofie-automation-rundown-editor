import { createFileRoute } from '@tanstack/react-router'
import { Alert } from 'react-bootstrap'
import { RundownSettingsForm } from '~/components/settings/rundownSettingsForm'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute('/_root/settings/rundown')({
	component: RouteComponent
})

function RouteComponent() {
	const settings = useAppSelector((state) => state.settings)

	return (
		<>
			<h2>Rundown Settings</h2>

			{settings.settings && <RundownSettingsForm settings={settings.settings} />}
			{settings.error && <Alert variant="danger">{settings.error}</Alert>}
		</>
	)
}
