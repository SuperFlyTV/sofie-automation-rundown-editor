import type { OpenFromFileArgs, SaveToFileArgs } from '~backend/background/interfaces'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function openFromFile(_args: OpenFromFileArgs): Promise<object | null | Error> {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = '.json'
	input.style.display = 'none'

	return new Promise((resolve, reject) => {
		input.onchange = async () => {
			if (input.files && input.files.length > 0) {
				const file = input.files[0]
				const text = await file.text()
				try {
					resolve(JSON.parse(text))
				} catch (err) {
					console.error(err)
					reject(new Error('Invalid JSON'))
				}
			} else {
				resolve(null) // User cancelled
			}
		}
		input.click()
	})
}

export async function saveToFile(args: SaveToFileArgs): Promise<void> {
	const blob = new Blob([JSON.stringify(args.document, null, 2)], {
		type: 'application/json'
	})

	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = `${args.title || 'document'}.json`
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}
