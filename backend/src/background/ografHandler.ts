import { GeneratedGraphicsManifest, GraphicsManifest } from 'ograf'
import { OgrafApi } from './lib/ografApi'

export class OGrafHandler {
	private api = new OgrafApi()

	public async loadGraphics(ografUrl: string): Promise<OgrafInfo[]> {
		this.api.baseURL = ografUrl

		// List all available graphics:

		const listGraphicsResponse = await this.api.listGraphics()
		if (listGraphicsResponse.status === 500 || listGraphicsResponse.status >= 400)
			throw new Error(
				`Failed to list graphics from OGraf server: [${listGraphicsResponse.status}]${JSON.stringify(listGraphicsResponse.content)}`
			)
		const ografList = listGraphicsResponse.content.graphics

		const discoveredOGrafs: OgrafInfo[] = []

		for (const listedOgraf of ografList) {
			const getGraphicsResponse = await this.api.getGraphic({
				graphicId: listedOgraf.id
			})
			if (getGraphicsResponse.status === 404) continue // ignore
			if (getGraphicsResponse.status === 500 || listGraphicsResponse.status >= 400) continue // ignore

			const graphic = getGraphicsResponse.content.graphic
			if (!graphic.supportsRealTime) continue

			const ograf: OgrafInfo = {
				id: listedOgraf.id,
				name: graphic.name,
				manifest: graphic as any
			}

			discoveredOGrafs.push(ograf)
		}

		return discoveredOGrafs
	}
}

type OgrafInfo = {
	id: string
	name: string
	manifest: GraphicsManifest
}

export const ografHandler = new OGrafHandler()
