export interface MosItemFields {
	name: string
	start?: number // seconds
	duration?: number // seconds
	mosItem: string // the original <item> XML
}

/** MOS item times are in frames. Converts to seconds; undefined if the text is not a number. */
function toSeconds(frames: string | undefined, frameRate: number): number | undefined {
	if (frames === undefined || frames.trim() === '') return undefined
	const n = Number(frames)
	return Number.isFinite(n) ? n / frameRate : undefined
}

/** Text of a direct child element of `parent` (not nested ones), or undefined if there is none */
function childText(parent: Element, name: string): string | undefined {
	return Array.from(parent.children).find((c) => c.tagName === name)?.textContent ?? undefined
}

/** Parses XML with the browser parser. Throws on invalid XML (DOMParser reports errors as a <parsererror> element instead). */
export function parseXml(xml: string): Document {
	const doc = new DOMParser().parseFromString(xml, 'application/xml')
	const error = doc.getElementsByTagName('parsererror')[0]
	if (error) throw new Error(`Invalid XML: ${error.textContent?.trim()}`)
	return doc
}

/** Reads the first <item> in a parsed document: a bare item or any message containing one. Throws if there is none. */
export function readMosItem(doc: Document, frameRate: number): MosItemFields {
	const item = doc.getElementsByTagName('item')[0]
	if (!item) throw new Error('No <item> element found in MOS message')

	const field = (name: string) => childText(item, name)

	return {
		name: field('itemSlug')?.trim() || 'MOS item',
		// A missing itemEdStart means the item plays from its beginning
		start: toSeconds(field('itemEdStart'), frameRate) ?? 0,
		duration: toSeconds(field('itemEdDur'), frameRate),
		mosItem: new XMLSerializer().serializeToString(item)
	}
}
