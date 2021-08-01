import { RundownMetadataManifest, PiecesManifest, ManifestFieldType } from './interfaces'

// TODO - make this some JSON file for better flexibility
export const rundownManifest: RundownMetadataManifest = [

]

export const piecesManifest: PiecesManifest = [
	{
		id: 'cam',
		shortName: 'Cam',
		name: 'Camera',
		colour: '#18791C',
		payload: [
			{
				id: 'number',
				type: ManifestFieldType.Number,
				label: 'Camera number'
			}
		]
	},
	{
		id: 'gfx_l3d',
		shortName: 'l3d',
		name: 'Lower third',
		colour: '#ED7200',
		payload: [
			{
				id: 'f0',
				type: ManifestFieldType.String,
				label: 'f0'
			},
			{
				id: 'f1',
				type: ManifestFieldType.String,
				label: 'f1'
			}
		]
	}
]
