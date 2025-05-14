import { Alert } from 'react-bootstrap'
import { ErrorBoundary } from 'react-error-boundary'

export function MyErrorBoundary({ children }: { children: React.ReactNode }) {
	return <ErrorBoundary FallbackComponent={MyErrorBoundaryContent}>{children}</ErrorBoundary>
}

function MyErrorBoundaryContent({
	error,
	resetErrorBoundary
}: {
	error: Error
	resetErrorBoundary: () => void
}) {
	return (
		<Alert variant="danger">
			<h2>Something went wrong:</h2>
			<pre>{error.message}</pre>
			<button onClick={resetErrorBoundary}>Try again</button>
		</Alert>
	)
}
