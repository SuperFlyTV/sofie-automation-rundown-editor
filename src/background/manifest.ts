import { RundownMetadataManifest, PiecesManifest, ManifestFieldType } from './interfaces'

// TODO - make this some JSON file for better flexibility
export const rundownManifest: RundownMetadataManifest = []

// Define part types that can be used in rundowns
// ToDo - make these in better structure (id: type, name: type, etc)
export const PARTS_MANIFEST = ['Titles', 'VO', 'Cam', 'Full', 'Remote', 'GFX', 'DVE']

// Define pieces manifest with all piece types and their properties
export const PIECES_MANIFEST: PiecesManifest = [
	{
		id: 'video',
		name: 'Video Clip',
		shortName: 'VID',
		colour: '#1f77b4',
		includeTypeInName: true,
		payload: [
			{
				id: 'fileName',
				label: 'File Name',
				type: ManifestFieldType.String,
				includeInName: true
			},
			{
				id: 'sourceDuration',
				label: 'Source Duration',
				type: ManifestFieldType.Number
			}
		]
	},
	{
		id: 'camera',
		name: 'Camera',
		shortName: 'CAM',
		colour: '#ff7f0e',
		includeTypeInName: true,
		payload: [
			{
				id: 'camNo',
				label: 'Camera Number',
				type: ManifestFieldType.Number,
				includeInName: true
			}
		]
	},
	{
		id: 'remote',
		name: 'Remote Input',
		shortName: 'REM',
		colour: '#2ca02c',
		includeTypeInName: true,
		payload: [
			{
				id: 'input',
				label: 'Input Number',
				type: ManifestFieldType.Number,
				includeInName: true
			}
		]
	},
	{
		id: 'split',
		name: 'Split Screen',
		shortName: 'SPLIT',
		colour: '#d62728',
		includeTypeInName: true,
		payload: []
	},
	{
		id: 'head',
		name: 'Headline',
		shortName: 'HEAD',
		colour: '#9467bd',
		includeTypeInName: true,
		payload: [
			{
				id: 'text',
				label: 'Text',
				type: ManifestFieldType.String,
				includeInName: true
			}
		]
	},
	{
		id: 'l3d',
		name: 'Lower Third',
		shortName: 'L3D',
		colour: '#8c564b',
		includeTypeInName: true,
		payload: [
			{
				id: 'name',
				label: 'Name',
				type: ManifestFieldType.String,
				includeInName: true
			},
			{
				id: 'title',
				label: 'Title',
				type: ManifestFieldType.String,
				includeInName: true
			}
		]
	},
	{
		id: 'ticker',
		name: 'Ticker',
		shortName: 'TICK',
		colour: '#e377c2',
		includeTypeInName: true,
		payload: []
	},
	{
		id: 'strap',
		name: 'Location Strap',
		shortName: 'STRAP',
		colour: '#7f7f7f',
		includeTypeInName: true,
		payload: [
			{
				id: 'location',
				label: 'Location',
				type: ManifestFieldType.String,
				includeInName: true
			}
		]
	},
	{
		id: 'fullscreen',
		name: 'Fullscreen Graphic',
		shortName: 'FS',
		colour: '#bcbd22',
		includeTypeInName: true,
		payload: [
			{
				id: 'url',
				label: 'URL',
				type: ManifestFieldType.String
			}
		]
	}
]
