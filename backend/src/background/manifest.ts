import { ManifestFieldType, TypeManifest, TypeManifestEntity } from './interfaces'

// TODO - make this some JSON file for better flexibility

export const defaultRundownManifest: TypeManifest = {
	id: 'rundown',
	entityType: TypeManifestEntity.Rundown,
	name: 'Default Rundown Manifest',
	shortName: 'RD',
	colour: '#000000',
	payload: []
}

// Define pieces manifest with all piece types and their properties
export const TYPE_MANIFESTS: TypeManifest[] = [
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
		],
		entityType: TypeManifestEntity.Piece
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
		],
		entityType: TypeManifestEntity.Piece
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
		],
		entityType: TypeManifestEntity.Piece
	},
	{
		id: 'split',
		name: 'Split Screen',
		shortName: 'SPLIT',
		colour: '#d62728',
		includeTypeInName: true,
		payload: [],
		entityType: TypeManifestEntity.Piece
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
		],
		entityType: TypeManifestEntity.Piece
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
		],
		entityType: TypeManifestEntity.Piece
	},
	{
		id: 'ticker',
		name: 'Ticker',
		shortName: 'TICK',
		colour: '#e377c2',
		includeTypeInName: true,
		payload: [],
		entityType: TypeManifestEntity.Piece
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
		],
		entityType: TypeManifestEntity.Piece
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
		],
		entityType: TypeManifestEntity.Piece
	},
	{
		id: 'graphic',
		name: 'Graphic',
		shortName: 'GFX',
		colour: '#ff006e',
		payload: [
			{
				id: 'description',
				label: 'Description',
				type: ManifestFieldType.String
			},
			{
				id: 'location',
				label: 'Location',
				type: ManifestFieldType.String
			},
			{
				id: 'text',
				label: 'Text',
				type: ManifestFieldType.String
			}
		],
		entityType: TypeManifestEntity.Piece
	},
	{
		id: 'stepped-graphic',
		name: 'Stepped Graphic',
		shortName: 'STGFX',
		colour: '#ff006e',
		payload: [
			{
				id: 'description',
				label: 'Description',
				type: ManifestFieldType.String
			},
			{
				id: 'location',
				label: 'Location',
				type: ManifestFieldType.String
			},
			{
				id: 'text',
				label: 'Text',
				type: ManifestFieldType.String
			},
			{
				id: 'stepCount',
				label: 'Step Count',
				type: ManifestFieldType.Number
			}
		],
		entityType: TypeManifestEntity.Piece
	},
	{
		id: 'Titles',
		name: 'Titles',
		shortName: 'Titles',
		colour: '#666666',
		payload: [],
		entityType: TypeManifestEntity.Part
	},
	{
		id: 'VO',
		name: 'VO',
		shortName: 'VO',
		colour: '#666666',
		payload: [],
		entityType: TypeManifestEntity.Part
	},
	{
		id: 'Cam',
		name: 'Cam',
		shortName: 'Cam',
		colour: '#666666',
		payload: [],
		entityType: TypeManifestEntity.Part
	},
	{
		id: 'Full',
		name: 'Full',
		shortName: 'Full',
		colour: '#666666',
		payload: [],
		entityType: TypeManifestEntity.Part
	},
	{
		id: 'Remote',
		name: 'Remote',
		shortName: 'Remote',
		colour: '#666666',
		payload: [],
		entityType: TypeManifestEntity.Part
	},
	{
		id: 'GFX',
		name: 'GFX',
		shortName: 'GFX',
		colour: '#666666',
		payload: [],
		entityType: TypeManifestEntity.Part
	},
	{
		id: 'DVE',
		name: 'DVE',
		shortName: 'DVE',
		colour: '#666666',
		payload: [],
		entityType: TypeManifestEntity.Part
	},
	{
		id: 'normal',
		name: 'Normal',
		shortName: 'NRM',
		colour: '#666666',
		payload: [],
		entityType: TypeManifestEntity.Segment
	},
	{
		id: 'opening',
		name: 'Opening',
		shortName: 'OP',
		colour: '#666666',
		payload: [],
		entityType: TypeManifestEntity.Segment
	}
]
