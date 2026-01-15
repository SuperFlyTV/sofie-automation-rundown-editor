import { Alert } from 'react-bootstrap'
import { ErrorBoundary } from 'react-error-boundary'
import { isRedirect } from '@tanstack/react-router'

export function MyErrorBoundary({ children }: { children: React.ReactNode }) {
	return (
		<ErrorBoundary
			FallbackComponent={MyErrorBoundaryContent}
			onError={(error) => {
				// router should handle redirect errors.
				if (isRedirect(error)) {
					throw error
				}
			}}
		>
			{children}
		</ErrorBoundary>
	)
}

function MyErrorBoundaryContent({
	error,
	resetErrorBoundary
}: {
	error: unknown
	resetErrorBoundary: () => void
}) {
	return (
		<Alert variant="danger">
			<h2>Something went wrong:</h2>
			<pre>{error instanceof Error ? error.message : String(error)}</pre>
			<button onClick={resetErrorBoundary}>Try again</button>
		</Alert>
	)
}
