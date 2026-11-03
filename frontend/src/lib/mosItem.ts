export interface MosItemFields {
	name: string
	start?: number // seconds
	duration?: number // seconds
	mosItem: string // the original <item> XML
}

/** Used when Core has not told us the device's frame rate */
export const DEFAULT_FRAME_RATE = 25

/** Samples to seconds; undefined if the text is not a number */
function toSeconds(samples: string | undefined, frameRate: number): number | undefined {
	if (samples === undefined || samples.trim() === '') return undefined
	const n = Number(samples)
	return Number.isFinite(n) ? n / frameRate : undefined
}

/** Parses XML with the browser parser. Throws on invalid XML (DOMParser reports errors as a <parsererror> element instead). */
export function parseXml(xml: string): Document {
	const doc = new DOMParser().parseFromString(xml, 'application/xml')
	const error = doc.getElementsByTagName('parsererror')[0]
	if (error) throw new Error(`Invalid XML: ${error.textContent?.trim()}`)
	return doc
}

/** Reads the first <item> in `xml`: a bare item or any message containing one. Throws on invalid XML or no item. */
export function parseMosItem(xml: string, frameRate: number): MosItemFields {
	const item = parseXml(xml).getElementsByTagName('item')[0]
	if (!item) throw new Error('No <item> element found in MOS message')

	// Only direct children of the item; nested elements (objPaths etc.) are ignored
	const field = (name: string) => Array.from(item.children).find((c) => c.tagName === name)?.textContent ?? undefined

	return {
		name: field('itemSlug')?.trim() || 'MOS item',
		// A missing itemEdStart means the item plays from its beginning
		start: toSeconds(field('itemEdStart'), frameRate) ?? 0,
		duration: toSeconds(field('itemEdDur'), frameRate),
		mosItem: new XMLSerializer().serializeToString(item)
	}
}
