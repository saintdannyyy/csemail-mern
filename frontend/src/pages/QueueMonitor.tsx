import React, { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Activity,
} from "lucide-react";

interface QueueStats {
  queued: number;
  sending: number;
  sent: number;
  failed: number;
  retrying: number;
  total: number;
}

interface QueueJob {
  id: string;
  email: string;
  status: "queued" | "sending" | "sent" | "failed" | "retrying";
  attemptCount: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
  campaigns: {
    name: string;
    subject: string;
  };
}

interface QueueConfig {
  isPaused: boolean;
  rateLimitPerMinute: number;
  maxRetryAttempts: number;
}

export const QueueMonitor: React.FC = () => {
  const [stats, setStats] = useState<QueueStats>({
    queued: 0,
    sending: 0,
    sent: 0,
    failed: 0,
    retrying: 0,
    total: 0,
  });
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [config, setConfig] = useState<QueueConfig>({
    isPaused: false,
    rateLimitPerMinute: 100,
    maxRetryAttempts: 3,
  });
  const [processingRate, setProcessingRate] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const fetchQueueData = async () => {
      setLoading(true);
      try {
        const apiClient = (await import("../utils/apiClient")).apiClient;
        // Fetch queue stats
        const statsResponse = (await apiClient.get("/api/queue/stats")) as {
          stats?: QueueStats;
          processingRate?: number;
        };
        setStats(
          statsResponse.stats ?? {
            queued: 0,
            sending: 0,
            sent: 0,
            failed: 0,
            retrying: 0,
            total: 0,
          }
        );

        // Fetch jobs
        const jobsResponse = (await apiClient.get("/api/queue/jobs")) as {
          jobs?: QueueJob[];
        };
        setJobs(jobsResponse.jobs ?? []);

        // Fetch config
        const configResponse = (await apiClient.get("/api/queue/config")) as {
          config?: QueueConfig;
        };
        setConfig(
          configResponse.config ?? {
            isPaused: false,
            rateLimitPerMinute: 100,
            maxRetryAttempts: 3,
          }
        );

        setProcessingRate(statsResponse.processingRate ?? 0);
      } catch (error) {
        console.error("Failed to fetch queue data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [selectedStatus]);

  const fetchQueueData = async () => {
    try {
      // Simulate API calls - replace with actual API calls
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data
      setStats({
        queued: 1247,
        sending: 23,
        sent: 45892,
        failed: 156,
        retrying: 8,
        total: 47326,
      });

      setJobs([
        {
          id: "1",
          email: "john.doe@example.com",
          status: "queued",
          attemptCount: 0,
          createdAt: "2024-01-22T10:30:00Z",
          campaigns: {
            name: "Q4 Product Updates",
            subject: "Exciting New Features Coming Your Way!",
          },
        },
        {
          id: "2",
          email: "jane.smith@example.com",
          status: "sending",
          attemptCount: 1,
          lastAttemptAt: "2024-01-22T10:35:00Z",
          createdAt: "2024-01-22T10:30:00Z",
          campaigns: {
            name: "Weekly Newsletter #42",
            subject: "This Week in Software Engineering",
          },
        },
        {
          id: "3",
          email: "failed@example.com",
          status: "failed",
          attemptCount: 3,
          lastAttemptAt: "2024-01-22T10:32:00Z",
          errorMessage: "SMTP connection timeout",
          createdAt: "2024-01-22T10:30:00Z",
          campaigns: {
            name: "Holiday Greetings 2024",
            subject: "Season's Greetings from All of Us",
          },
        },
      ]);

      setProcessingRate(85);
      setConfig({
        isPaused: false,
        rateLimitPerMinute: 100,
        maxRetryAttempts: 3,
      });
    } catch (error) {
      console.error("Failed to fetch queue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQueueProcessing = async () => {
    try {
      const newPausedState = !config.isPaused;
      setConfig((prev) => ({ ...prev, isPaused: newPausedState }));
      // Simulate API call
      console.log(newPausedState ? "Pausing queue..." : "Resuming queue...");
    } catch (error) {
      console.error("Failed to toggle queue processing:", error);
    }
  };

  const retryFailedJobs = async () => {
    try {
      // Simulate API call
      console.log("Retrying failed jobs...");
      await fetchQueueData();
    } catch (error) {
      console.error("Failed to retry jobs:", error);
    }
  };

  const updateConfig = async (newConfig: Partial<QueueConfig>) => {
    try {
      setConfig((prev) => ({ ...prev, ...newConfig }));
      // Simulate API call
      console.log("Updating queue configuration...", newConfig);
    } catch (error) {
      console.error("Failed to update configuration:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queued":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "sending":
        return <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "retrying":
        return <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      queued: "bg-blue-100 text-blue-800",
      sending: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      retrying: "bg-orange-100 text-orange-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors]
        }`}
      >
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Queue Monitor</h1>
            <p className="mt-1 text-sm text-gray-600">
              Real-time email queue monitoring and management
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </button>
            <button
              onClick={retryFailedJobs}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Failed
            </button>
            <button
              onClick={toggleQueueProcessing}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                config.isPaused
                  ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                  : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
              }`}
            >
              {config.isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Queue
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Queue
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Queue Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Queued</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.queued.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.sending.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sent</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.sent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.failed.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <RefreshCw className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Retrying</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.retrying.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Rate/min</p>
              <p className="text-2xl font-semibold text-gray-900">
                {processingRate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Queue Configuration
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Limit (emails per minute)
                </label>
                <input
                  type="number"
                  value={config.rateLimitPerMinute}
                  onChange={(e) =>
                    updateConfig({
                      rateLimitPerMinute: parseInt(e.target.value),
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Retry Attempts
                </label>
                <input
                  type="number"
                  value={config.maxRetryAttempts}
                  onChange={(e) =>
                    updateConfig({ maxRetryAttempts: parseInt(e.target.value) })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queue Status Alert */}
      {config.isPaused && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Queue Processing Paused
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Email queue processing is currently paused. No emails will be
                  sent until resumed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Jobs</h3>
            <div className="flex items-center space-x-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Status</option>
                <option value="queued">Queued</option>
                <option value="sending">Sending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="retrying">Retrying</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Attempt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No queue jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {job.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {job.campaigns.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {job.campaigns.subject}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.attemptCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.lastAttemptAt
                        ? new Date(job.lastAttemptAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {job.errorMessage ? (
                        <div
                          className="text-sm text-red-600 max-w-xs truncate"
                          title={job.errorMessage}
                        >
                          {job.errorMessage}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
