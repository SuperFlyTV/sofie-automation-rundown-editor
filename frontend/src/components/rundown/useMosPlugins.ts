import { useMemo } from 'react'
import type { MosPluginConfig } from '~backend/background/interfaces'
import { useAppSelector } from '~/store/app'

export function parseUrl(url: string): URL | undefined {
	try {
		return new URL(url)
	} catch {
		return undefined
	}
}

/** Plugins with a usable URL and a piece type that still exists */
export function useMosPlugins(): MosPluginConfig[] {
	const plugins = useAppSelector((state) => state.settings.settings?.mosPlugins)
	const pieceTypes = useAppSelector((state) => state.typeManifests.manifests)
	return useMemo(
		() =>
			(plugins ?? []).filter(
				(p) =>
					parseUrl(p.url)?.protocol.startsWith('http') &&
					pieceTypes?.some((m) => m.entityType === 'piece' && m.id === p.pieceType)
			),
		[plugins, pieceTypes]
	)
}
