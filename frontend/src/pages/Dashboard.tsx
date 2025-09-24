import React from "react";
import { StatsCards } from "../components/Dashboard/StatsCards";
import { RecentActivity } from "../components/Dashboard/RecentActivity";
import { CampaignPerformanceChart } from "../components/Dashboard/CampaignPerformanceChart";
import { ApiTestComponent } from "../components/ApiTestComponent";

export const Dashboard: React.FC = () => {
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
        <ApiTestComponent />

        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CampaignPerformanceChart />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};
