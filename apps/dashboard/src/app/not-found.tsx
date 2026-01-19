import Link from "next/link"

/**
 * Not Found Page
 *
 * Displayed when a route is not found (404).
 * This is a Server Component to avoid client-side hook issues during prerendering.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tight text-zinc-100">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-zinc-100">
            Page not found
          </h2>
          <p className="text-zinc-400">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium bg-zinc-100 text-zinc-900 rounded-none hover:bg-zinc-200 transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  )
}
