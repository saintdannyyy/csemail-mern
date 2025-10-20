import React from "react";
import { X, Eye, Mail, Clock, Users, BarChart3 } from "lucide-react";
import { Campaign } from "../../types";

interface CampaignPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
}

export const CampaignPreviewModal: React.FC<CampaignPreviewModalProps> = ({
  isOpen,
  onClose,
  campaign,
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: Campaign["status"]) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      sending: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      paused: "bg-red-100 text-red-800",
    };
    return colors[status];
  };

  const getOpenRate = (campaign: Campaign) => {
    if (campaign.sentCount === 0) return "0%";
    return `${((campaign.openedCount / campaign.sentCount) * 100).toFixed(1)}%`;
  };

  const getClickRate = (campaign: Campaign) => {
    if (campaign.sentCount === 0) return "0%";
    return `${((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1)}%`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">Campaign Preview</h2>
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
        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
          {/* Left Panel - Campaign Info */}
          <div className="lg:w-1/3 p-6 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  Campaign Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</span>
                    <p className="text-sm text-gray-900 mt-1 font-medium">{campaign.subject}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">From</span>
                    <p className="text-sm text-gray-900 mt-1">{campaign.fromName} &lt;{campaign.fromEmail}&gt;</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reply-To</span>
                    <p className="text-sm text-gray-900 mt-1">{campaign.replyToEmail}</p>
                  </div>
                  {campaign.preheader && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preheader</span>
                      <p className="text-sm text-gray-700 mt-1">{campaign.preheader}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recipients */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-green-600" />
                  Recipients
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Recipients</span>
                    <span className="text-sm font-medium text-gray-900">{campaign.totalRecipients.toLocaleString()}</span>
                  </div>
                  {campaign.sentCount > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Sent</span>
                        <span className="text-sm font-medium text-gray-900">{campaign.sentCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Delivered</span>
                        <span className="text-sm font-medium text-gray-900">{campaign.deliveredCount.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Performance Stats */}
              {campaign.sentCount > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2 text-purple-600" />
                    Performance
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Open Rate</span>
                        <span className="text-lg font-bold text-blue-600">{getOpenRate(campaign)}</span>
                      </div>
                      <div className="text-xs text-gray-500">{campaign.openedCount.toLocaleString()} opens</div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Click Rate</span>
                        <span className="text-lg font-bold text-green-600">{getClickRate(campaign)}</span>
                      </div>
                      <div className="text-xs text-gray-500">{campaign.clickedCount.toLocaleString()} clicks</div>
                    </div>
                    {campaign.bouncedCount > 0 && (
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Bounced</span>
                          <span className="text-sm font-medium text-red-600">{campaign.bouncedCount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    {campaign.unsubscribedCount > 0 && (
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Unsubscribed</span>
                          <span className="text-sm font-medium text-orange-600">{campaign.unsubscribedCount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timing */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-orange-600" />
                  Timing
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm text-gray-900">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>
                  {campaign.scheduledAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Scheduled</span>
                      <span className="text-sm text-gray-900">{new Date(campaign.scheduledAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {campaign.sentAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sent</span>
                      <span className="text-sm text-gray-900">{new Date(campaign.sentAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm text-gray-900">{new Date(campaign.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Email Preview */}
          <div className="lg:w-2/3 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                Email Preview
              </h3>
            </div>
            
            <div className="flex-1 bg-white overflow-hidden">
              <div className="border border-gray-200 rounded-lg m-6 overflow-hidden shadow-sm h-full">
                {/* Email Header */}
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Subject: {campaign.subject}</div>
                      <div className="text-sm text-gray-600">From: {campaign.fromName} &lt;{campaign.fromEmail}&gt;</div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div className="bg-white flex-1 overflow-hidden">
                  <iframe
                    srcDoc={campaign.htmlContent}
                    className="w-full h-full min-h-[400px] border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};