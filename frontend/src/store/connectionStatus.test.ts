import { describe, expect, it } from 'vitest'
import { CoreConnectionStatus } from '~backend/background/interfaces'
import { selectFrameRate } from './connectionStatus'

const state = (frameRate?: number) => ({
	coreConnectionStatus: { status: CoreConnectionStatus.CONNECTED, frameRate }
})

describe('selectFrameRate', () => {
	it('returns 25 when unset', () => {
		expect(selectFrameRate(state())).toBe(25)
	})
	it('returns the set value', () => {
		expect(selectFrameRate(state(30))).toBe(30)
		expect(selectFrameRate(state(29.97))).toBe(29.97)
	})
})
