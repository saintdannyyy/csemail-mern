import React, { useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

export const ApiTestComponent: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>("Testing...");
  const [apiConnected, setApiConnected] = useState<boolean>(false);

  useEffect(() => {
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      const response = await apiClient.healthCheck();
      setHealthStatus(
        `✅ Backend connected: ${response.status} at ${response.timestamp}`
      );
      setApiConnected(true);
    } catch (error) {
      setHealthStatus(
        `❌ Backend connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setApiConnected(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">API Connection Test</h3>
      <p
        className={`text-sm ${
          apiConnected ? "text-green-600" : "text-red-600"
        }`}
      >
        {healthStatus}
      </p>
      <button
        onClick={testApiConnection}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Again
      </button>
    </div>
  );
};
