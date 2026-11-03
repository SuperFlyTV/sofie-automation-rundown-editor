import { describe, expect, it } from 'vitest'
import { parseXml, readMosItem } from './mosItem'

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

const parse = (xml: string, frameRate: number) => readMosItem(parseXml(xml), frameRate)
const withItem = (inner: string) => `<item><itemID>1</itemID>${inner}</item>`

describe('readMosItem', () => {
	it('parses name from itemSlug', () => {
		expect(parse(item, 25).name).toBe('Cat bites dog VO')
	})

	it('converts itemEdStart and itemEdDur from samples to seconds using frameRate', () => {
		const r = parse(item, 25)
		expect(r.start).toBe(2)
		expect(r.duration).toBe(510 / 25)
	})

	it('leaves duration undefined when itemEdDur is missing', () => {
		expect(parse(withItem('<itemSlug>a</itemSlug>'), 25).duration).toBeUndefined()
	})

	it('treats a missing itemEdStart as 0', () => {
		expect(parse(withItem('<itemSlug>a</itemSlug>'), 25).start).toBe(0)
	})

	it('falls back to the name "MOS item" when itemSlug is missing', () => {
		expect(parse(withItem(''), 25).name).toBe('MOS item')
	})

	it('throws on invalid XML', () => {
		expect(() => parse('<item><itemSlug>a</item>', 25)).toThrow()
		expect(() => parse('not xml', 25)).toThrow()
	})

	it('decodes &amp; and &lt; in itemSlug', () => {
		expect(parse(withItem('<itemSlug>a &amp; b &lt; c</itemSlug>'), 25).name).toBe('a & b < c')
	})

	it('throws when there is no item element', () => {
		expect(() => parse('<mos><ncsItem/></mos>', 25)).toThrow()
	})

	it('mosItem is the exact original <item> text', () => {
		expect(parse(item, 25).mosItem).toBe(item)
		const wrapped = `<mos>\n  <ncsItem>${item}</ncsItem>\n</mos>`
		expect(parse(wrapped, 25).mosItem).toBe(item)
	})

	it('only reads the first item', () => {
		const r = parse(`<mos>${withItem('<itemSlug>one</itemSlug>')}${withItem('<itemSlug>two</itemSlug>')}</mos>`, 25)
		expect(r.name).toBe('one')
	})
})
