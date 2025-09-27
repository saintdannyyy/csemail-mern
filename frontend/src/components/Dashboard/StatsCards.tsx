import React from "react";
import {
  Mail,
  Send,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "red" | "purple" | "indigo";
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  color,
}) => {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    indigo: "bg-indigo-500",
  };

  const changeColorClasses = {
    increase: "text-green-600",
    decrease: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center">
        <div className={`${colorClasses[color]} rounded-md p-3`}>
          <div className="text-white">{icon}</div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value.toLocaleString()}
              </div>
              {change && changeType && (
                <div
                  className={`ml-2 flex items-baseline text-sm font-semibold ${changeColorClasses[changeType]}`}
                >
                  {change}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

export const StatsCards: React.FC<{ stats?: any }> = ({ stats }) => {
  // Fallback to mock if no stats
  const cards = stats
    ? [
        {
          title: "Total Campaigns",
          value: stats.campaigns?.total ?? 0,
          change: "",
          changeType: "neutral" as const,
          icon: <Mail className="h-6 w-6" />,
          color: "blue" as const,
        },
        {
          title: "Emails Sent (30d)",
          value: stats.emails?.sent ?? 0,
          change: "",
          changeType: "neutral" as const,
          icon: <Send className="h-6 w-6" />,
          color: "green" as const,
        },
        {
          title: "Avg. Open Rate",
          value: stats.emails?.openRate ? `${stats.emails.openRate}%` : "0%",
          change: "",
          changeType: "neutral" as const,
          icon: <TrendingUp className="h-6 w-6" />,
          color: "indigo" as const,
        },
        {
          title: "Active Contacts",
          value: stats.contacts?.active ?? 0,
          change: "",
          changeType: "neutral" as const,
          icon: <Users className="h-6 w-6" />,
          color: "purple" as const,
        },
        {
          title: "Queue Jobs",
          value: stats.emails?.sent ?? 0,
          change: "",
          changeType: "neutral" as const,
          icon: <Clock className="h-6 w-6" />,
          color: "yellow" as const,
        },
        {
          title: "Suppressed",
          value: stats.contacts?.suppressed ?? 0,
          change: "",
          changeType: "neutral" as const,
          icon: <AlertTriangle className="h-6 w-6" />,
          color: "red" as const,
        },
      ]
    : [
        {
          title: "Total Campaigns",
          value: 127,
          change: "+12%",
          changeType: "increase" as const,
          icon: <Mail className="h-6 w-6" />,
          color: "blue" as const,
        },
        {
          title: "Emails Sent (30d)",
          value: 2543892,
          change: "+18%",
          changeType: "increase" as const,
          icon: <Send className="h-6 w-6" />,
          color: "green" as const,
        },
        {
          title: "Avg. Open Rate",
          value: "24.8%",
          change: "+2.1%",
          changeType: "increase" as const,
          icon: <TrendingUp className="h-6 w-6" />,
          color: "indigo" as const,
        },
        {
          title: "Active Contacts",
          value: 98453,
          change: "+5%",
          changeType: "increase" as const,
          icon: <Users className="h-6 w-6" />,
          color: "purple" as const,
        },
        {
          title: "Queue Jobs",
          value: 1247,
          change: "Processing",
          changeType: "neutral" as const,
          icon: <Clock className="h-6 w-6" />,
          color: "yellow" as const,
        },
        {
          title: "Suppressed",
          value: 892,
          change: "+3",
          changeType: "neutral" as const,
          icon: <AlertTriangle className="h-6 w-6" />,
          color: "red" as const,
        },
      ];
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};
