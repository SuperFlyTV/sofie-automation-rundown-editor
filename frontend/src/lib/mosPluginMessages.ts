import { SaxParser } from '@nodable/sax'
import { parseMosItem, type MosItemFields } from './mosItem'

export type PluginEvent =
	| { type: 'appInfoRequest' } // plugin sent ncsReqAppInfo: reply with buildAppInfo()
	| { type: 'item'; item: MosItemFields } // plugin sent ncsItem: reply with buildAck(), offer item to the user
	| { type: 'close' } // ncsReqAppClose: reply with buildAck('ACK')
	| { type: 'ignore' }

/** Name of the first child element of <mos>. Throws on invalid XML. */
function getMessageName(xml: string): string | undefined {
	let depth = 0
	let name: string | undefined
	new SaxParser({
		onStartElement(n) {
			depth++
			if (depth === 2 && name === undefined) name = n
		},
		onEndElement() {
			depth--
		}
	}).parse(xml)
	return name
}

export function readPluginMessage(
	event: { origin: string; data: unknown },
	allowedOrigin: string,
	frameRate: number
): PluginEvent {
	if (event.origin !== allowedOrigin || typeof event.data !== 'string') return { type: 'ignore' }

	switch (getMessageName(event.data)) {
		case 'ncsReqAppInfo':
			return { type: 'appInfoRequest' }
		case 'ncsItem':
			return { type: 'item', item: parseMosItem(event.data, frameRate) }
		case 'ncsReqAppClose':
			return { type: 'close' }
		default:
			return { type: 'ignore' }
	}
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** ncsAppInfo: CREATE, or EDIT with the current item XML */
export function buildAppInfo(item?: string): string {
	return (
		'<mos><ncsAppInfo>' +
		(item ?? '') +
		'<ncsInformation>' +
		'<userID>sofie-rundown-editor</userID>' +
		`<runContext>${item ? 'EDIT' : 'CREATE'}</runContext>` +
		'<software><manufacturer>SuperFly.tv</manufacturer><product>Sofie Rundown Editor</product><version>1</version></software>' +
		'<UImetric num="0"><startx>0</startx><starty>0</starty><endx>0</endx><endy>0</endy><mode>CONTAINED</mode><canClose>TRUE</canClose></UImetric>' +
		'</ncsInformation></ncsAppInfo></mos>'
	)
}

export function buildItemRequest(): string {
	return '<mos><ncsItemRequest/></mos>'
}

export function buildAck(status: 'ACK' | 'ERROR', description?: string): string {
	const desc = description === undefined ? '' : `<statusDescription>${escapeXml(description)}</statusDescription>`
	return `<mos><ncsAck><status>${status}</status>${desc}</ncsAck></mos>`
}
