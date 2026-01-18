"use client"

/**
 * Global Error Boundary
 *
 * Handles errors that occur in the root layout or during initial rendering.
 * Must be a Client Component and cannot use context providers (they may not be available).
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-zinc-950 text-zinc-100">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Something went wrong
              </h1>
              <p className="text-zinc-400">
                An unexpected error occurred. Please try again.
              </p>
            </div>

            {process.env.NODE_ENV === "development" && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-left">
                <p className="text-sm font-mono text-red-400 break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-zinc-500 mt-2">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium bg-zinc-100 text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
