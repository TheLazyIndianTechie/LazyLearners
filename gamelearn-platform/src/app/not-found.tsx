import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* 404 Icon */}
          <div className="mx-auto h-16 w-16 text-gray-400">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* 404 Title */}
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900">
            404
          </h1>

          {/* 404 Subtitle */}
          <h2 className="mt-2 text-xl font-semibold text-gray-700">
            Page not found
          </h2>

          {/* 404 Message */}
          <p className="mt-4 text-base text-gray-600">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or the URL might be incorrect.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Homepage
          </Link>

          <button
            onClick={() => window.history.back()}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Looking for something specific? Try these popular pages:
          </p>
          <div className="space-y-2">
            <Link
              href="/courses"
              className="block text-sm text-blue-600 hover:text-blue-500"
            >
              Browse Courses
            </Link>
            <Link
              href="/dashboard"
              className="block text-sm text-blue-600 hover:text-blue-500"
            >
              Dashboard
            </Link>
            <Link
              href="/portfolio"
              className="block text-sm text-blue-600 hover:text-blue-500"
            >
              Portfolio
            </Link>
            <Link
              href="/collaboration"
              className="block text-sm text-blue-600 hover:text-blue-500"
            >
              Collaboration
            </Link>
          </div>
        </div>

        {/* Support Contact */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Still can't find what you're looking for?{' '}
            <a
              href="mailto:support@gamelearn.com"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}