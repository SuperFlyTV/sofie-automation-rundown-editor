import { createFileRoute } from '@tanstack/react-router'
import { useAppSelector } from '~/store/app'

export const Route = createFileRoute('/settings')({
	component: Settings
})

function Settings() {
	// Select the `state.posts` value from the store into the component
	const posts = useAppSelector((state) => state.counter)

	return <div className="p-2">Hello from Settings! {JSON.stringify(posts)}</div>
}
