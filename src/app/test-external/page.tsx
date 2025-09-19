'use client';

import { useEffect, useState } from 'react';

export default function TestExternalPage() {
  const [clientInfo, setClientInfo] = useState<any>(null);

  useEffect(() => {
    setClientInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      location: window.location.href,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          External Access Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Connection Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">✅ Server Running</h3>
              <p className="text-green-700">App is accessible from external devices</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">🌐 Network Access</h3>
              <p className="text-blue-700">Available at: http://192.168.18.239:8080</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Client Information
          </h2>
          {clientInfo ? (
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>URL:</strong> {clientInfo.location}
                </div>
                <div>
                  <strong>Hostname:</strong> {clientInfo.hostname}
                </div>
                <div>
                  <strong>Port:</strong> {clientInfo.port}
                </div>
                <div>
                  <strong>Protocol:</strong> {clientInfo.protocol}
                </div>
                <div>
                  <strong>Platform:</strong> {clientInfo.platform}
                </div>
                <div>
                  <strong>Language:</strong> {clientInfo.language}
                </div>
                <div>
                  <strong>Online:</strong> {clientInfo.onLine ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Cookies:</strong> {clientInfo.cookieEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div className="mt-4">
                <strong>User Agent:</strong>
                <p className="text-sm text-gray-600 break-all">{clientInfo.userAgent}</p>
              </div>
            </div>
          ) : (
            <p>Loading client information...</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test Links
          </h2>
          <div className="space-y-2">
            <a 
              href="/" 
              className="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Go to Main App
            </a>
            <a 
              href="/auth/sign-in" 
              className="block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              Go to Sign In
            </a>
            <a 
              href="/rewards" 
              className="block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
            >
              Go to Rewards
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
