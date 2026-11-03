import { SaxParser } from '@nodable/sax'
import type { Piece } from '~backend/background/interfaces'

export interface MosItemFields {
	name: string
	start?: number // seconds
	duration?: number // seconds
	mosItem: string // the original <item> XML
}

const DEFAULT_FRAME_RATE = 25

/** Samples to seconds; undefined if the text is not a number */
function toSeconds(samples: string | undefined, frameRate: number): number | undefined {
	if (samples === undefined || samples.trim() === '') return undefined
	const n = Number(samples)
	return Number.isFinite(n) ? n / frameRate : undefined
}

/** Reads the first <item> in `xml`: a bare item or any message containing one. Throws on invalid XML or no item. */
export function parseMosItem(xml: string, frameRate: number): MosItemFields {
	const rate = Number.isFinite(frameRate) && frameRate > 0 ? frameRate : DEFAULT_FRAME_RATE

	const stack: string[] = []
	const fields: Record<string, string> = {}
	let itemDepth = -1
	let startIndex = 0
	let endIndex: number | undefined
	let done = false

	new SaxParser({
		onStartElement(name, _attrs, tag) {
			stack.push(name)
			if (itemDepth < 0 && !done && name === 'item') {
				itemDepth = stack.length
				startIndex = tag.index
				endIndex = tag.openEnd // self-closing items have no closeEnd
			}
		},
		onText(text) {
			// Only direct children of the item; nested elements (objPaths etc.) are ignored
			if (itemDepth > 0 && stack.length === itemDepth + 1) {
				const key = stack[stack.length - 1]
				fields[key] = (fields[key] ?? '') + text
			}
		},
		onEndElement(name, close) {
			if (itemDepth > 0 && stack.length === itemDepth && name === 'item') {
				endIndex = close.closeEnd ?? endIndex
				itemDepth = -1
				done = true
			}
			stack.pop()
		}
	}).parse(xml)

	if (!done || endIndex === undefined) throw new Error('No <item> element found in MOS message')

	return {
		name: fields.itemSlug?.trim() || 'MOS item',
		start: toSeconds(fields.itemEdStart, rate) ?? 0,
		duration: toSeconds(fields.itemEdDur, rate),
		mosItem: xml.slice(startIndex, endIndex)
	}
}

export function getMosItemXml(piece: Piece): string | undefined {
	const xml = piece.payload?.mosItem
	return typeof xml === 'string' && xml !== '' ? xml : undefined
}
