declare function Timecode(
	timecode: number | string | Date,
	frameRate?: number,
	dropFrame?: boolean
): TimecodeObject
declare interface TimecodeObject {
	frameCount: number
	frameRate: number
	hours: number
	minutes: number
	seconds: number
	frames: number
	dropFrame: number

	add: (x: number | Date | TimecodeObject) => void
	subtract: (x: number | Date | TimecodeObject) => void

	toString: () => string
	toString: (fields: 'field') => string
	toDate: () => Date
	valueOf: () => number
}

declare module 'smpte-timecode' {
	export = Timecode
}
