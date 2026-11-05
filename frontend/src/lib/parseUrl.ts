/** Parse a plugin URL. Returns undefined unless it is a valid http(s) URL, so callers never see `javascript:` etc. */
export function parseUrl(url: string): URL | undefined {
	try {
		const parsed = new URL(url)
		return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : undefined
	} catch {
		return undefined
	}
}
