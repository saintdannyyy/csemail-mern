import React from "react";
import { TrendingUp, Mail, MousePointer, Eye } from "lucide-react";

interface ChartData {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

export const CampaignPerformanceChart: React.FC<{
  performance?: ChartData[];
}> = ({ performance }) => {
  const chartData: ChartData[] =
    performance && performance.length > 0
      ? performance
      : [
          { date: "2024-10-01", sent: 15000, opened: 3750, clicked: 562 },
          { date: "2024-10-02", sent: 18000, opened: 4680, clicked: 702 },
          { date: "2024-10-03", sent: 12000, opened: 3000, clicked: 450 },
          { date: "2024-10-04", sent: 22000, opened: 5940, clicked: 891 },
          { date: "2024-10-05", sent: 16000, opened: 4000, clicked: 640 },
          { date: "2024-10-06", sent: 20000, opened: 5400, clicked: 810 },
          { date: "2024-10-07", sent: 14000, opened: 3640, clicked: 546 },
        ];
  const maxValue = Math.max(...chartData.map((d) => d.sent));
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            7-Day Performance
          </h3>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Sent</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Opened</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Clicked</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="relative">
          <div className="flex items-end justify-between h-64 space-x-2">
            {chartData.map((data, index) => {
              const sentHeight = (data.sent / maxValue) * 240;
              const openedHeight = (data.opened / maxValue) * 240;
              const clickedHeight = (data.clicked / maxValue) * 240;
              return (
                <div key={index} className="flex-1 flex items-end space-x-1">
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full flex justify-center space-x-1">
                      <div
                        className="w-3 bg-blue-500 rounded-t"
                        style={{ height: `${sentHeight}px` }}
                      ></div>
                      <div
                        className="w-3 bg-green-500 rounded-t"
                        style={{ height: `${openedHeight}px` }}
                      ></div>
                      <div
                        className="w-3 bg-purple-500 rounded-t"
                        style={{ height: `${clickedHeight}px` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(data.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Mail className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">
                Total Sent
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {chartData.reduce((sum, d) => sum + d.sent, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Eye className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">
                Total Opens
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {chartData.reduce((sum, d) => sum + d.opened, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MousePointer className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">
                Total Clicks
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {chartData
                .reduce((sum, d) => sum + d.clicked, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
