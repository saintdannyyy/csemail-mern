import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  Mail, 
  Eye, 
  MousePointer, 
  AlertTriangle,
  Users,
  Send
} from 'lucide-react';

interface DashboardStats {
  totalCampaigns: number;
  emailsSent: number;
  emailsDelivered: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsBounced: number;
  totalContacts: number;
  suppressedContacts: number;
  openRate: string;
  clickRate: string;
  bounceRate: string;
}

interface DailyPerformance {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

interface CampaignReport {
  id: string;
  name: string;
  subject: string;
  status: string;
  sentAt: string;
  totalRecipients: number;
  deliveryRate: string;
  openRate: string;
  clickRate: string;
  bounceRate: string;
}

export const Reports: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyPerformance, setDailyPerformance] = useState<DailyPerformance[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignReport[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportsData();
  }, [selectedPeriod]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      // Simulate API calls - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setStats({
        totalCampaigns: 127,
        emailsSent: 2543892,
        emailsDelivered: 2521045,
        emailsOpened: 630261,
        emailsClicked: 126052,
        emailsBounced: 22847,
        totalContacts: 98453,
        suppressedContacts: 892,
        openRate: '25.0',
        clickRate: '5.0',
        bounceRate: '0.9'
      });

      setDailyPerformance([
        { date: '2024-01-01', sent: 15000, opened: 3750, clicked: 562 },
        { date: '2024-01-02', sent: 18000, opened: 4680, clicked: 702 },
        { date: '2024-01-03', sent: 12000, opened: 3000, clicked: 450 },
        { date: '2024-01-04', sent: 22000, opened: 5940, clicked: 891 },
        { date: '2024-01-05', sent: 16000, opened: 4000, clicked: 640 },
        { date: '2024-01-06', sent: 20000, opened: 5400, clicked: 810 },
        { date: '2024-01-07', sent: 14000, opened: 3640, clicked: 546 }
      ]);

      setCampaigns([
        {
          id: '1',
          name: 'Q4 Product Updates',
          subject: 'Exciting New Features Coming Your Way!',
          status: 'sent',
          sentAt: '2024-01-20T09:00:00Z',
          totalRecipients: 15247,
          deliveryRate: '99.0',
          openRate: '25.2',
          clickRate: '3.8',
          bounceRate: '1.0'
        },
        {
          id: '2',
          name: 'Weekly Newsletter #42',
          subject: 'This Week in Software Engineering',
          status: 'sent',
          sentAt: '2024-01-19T10:00:00Z',
          totalRecipients: 8932,
          deliveryRate: '98.5',
          openRate: '28.1',
          clickRate: '4.2',
          bounceRate: '1.5'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (type: 'dashboard' | 'campaigns') => {
    // Simulate export functionality
    const data = type === 'dashboard' ? { stats, dailyPerformance } : campaigns;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive email campaign performance and system analytics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <button
              onClick={() => exportReport('dashboard')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-md p-3">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Campaigns</dt>
                <dd className="text-2xl font-semibold text-gray-900">{stats?.totalCampaigns.toLocaleString()}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-md p-3">
              <Send className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Emails Sent</dt>
                <dd className="text-2xl font-semibold text-gray-900">{stats?.emailsSent.toLocaleString()}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-indigo-500 rounded-md p-3">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Open Rate</dt>
                <dd className="text-2xl font-semibold text-gray-900">{stats?.openRate}%</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-md p-3">
              <MousePointer className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Click Rate</dt>
                <dd className="text-2xl font-semibold text-gray-900">{stats?.clickRate}%</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Performance Trends</h3>
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
              {dailyPerformance.map((data, index) => {
                const maxValue = Math.max(...dailyPerformance.map(d => d.sent));
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
                        {new Date(data.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
            <button
              onClick={() => exportReport('campaigns')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Click Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bounce Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.name}
                      </div>
                      <div className="text-sm text-gray-500">{campaign.subject}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.totalRecipients.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{campaign.deliveryRate}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${campaign.deliveryRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{campaign.openRate}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${campaign.openRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{campaign.clickRate}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${parseFloat(campaign.clickRate) * 5}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{campaign.bounceRate}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${parseFloat(campaign.bounceRate) * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(campaign.sentAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};