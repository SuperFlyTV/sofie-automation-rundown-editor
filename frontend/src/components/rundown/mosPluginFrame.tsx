import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Spinner } from 'react-bootstrap'
import type { MosPluginConfig } from '~backend/background/interfaces'
import { useAppSelector } from '~/store/app'
import { selectFrameRate } from '~/store/connectionStatus'
import type { MosItemFields } from '~/lib/mosItem'
import {
	buildAck,
	buildAppInfo,
	readPluginMessage
} from '~/lib/mosPluginMessages'

const READY_TIMEOUT_MS = 10_000
const ITEM_TIMEOUT_MS = 30_000

export function MosPluginFrame(props: {
	// Must have a valid http(s) URL: use plugins from useMosPlugins, which filters the rest out
	plugin: MosPluginConfig
	initialItemXml?: string // present means EDIT, absent means CREATE
	// Called when the plugin sends an item (its own save). Items sent meanwhile are refused until a returned promise settles (or 30s pass); a throw is shown to the user.
	onItem: (item: MosItemFields) => void | Promise<void>
	onCancel: () => void
	workingLabel?: string // status text while onItem runs
	autoFocus?: boolean // focus the plugin when it loads
}) {
	const { plugin, initialItemXml, onItem, onCancel, workingLabel = 'Saving...', autoFocus = true } = props
	const frameRate = useAppSelector(selectFrameRate)
	// Needed to check who sent a message and to postMessage into the frame
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [ready, setReady] = useState(false) // plugin has sent appInfoRequest
	const [timedOutAttempt, setTimedOutAttempt] = useState<number>() // attempt that never became ready
	const [busy, setBusy] = useState(false) // onItem is running (for display)
	const busyRef = useRef(false) // same, but readable between renders: two items can arrive before one
	const [attempt, setAttempt] = useState(0) // changing this remounts the iframe (Retry)
	const [error, setError] = useState<string>() // last item/message failure, cleared on next item
	const timedOut = timedOutAttempt === attempt

	const url = new URL(plugin.url)
	const pluginOrigin = url.origin
	// The plugin posts its messages to this origin, so it must be ours
	url.searchParams.set('origin', window.location.origin)
	const src = url.toString()

	const send = useCallback(
		(xml: string) => iframeRef.current?.contentWindow?.postMessage(xml, pluginOrigin),
		[pluginOrigin]
	)

	useEffect(() => {
		const listener = (event: MessageEvent) => {
			// Other windows can post messages to us; source identifies our iframe,
			// and the origin check (in readPluginMessage) rejects a frame that navigated elsewhere.
			if (event.source !== iframeRef.current?.contentWindow) return

			// Only a problem with the plugin's message is reported back to the plugin as ERROR
			let msg
			try {
				msg = readPluginMessage(event, pluginOrigin, frameRate)
			} catch (e) {
				console.error(e)
				const reason = e instanceof Error ? e.message : String(e)
				send(buildAck('ERROR', reason))
				setError(`Received an invalid message from ${plugin.name}: ${reason}`)
				return
			}
			if (!msg) return

			if (msg.type === 'appInfoRequest') {
				setReady(true)
				send(buildAppInfo(initialItemXml))
			} else if (msg.type === 'item') {
				// A busy refusal is a real refusal; a failure in onItem is shown here and the item stays acknowledged
				if (busyRef.current) {
					send(buildAck('ERROR', 'Busy saving the previous item'))
					return
				}
				send(buildAck('ACK'))
				busyRef.current = true
				setError(undefined)
				setBusy(true)
				let timer: ReturnType<typeof setTimeout> | undefined
				const timeout = new Promise<never>((_, reject) => {
					timer = setTimeout(() => reject(new Error('Timed out. Check whether it was saved.')), ITEM_TIMEOUT_MS)
				})
				Promise.race([Promise.resolve().then(() => onItem(msg.item)), timeout])
					.catch((e) => {
						console.error(e)
						setError(`Could not use the item from ${plugin.name}: ${e instanceof Error ? e.message : String(e)}`)
					})
					.finally(() => {
						clearTimeout(timer)
						busyRef.current = false
						setBusy(false)
					})
			} else {
				send(buildAck('ACK'))
				onCancel()
			}
		}
		window.addEventListener('message', listener)
		return () => window.removeEventListener('message', listener)
	}, [pluginOrigin, send, plugin.name, onItem, onCancel, initialItemXml, frameRate])

	// Show a warning if the plugin never says hello
	useEffect(() => {
		if (ready) return // only matters while not ready
		const timer = setTimeout(() => setTimedOutAttempt(attempt), READY_TIMEOUT_MS)
		return () => clearTimeout(timer)
	}, [attempt, ready])

	const retry = () => {
		setReady(false)
		setAttempt((a) => a + 1)
	}

	return (
		<>
			{!ready &&
				(timedOut ? (
					<Alert variant="warning">
						{plugin.name} did not respond. It may be unreachable, or it may block embedding
						(frame-ancestors / X-Frame-Options). Check the URL in Settings.
						<div className="text-break">URL: {plugin.url}</div>
						<div className="d-flex gap-2 mt-2">
							<Button type="button" variant="outline-secondary" onClick={retry}>
								Retry
							</Button>
							<Button
								as="a"
								variant="outline-secondary"
								href={plugin.url}
								target="_blank"
								rel="noopener noreferrer"
							>
								Open in new tab
							</Button>
						</div>
					</Alert>
				) : (
					<div role="status" className="d-flex align-items-center gap-2 mb-2">
						<Spinner size="sm" aria-hidden="true" /> Waiting for {plugin.name}...
					</div>
				))}
			<iframe
				key={attempt}
				ref={iframeRef}
				src={src}
				title={plugin.name}
				onLoad={(e) => autoFocus && e.currentTarget.focus()}
				// Capped so the Save/Cancel buttons below stay on screen
				style={{ width: '100%', height: '60vh', maxHeight: 'calc(100vh - 220px)', border: 0 }}
			/>
			{error && (
				<Alert variant="danger" className="mt-2 mb-0" role="alert">
					{error}
				</Alert>
			)}
			<div className="d-flex justify-content-end gap-2 mt-2">
				{busy && (
					<div role="status" className="d-flex align-items-center gap-2 me-auto">
						<Spinner size="sm" aria-hidden="true" /> {workingLabel}
					</div>
				)}
				<Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
					Cancel
				</Button>
			</div>
		</>
	)
}
