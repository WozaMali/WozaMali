import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import '../src/index.css'

// Dynamically import providers with SSR disabled
const ClientProviders = dynamic(() => import('../src/components/ClientProviders'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-lg">Loading Collector Service...</p>
      </div>
    </div>
  ),
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClientProviders>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Collector Service</h1>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Home</a>
                <a href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                <a href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Admin</a>
                <a href="/collector" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Collector</a>
                <a href="/calculator" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Calculator</a>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Component {...pageProps} />
        </main>
      </div>
    </ClientProviders>
  )
}
