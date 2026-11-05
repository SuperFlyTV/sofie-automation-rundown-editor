import { createFileRoute } from '@tanstack/react-router'
import { Alert } from 'react-bootstrap'
import { CoreConnectionSettingsForm } from '~/components/settings/coreConnectionSettingsForm'
import { MosPluginsForm } from '~/components/settings/mosPluginsForm'
import { ResetToDefaults } from '~/components/settings/resetToDefaultsButton'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute('/_root/settings/connection')({
	component: RouteComponent
})

function RouteComponent() {
	const settings = useAppSelector((state) => state.settings)

	return (
		<>
			<h2>Connection Settings</h2>

			<h3>Core</h3>
			{settings.settings && <CoreConnectionSettingsForm settings={settings.settings} />}
			{settings.settings && <MosPluginsForm settings={settings.settings} />}
			{settings.error && <Alert variant="danger">{settings.error}</Alert>}

			<ResetToDefaults />
		</>
	)
}
