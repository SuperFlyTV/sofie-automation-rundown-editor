import { parseMosItem, parseXml, type MosItemFields } from './mosItem'

export type PluginEvent =
	| { type: 'appInfoRequest' } // plugin sent ncsReqAppInfo: reply with buildAppInfo()
	| { type: 'item'; item: MosItemFields } // plugin sent ncsItem: reply with buildAck(), offer item to the user
	| { type: 'close' } // ncsReqAppClose: reply with buildAck('ACK')
	| { type: 'ignore' }

/** Name of the first child element of <mos>. Throws on invalid XML. */
function getMessageName(xml: string): string | undefined {
	return parseXml(xml).documentElement.firstElementChild?.tagName
}

/**
 * Turns a postMessage from the plugin iframe into an event for the app.
 * Messages from other origins (or non-string data) are ignored, as anyone can postMessage to us.
 * Throws on malformed XML: the caller reports it (and may reply with buildAck('ERROR')).
 *
 * Message names come from the MOS 2.8.5 "ActiveX / plugin" section (NCS = the newsroom system, i.e. us):
 * https://mosprotocol.com/wp-content/MOS-Protocol-Documents/MOS-Protocol-2.8.5-Final.htm
 * - ncsReqAppInfo: plugin asks us to describe the host (answer with buildAppInfo)
 * - ncsItem: plugin hands us the item the user created or edited
 * - ncsReqAppClose: plugin asks us to close it
 */
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

/**
 * ncsAppInfo: CREATE, or EDIT with the current item XML.
 * The plugin lays itself out inside our iframe, so the constants below tell it so:
 * - UImetric is all zeros with mode CONTAINED: we don't position a separate window, the iframe is the window
 * - canClose TRUE: the plugin may ask us to close it (ncsReqAppClose)
 * - userID and version are identification only; the plugin does not depend on their values
 */
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

/** ncsAck: reply to the plugin. ERROR (with a description) tells it we could not use its message. */
export function buildAck(status: 'ACK' | 'ERROR', description?: string): string {
	const desc = description === undefined ? '' : `<statusDescription>${escapeXml(description)}</statusDescription>`
	return `<mos><ncsAck><status>${status}</status>${desc}</ncsAck></mos>`
}
