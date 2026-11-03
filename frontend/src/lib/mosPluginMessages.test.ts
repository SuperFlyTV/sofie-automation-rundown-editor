import { describe, expect, it } from 'vitest'
import { buildAck, buildAppInfo, readPluginMessage } from './mosPluginMessages'

const origin = 'https://plugin.example.com'
const send = (data: unknown, o = origin) => readPluginMessage({ origin: o, data }, origin, 25)
const itemXml = '<item><itemID>0</itemID><itemSlug>Clip</itemSlug><itemEdDur>50</itemEdDur></item>'

describe('readPluginMessage', () => {
	it('ignores a message from another origin', () => {
		expect(send('<mos><ncsReqAppInfo/></mos>', 'https://evil.example.com')).toBeUndefined()
	})

	it('ignores non-string data', () => {
		expect(send({ a: 1 })).toBeUndefined()
	})

	it('ignores an unknown message', () => {
		expect(send('<mos><ncsAck><status>ACK</status></ncsAck></mos>')).toBeUndefined()
	})

	it('maps ncsReqAppInfo', () => {
		expect(send('<mos><ncsReqAppInfo/></mos>')).toEqual({ type: 'appInfoRequest' })
	})

	it('maps ncsItem to an item event', () => {
		const e = send(`<mos><ncsItem>${itemXml}</ncsItem></mos>`)
		expect(e).toMatchObject({ type: 'item', item: { name: 'Clip', duration: 2, mosItem: itemXml } })
	})

	it('maps ncsReqAppClose', () => {
		expect(send('<mos><ncsReqAppClose/></mos>')).toEqual({ type: 'close' })
	})

	it('throws on a known message with invalid XML', () => {
		expect(() => send('<mos><ncsItem><item></ncsItem></mos>')).toThrow()
	})

	it('throws on ncsItem with no item element', () => {
		expect(() => send('<mos><ncsItem/></mos>')).toThrow()
	})
})

describe('builders', () => {
	it('buildAppInfo without item says CREATE', () => {
		const xml = buildAppInfo()
		expect(xml).toContain('<runContext>CREATE</runContext>')
		expect(xml).toContain('<canClose>TRUE</canClose>')
		expect(xml).not.toContain('<item>')
	})

	it('buildAppInfo with item says EDIT and includes the item', () => {
		const xml = buildAppInfo(itemXml)
		expect(xml).toContain('<runContext>EDIT</runContext>')
		expect(xml.indexOf(itemXml)).toBeLessThan(xml.indexOf('<ncsInformation>'))
	})

	it('buildAck ERROR carries the description', () => {
		expect(buildAck('ERROR', 'a < b')).toBe(
			'<mos><ncsAck><status>ERROR</status><statusDescription>a &lt; b</statusDescription></ncsAck></mos>'
		)
		expect(buildAck('ACK')).toBe('<mos><ncsAck><status>ACK</status></ncsAck></mos>')
	})
})
