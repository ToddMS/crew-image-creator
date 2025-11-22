import { createRouter as createTanStackRouter } from '@tanstack/react-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const createRouter = () => {
  const router = createTanStackRouter({
    routeTree,
    // Restore scroll position when navigating back/forward
    scrollRestoration: true,
    // Configure preloading behavior
    defaultPreloadStaleTime: 0,
    defaultPreload: 'intent',
    // Cache configuration
    defaultPendingComponent: () => (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    ),
    defaultErrorComponent: ({ error }) => (
      <div className="error-boundary p-4">
        <h2 className="text-lg font-semibold text-red-600">
          Something went wrong
        </h2>
        <details className="mt-2">
          <summary className="cursor-pointer text-sm">Error details</summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
      </div>
    ),
    // Context for passing data down to routes
    context: {
      // Add any global context needed by routes
    },
  })

  return router
}

// Also export as getRouter for backward compatibility
export const getRouter = createRouter