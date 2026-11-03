import { parseXml, readMosItem, type MosItemFields } from './mosItem'

export type PluginEvent =
	| { type: 'appInfoRequest' } // plugin sent ncsReqAppInfo: reply with buildAppInfo()
	| { type: 'item'; item: MosItemFields } // plugin sent ncsItem: reply with buildAck(), offer item to the user
	| { type: 'close' } // ncsReqAppClose: reply with buildAck('ACK')

/**
 * Turns a postMessage from the plugin iframe into an event for the app.
 * Returns undefined for messages we do not handle: other origins, non-string data, unknown names.
 * Throws on malformed XML: the caller reports it (and may reply with buildAck('ERROR')).
 *
 * Message names come from the MOS 2.8.5 "ActiveX / plugin" section (NCS = the newsroom system, i.e. us):
 * - ncsReqAppInfo: plugin asks us to describe the host (answer with buildAppInfo)
 * - ncsItem: plugin hands us the item the user created or edited
 * - ncsReqAppClose: plugin asks us to close it
 *
 * @param frameRate frames per second; item times in MOS messages are in frames
 */
export function readPluginMessage(
	event: { origin: string; data: unknown },
	allowedOrigin: string,
	frameRate: number
): PluginEvent | undefined {
	if (event.origin !== allowedOrigin || typeof event.data !== 'string') return undefined

	// Parse once; the first child of <mos> is the message name
	const doc = parseXml(event.data)
	switch (doc.documentElement.firstElementChild?.tagName) {
		case 'ncsReqAppInfo':
			return { type: 'appInfoRequest' }
		case 'ncsItem':
			return { type: 'item', item: readMosItem(doc, frameRate) }
		case 'ncsReqAppClose':
			return { type: 'close' }
		default:
			return undefined
	}
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * ncsAppInfo: CREATE, or EDIT with the current item XML.
 * `item` is already serialized XML, so it is not escaped.
 * The plugin draws itself inside our iframe, so UImetric is all zeros with mode CONTAINED.
 * canClose TRUE lets the plugin ask us to close it (ncsReqAppClose).
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

/** ncsAck: reply to the plugin. ERROR (with a description) tells it we could not use its message. */
export function buildAck(status: 'ACK' | 'ERROR', description?: string): string {
	const desc = description === undefined ? '' : `<statusDescription>${escapeXml(description)}</statusDescription>`
	return `<mos><ncsAck><status>${status}</status>${desc}</ncsAck></mos>`
}
