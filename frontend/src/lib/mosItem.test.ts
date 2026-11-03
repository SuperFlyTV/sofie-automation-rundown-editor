import { describe, expect, it } from 'vitest'
import type { Piece } from '~backend/background/interfaces'
import { getMosItemXml, parseMosItem } from './mosItem'

const item = `<item>
  <itemID>2</itemID>
  <itemSlug>Cat bites dog VO</itemSlug>
  <objID>A0323H1233309873139AQz</objID>
  <objPaths>
    <objPath techDescription="MPEG2 Video">\\\\server\\media\\clip.mxf</objPath>
  </objPaths>
  <itemEdStart>50</itemEdStart>
  <itemEdDur>510</itemEdDur>
</item>`

const withItem = (inner: string) => `<item><itemID>1</itemID>${inner}</item>`

describe('parseMosItem', () => {
	it('parses name from itemSlug', () => {
		expect(parseMosItem(item, 25).name).toBe('Cat bites dog VO')
	})

	it('converts itemEdStart and itemEdDur from samples to seconds using frameRate', () => {
		const r = parseMosItem(item, 25)
		expect(r.start).toBe(2)
		expect(r.duration).toBe(510 / 25)
	})

	it('leaves duration undefined when itemEdDur is missing', () => {
		expect(parseMosItem(withItem('<itemSlug>a</itemSlug>'), 25).duration).toBeUndefined()
	})

	it('treats a missing itemEdStart as 0', () => {
		expect(parseMosItem(withItem('<itemSlug>a</itemSlug>'), 25).start).toBe(0)
	})

	it.each([0, -5, NaN])('uses 25 when frameRate is %s', (rate) => {
		expect(parseMosItem(withItem('<itemEdDur>50</itemEdDur>'), rate).duration).toBe(2)
	})

	it('falls back to the name "MOS item" when itemSlug is missing', () => {
		expect(parseMosItem(withItem(''), 25).name).toBe('MOS item')
	})

	it('throws on invalid XML', () => {
		expect(() => parseMosItem('<item><itemSlug>a</item>', 25)).toThrow()
		expect(() => parseMosItem('not xml', 25)).toThrow()
	})

	it('decodes &amp; and &lt; in itemSlug', () => {
		expect(parseMosItem(withItem('<itemSlug>a &amp; b &lt; c</itemSlug>'), 25).name).toBe('a & b < c')
	})

	it('throws when there is no item element', () => {
		expect(() => parseMosItem('<mos><ncsItem/></mos>', 25)).toThrow()
	})

	it('mosItem is the exact original <item> text', () => {
		expect(parseMosItem(item, 25).mosItem).toBe(item)
		const wrapped = `<mos>\n  <ncsItem>${item}</ncsItem>\n</mos>`
		expect(parseMosItem(wrapped, 25).mosItem).toBe(item)
	})

	it('only reads the first item', () => {
		const r = parseMosItem(`<mos>${withItem('<itemSlug>one</itemSlug>')}${withItem('<itemSlug>two</itemSlug>')}</mos>`, 25)
		expect(r.name).toBe('one')
	})
})

describe('getMosItemXml', () => {
	const piece = (payload: unknown) => ({ payload }) as unknown as Piece

	it('returns the xml when set', () => {
		expect(getMosItemXml(piece({ mosItem: '<item/>' }))).toBe('<item/>')
	})

	it('returns undefined for no payload.mosItem, empty string, or a non-string', () => {
		expect(getMosItemXml(piece({}))).toBeUndefined()
		expect(getMosItemXml(piece({ mosItem: '' }))).toBeUndefined()
		expect(getMosItemXml(piece({ mosItem: 5 }))).toBeUndefined()
	})
})
