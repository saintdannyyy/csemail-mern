import React, { useState } from "react";
import { X, Send, Clock, AlertTriangle, Loader2, Users, Mail } from "lucide-react";
import { Campaign } from "../../types";

interface SendCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onCampaignSent: (updatedCampaign: Campaign) => void;
}

export const SendCampaignModal: React.FC<SendCampaignModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onCampaignSent,
}) => {
  const [sendOption, setSendOption] = useState<'now' | 'scheduled'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setError(null);

    try {
      const { apiClient } = await import("../../utils/apiClient");
      
      let updatedCampaign;
      if (sendOption === 'now') {
        updatedCampaign = await apiClient.sendCampaign(campaign.id);
      } else {
        // For scheduled sending, we would update the campaign with the scheduled date
        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
        updatedCampaign = await apiClient.updateCampaign(campaign.id, {
          ...campaign,
          scheduledAt: scheduledAt.toISOString(),
          status: 'scheduled'
        });
      }

      // Ensure proper ID mapping
      const mappedCampaign = {
        ...updatedCampaign,
        id: updatedCampaign._id || updatedCampaign.id || campaign.id,
      };

      onCampaignSent(mappedCampaign);
      onClose();
    } catch (error) {
      console.error("Failed to send campaign:", error);
      setError(error instanceof Error ? error.message : "Failed to send campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSendOption('now');
    setScheduledDate('');
    setScheduledTime('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const canSend = campaign.status === 'draft' || campaign.status === 'paused';
  const now = new Date();
  const minDate = now.toISOString().split('T')[0];
  const minTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Send Campaign</h2>
              <p className="text-sm text-gray-600">Ready to launch your campaign?</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          {!canSend ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Cannot Send Campaign</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    This campaign cannot be sent because its status is "{campaign.status}". 
                    Only draft or paused campaigns can be sent.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Campaign Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Campaign Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Campaign Name</span>
                    <span className="text-sm font-medium text-gray-900">{campaign.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subject Line</span>
                    <span className="text-sm font-medium text-gray-900">{campaign.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">From</span>
                    <span className="text-sm font-medium text-gray-900">{campaign.fromName} &lt;{campaign.fromEmail}&gt;</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Recipients
                    </span>
                    <span className="text-sm font-bold text-blue-600">{campaign.totalRecipients.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Send Options */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-medium text-gray-900">When would you like to send this campaign?</h3>
                
                {/* Send Now Option */}
                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="sendOption"
                    value="now"
                    checked={sendOption === 'now'}
                    onChange={(e) => setSendOption(e.target.value as 'now' | 'scheduled')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Send Now</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Campaign will be sent immediately to all recipients
                    </p>
                  </div>
                </label>

                {/* Schedule Option */}
                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="sendOption"
                    value="scheduled"
                    checked={sendOption === 'scheduled'}
                    onChange={(e) => setSendOption(e.target.value as 'now' | 'scheduled')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Schedule for Later</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 mb-3">
                      Choose a specific date and time for sending
                    </p>
                    
                    {sendOption === 'scheduled' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={minDate}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                          <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            min={scheduledDate === minDate ? minTime : undefined}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Warning for large lists */}
              {campaign.totalRecipients > 1000 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Large Recipient List</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        This campaign will be sent to {campaign.totalRecipients.toLocaleString()} recipients. 
                        Large campaigns may take some time to process and deliver.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          {canSend && (
            <button
              onClick={handleSend}
              disabled={loading || (sendOption === 'scheduled' && (!scheduledDate || !scheduledTime))}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {sendOption === 'now' ? 'Sending...' : 'Scheduling...'}
                </>
              ) : (
                <>
                  {sendOption === 'now' ? (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Campaign
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Schedule Campaign
                    </>
                  )}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};