/**
 * This implementation is a fast and dirty way of opening and saving files HOWEVER,
 * this uses the electron remote API which is not a good practice. Ideally this
 * implementation will be replace to use native HTML API's so everything works from
 * the browser sandbox.
 */

import { remote } from 'electron'
import { promises as fs } from 'fs'

export async function saveToFile (document: any): Promise<boolean> {
    console.log(remote.dialog)
    const { filePath, canceled } = await remote.dialog.showSaveDialog({
        title: 'Export piece types',
        filters: [{ name: 'JSON', extensions: ['json'] }],
    })

    if (filePath && !canceled) {
        await fs.writeFile(filePath, JSON.stringify(document))
    }

    return false
}

export async function openFromFile (): Promise<boolean | any> {
    const { canceled, filePaths } = await remote.dialog.showOpenDialog({
        title: 'Import piece types',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile'],
    })

    if (!canceled && filePaths && filePaths.length > 0) {
        const result = await fs.readFile(filePaths[0], { encoding: 'utf-8' })
        if (result) {
            return JSON.parse(result)
        }
    }

    return false
}
