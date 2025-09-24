import React from 'react';
import { Clock, Mail, Users, TrendingUp } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'campaign_sent' | 'contact_imported' | 'template_created' | 'report_generated';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

const ActivityIcon: React.FC<{ type: string }> = ({ type }) => {
  const icons = {
    campaign_sent: <Mail className="h-5 w-5 text-green-600" />,
    contact_imported: <Users className="h-5 w-5 text-blue-600" />,
    template_created: <TrendingUp className="h-5 w-5 text-purple-600" />,
    report_generated: <TrendingUp className="h-5 w-5 text-indigo-600" />,
  };
  return icons[type as keyof typeof icons] || <Clock className="h-5 w-5 text-gray-400" />;
};

export const RecentActivity: React.FC = () => {
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'campaign_sent',
      title: 'Campaign "Q4 Product Updates" sent',
      description: 'Delivered to 15,247 recipients',
      timestamp: '2 minutes ago',
      user: 'Sarah Johnson',
    },
    {
      id: '2',
      type: 'contact_imported',
      title: 'Contacts imported from CSV',
      description: '2,451 new contacts added to "Enterprise Leads" list',
      timestamp: '15 minutes ago',
      user: 'Michael Chen',
    },
    {
      id: '3',
      type: 'template_created',
      title: 'New template created',
      description: '"Holiday Newsletter" template saved',
      timestamp: '1 hour ago',
      user: 'Sarah Johnson',
    },
    {
      id: '4',
      type: 'report_generated',
      title: 'Monthly report generated',
      description: 'October 2024 campaign performance report',
      timestamp: '2 hours ago',
      user: 'System',
    },
    {
      id: '5',
      type: 'campaign_sent',
      title: 'Campaign "Weekly Newsletter #42" sent',
      description: 'Delivered to 8,932 recipients',
      timestamp: '4 hours ago',
      user: 'Alex Rodriguez',
    },
  ];

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
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
        <a href="/activity" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          View all activity
        </a>
      </div>
    </div>
  );
};