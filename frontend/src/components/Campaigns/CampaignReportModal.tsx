import React, { useState, useEffect } from "react";
import { X, BarChart3, TrendingUp, TrendingDown, Users, Mail, MousePointer, AlertTriangle, Loader2 } from "lucide-react";
import { Campaign } from "../../types";

interface CampaignReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
}

interface CampaignReport {
  campaign: Campaign;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  clickThroughRate: number;
  engagement: {
    totalEngagements: number;
    uniqueOpens: number;
    uniqueClicks: number;
    forwardShares: number;
  };
  timeline: Array<{
    date: string;
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
  }>;
  topLinks?: Array<{
    url: string;
    clicks: number;
    uniqueClicks: number;
  }>;
  deviceStats?: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  locationStats?: Array<{
    country: string;
    opens: number;
    clicks: number;
  }>;
}

export const CampaignReportModal: React.FC<CampaignReportModalProps> = ({
  isOpen,
  onClose,
  campaign,
}) => {
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && campaign.status === 'sent') {
      fetchReport();
    }
  }, [isOpen, campaign.id]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const { apiClient } = await import("../../utils/apiClient");
      const reportData = await apiClient.getCampaignReport(campaign.id);
      setReport(reportData);
    } catch (error) {
      console.error("Failed to fetch campaign report:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch campaign report");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const StatCard = ({ 
    title, 
    value, 
    percentage, 
    icon: Icon, 
    color, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    percentage: string; 
    icon: React.ElementType; 
    color: string; 
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <span className="ml-2 text-sm text-gray-500">({percentage})</span>
            </div>
          </div>
        </div>
        {trend && (
          <div className="flex items-center">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">Campaign Report</h2>
              <p className="text-sm text-gray-600">{campaign.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading report...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-6">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Report</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={fetchReport}
                    className="mt-3 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : campaign.status !== 'sent' ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Report Not Available</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Campaign reports are only available for sent campaigns. This campaign has a status of "{campaign.status}".
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Delivered"
                    value={campaign.deliveredCount.toLocaleString()}
                    percentage={getPercentage(campaign.deliveredCount, campaign.sentCount)}
                    icon={Mail}
                    color="bg-blue-500"
                    trend="up"
                  />
                  <StatCard
                    title="Opened"
                    value={campaign.openedCount.toLocaleString()}
                    percentage={getPercentage(campaign.openedCount, campaign.sentCount)}
                    icon={TrendingUp}
                    color="bg-green-500"
                    trend={campaign.openedCount > 0 ? "up" : "neutral"}
                  />
                  <StatCard
                    title="Clicked"
                    value={campaign.clickedCount.toLocaleString()}
                    percentage={getPercentage(campaign.clickedCount, campaign.sentCount)}
                    icon={MousePointer}
                    color="bg-purple-500"
                    trend={campaign.clickedCount > 0 ? "up" : "neutral"}
                  />
                  <StatCard
                    title="Bounced"
                    value={campaign.bouncedCount.toLocaleString()}
                    percentage={getPercentage(campaign.bouncedCount, campaign.sentCount)}
                    icon={AlertTriangle}
                    color="bg-red-500"
                    trend={campaign.bouncedCount > 0 ? "down" : "neutral"}
                  />
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {getPercentage(campaign.openedCount, campaign.sentCount)}
                    </div>
                    <div className="text-sm text-gray-600">Open Rate</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Industry avg: 21.3%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {getPercentage(campaign.clickedCount, campaign.sentCount)}
                    </div>
                    <div className="text-sm text-gray-600">Click Rate</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Industry avg: 2.6%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {campaign.openedCount > 0 ? getPercentage(campaign.clickedCount, campaign.openedCount) : "0%"}
                    </div>
                    <div className="text-sm text-gray-600">Click-to-Open Rate</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Industry avg: 12.2%
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Delivery Details</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Total Recipients</dt>
                        <dd className="text-sm font-medium text-gray-900">{campaign.totalRecipients.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Successfully Sent</dt>
                        <dd className="text-sm font-medium text-gray-900">{campaign.sentCount.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Delivered</dt>
                        <dd className="text-sm font-medium text-gray-900">{campaign.deliveredCount.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Bounced</dt>
                        <dd className="text-sm font-medium text-red-600">{campaign.bouncedCount.toLocaleString()}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Engagement Details</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Total Opens</dt>
                        <dd className="text-sm font-medium text-gray-900">{campaign.openedCount.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Total Clicks</dt>
                        <dd className="text-sm font-medium text-gray-900">{campaign.clickedCount.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Unsubscribes</dt>
                        <dd className="text-sm font-medium text-orange-600">{campaign.unsubscribedCount.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Sent Date</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : "N/A"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Additional Insights */}
              {report && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Insights & Recommendations</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    {report.openRate > 25 ? (
                      <p>✅ Excellent open rate! Your subject line and sender reputation are performing well.</p>
                    ) : report.openRate > 15 ? (
                      <p>👍 Good open rate. Consider A/B testing subject lines to improve further.</p>
                    ) : (
                      <p>⚠️ Below average open rate. Consider improving your subject lines and sender reputation.</p>
                    )}
                    
                    {report.clickRate > 3 ? (
                      <p>✅ Great click rate! Your content is engaging your audience effectively.</p>
                    ) : report.clickRate > 1 ? (
                      <p>👍 Decent click rate. Try adding more compelling calls-to-action.</p>
                    ) : (
                      <p>⚠️ Low click rate. Consider improving your content and call-to-action buttons.</p>
                    )}
                    
                    {report.bounceRate > 5 ? (
                      <p>⚠️ High bounce rate detected. Consider cleaning your email list to improve deliverability.</p>
                    ) : (
                      <p>✅ Good delivery rate! Your email list quality is excellent.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};