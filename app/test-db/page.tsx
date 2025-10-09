'use client';

import { useState } from 'react';

export default function TestDBPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/test-db');
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Failed to fetch' });
    }
    setLoading(false);
  };

  const createUser = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/test-user', { method: 'POST' });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Failed to create user' });
    }
    setLoading(false);
  };

  const getUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/test-user');
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Failed to fetch users' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🧪 Database Test Page</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Test Actions</h2>

          <div className="flex gap-4 flex-wrap">
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳ Testing...' : '🔌 Test Connection'}
            </button>

            <button
              onClick={createUser}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '⏳ Creating...' : '➕ Create Test User'}
            </button>

            <button
              onClick={getUsers}
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? '⏳ Loading...' : '👥 Get All Users'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">
              {result.success ? '✅ Success' : '❌ Error'}
            </h2>

            <div className="bg-gray-100 rounded p-4 overflow-auto">
              <pre className="text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
