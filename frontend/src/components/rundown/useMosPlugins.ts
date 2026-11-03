import { useMemo } from 'react'
import type { MosPluginConfig } from '~backend/background/interfaces'
import { useAppSelector } from '~/store/app'
import { parseUrl } from '~/lib/parseUrl'

/** Plugins with a usable URL and a piece type that still exists */
export function useMosPlugins(): MosPluginConfig[] {
	const plugins = useAppSelector((state) => state.settings.settings?.mosPlugins)
	const pieceTypes = useAppSelector((state) => state.typeManifests.manifests)
	return useMemo(
		() =>
			// Settings may hold half-typed or stale entries; hiding them here keeps MosPluginFrame
			// safe to assume a valid URL (settings form validation is a separate safeguard).
			(plugins ?? []).filter(
				(p) =>
					parseUrl(p.url) &&
					pieceTypes?.some((m) => m.entityType === 'piece' && m.id === p.pieceType)
			),
		[plugins, pieceTypes]
	)
}
