import React, { useEffect, useState } from "react";
import { Clock, Mail, Users, TrendingUp } from "lucide-react";

interface ActivityItem {
  id: string;
  type:
    | "campaign_sent"
    | "contact_imported"
    | "template_created"
    | "report_generated";
  title: string;
  description: string;
  timestamp: string;
  user: string;
  userId?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
  };
}

const ActivityIcon: React.FC<{ type: string }> = ({ type }) => {
  const icons = {
    campaign_sent: <Mail className="h-5 w-5 text-green-600" />,
    contact_imported: <Users className="h-5 w-5 text-blue-600" />,
    template_created: <TrendingUp className="h-5 w-5 text-purple-600" />,
    report_generated: <TrendingUp className="h-5 w-5 text-indigo-600" />,
  };
  return (
    icons[type as keyof typeof icons] || (
      <Clock className="h-5 w-5 text-gray-400" />
    )
  );
};

export const RecentActivity: React.FC<{ activity?: ActivityItem[] }> = ({
  activity,
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>(activity || []);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the apiClient method for recent activity
        const response = await (
          await import("../../utils/apiClient")
        ).apiClient.getRecentActivity();
        const activities = response.activities || response.recentActivity || [];

        // Map activities to handle user names properly
        const mappedActivities = activities.map((activity: any) => ({
          ...activity,
          id: activity._id || activity.id,
          user:
            activity.userId &&
            activity.userId.firstName &&
            activity.userId.lastName
              ? `${activity.userId.firstName} ${activity.userId.lastName}`
              : activity.user || "Unknown User",
        }));

        setActivities(mappedActivities);
      } catch (err: any) {
        setError(err?.message || "Failed to load activity");
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [activity]);

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6 text-center text-gray-400">Loading activity...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6 text-center text-red-600">{error}</div>
        <div className="px-6 py-3 text-center">
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
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6 text-center text-yellow-700">
          No recent activity found.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ActivityIcon type={activity.type} />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500">{activity.description}</p>
                <div className="mt-1 flex items-center text-xs text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {activity.timestamp} • {activity.user}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-3 bg-gray-50 text-center">
        <a
          href="/activity"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          View all activity
        </a>
      </div>
    </div>
  );
};
