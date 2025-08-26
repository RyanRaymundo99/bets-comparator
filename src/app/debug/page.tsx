"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

interface BinanceTestResult {
  type: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export default function DebugPage() {
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [binanceResults, setBinanceResults] = useState<BinanceTestResult[]>([]);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        const sessionData = await authClient.getSession();
        console.log("Debug Session:", sessionData);
        setSession(sessionData);
      } catch (err) {
        console.error("Debug Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  const testBinanceAPI = async () => {
    setTesting(true);
    setBinanceResults([]);

    try {
      // Test 0: Basic connectivity test (no auth required)
      try {
        const testResponse = await fetch("/api/crypto/test");
        const testData = await testResponse.json();

        if (testResponse.ok) {
          setBinanceResults((prev) => [
            ...prev,
            {
              type: "Basic Connectivity Test",
              success: true,
              data: testData,
            },
          ]);
        } else {
          setBinanceResults((prev) => [
            ...prev,
            {
              type: "Basic Connectivity Test",
              success: false,
              error: testData.error || "Failed to test connectivity",
            },
          ]);
        }
      } catch (err) {
        setBinanceResults((prev) => [
          ...prev,
          {
            type: "Basic Connectivity Test",
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          },
        ]);
      }

      // Test 1: Price fetching (public API)
      try {
        const priceResponse = await fetch("/api/crypto/price?symbol=BTCBRL");
        const priceData = await priceResponse.json();

        if (priceResponse.ok) {
          setBinanceResults((prev) => [
            ...prev,
            {
              type: "Price Fetch (BTCBRL)",
              success: true,
              data: priceData,
            },
          ]);
        } else {
          setBinanceResults((prev) => [
            ...prev,
            {
              type: "Price Fetch (BTCBRL)",
              success: false,
              error: priceData.error || "Failed to fetch price",
            },
          ]);
        }
      } catch (err) {
        setBinanceResults((prev) => [
          ...prev,
          {
            type: "Price Fetch (BTCBRL)",
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          },
        ]);
      }

      // Test 2: Account info (private API)
      try {
        const accountResponse = await fetch("/api/crypto/account-info");
        const accountData = await accountResponse.json();

        if (accountResponse.ok) {
          setBinanceResults((prev) => [
            ...prev,
            {
              type: "Account Info",
              success: true,
              data: accountData,
            },
          ]);
        } else {
          setBinanceResults((prev) => [
            ...prev,
            {
              type: "Account Info",
              success: false,
              error: accountData.error || "Failed to fetch account info",
            },
          ]);
        }
      } catch (err) {
        setBinanceResults((prev) => [
          ...prev,
          {
            type: "Account Info",
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          },
        ]);
      }

      // Test 3: Test with other symbols
      const testSymbols = ["ETHBRL", "BNBBRL", "ADABRL"];
      for (const symbol of testSymbols) {
        try {
          const response = await fetch(`/api/crypto/price?symbol=${symbol}`);
          const data = await response.json();

          if (response.ok) {
            setBinanceResults((prev) => [
              ...prev,
              {
                type: `Price Fetch (${symbol})`,
                success: true,
                data: data,
              },
            ]);
          } else {
            setBinanceResults((prev) => [
              ...prev,
              {
                type: `Price Fetch (${symbol})`,
                success: false,
                error: data.error || "Failed to fetch price",
              },
            ]);
          }
        } catch (err) {
          setBinanceResults((prev) => [
            ...prev,
            {
              type: `Price Fetch (${symbol})`,
              success: false,
              error: err instanceof Error ? err.message : "Unknown error",
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Binance testing error:", err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Debug & Testing Dashboard</h1>

      {/* Session Debug Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Session Debug</h2>

        {loading && <p>Loading session...</p>}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {session && typeof session === "object" && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>Session found:</strong>
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}

        {!loading && !session && !error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <strong>No session found</strong>
          </div>
        )}
      </div>

      {/* Binance API Testing Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Binance API Testing</h2>

        <div className="mb-4">
          <button
            onClick={testBinanceAPI}
            disabled={testing}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {testing ? "Testing..." : "Test Binance API"}
          </button>
        </div>

        {binanceResults.length > 0 && (
          <div className="space-y-4">
            {binanceResults.map((result, index) => (
              <div
                key={index}
                className={`border rounded p-4 ${
                  result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h3
                  className={`font-semibold ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.type} - {result.success ? "SUCCESS" : "FAILED"}
                </h3>

                {result.success && result.data && (
                  <pre className="mt-2 text-sm overflow-auto bg-white p-2 rounded border">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}

                {!result.success && result.error && (
                  <p className="mt-2 text-red-700">{result.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Testing Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Manual API Testing</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Test Basic Connectivity</h3>
            <p className="text-sm text-gray-600 mb-2">
              Test: <code>/api/crypto/test</code>
            </p>
            <a
              href="/api/crypto/test"
              target="_blank"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Test Binance Connection
            </a>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Test Price Endpoint</h3>
            <p className="text-sm text-gray-600 mb-2">
              Test: <code>/api/crypto/price?symbol=BTCBRL</code>
            </p>
            <a
              href="/api/crypto/price?symbol=BTCBRL"
              target="_blank"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Test BTC/BRL Price
            </a>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Test Account Info</h3>
            <p className="text-sm text-gray-600 mb-2">
              Test: <code>/api/crypto/account-info</code>
            </p>
            <a
              href="/api/crypto/account-info"
              target="_blank"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Test Account Info
            </a>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Validate Session</h3>
            <p className="text-sm text-gray-600 mb-2">
              Test: <code>/api/auth/validate-session</code>
            </p>
            <a
              href="/api/auth/validate-session"
              target="_blank"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Validate Session
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
