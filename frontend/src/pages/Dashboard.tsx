import React, { useEffect, useState } from "react";
import { StatsCards } from "../components/Dashboard/StatsCards";
import { RecentActivity } from "../components/Dashboard/RecentActivity";
import { CampaignPerformanceChart } from "../components/Dashboard/CampaignPerformanceChart";
import { apiClient } from "../utils/apiClient";

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch dashboard stats
        const statsResponse = await apiClient.get<any>(
          "/api/reports/dashboard"
        );
        setStats(statsResponse);
        // Optionally fetch recent activity and performance (replace with real endpoints if available)
        // const activityResponse = await apiClient.get<any>("/api/activity/recent");
        // setActivity(activityResponse.activities || []);
        // const perfResponse = await apiClient.get<any>("/api/reports/performance");
        // setPerformance(perfResponse.performance || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load dashboard data");
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-lg">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            window.location.reload();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Fallback for empty dashboard
  if (!stats) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded mb-4">
          No dashboard data found.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back! Here's what's happening with your email campaigns.
        </p>
      </div>

      <div className="space-y-6">
        {/* API Connection Test - remove this after testing */}
        {/* <ApiTestComponent /> */}

        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CampaignPerformanceChart performance={performance} />
          <RecentActivity activity={activity} />
        </div>
      </div>
    </div>
  );
};
