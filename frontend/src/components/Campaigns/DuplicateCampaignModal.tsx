import React, { useState } from "react";
import { X, Copy, Loader2 } from "lucide-react";
import { Campaign } from "../../types";

interface DuplicateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onCampaignDuplicated: (newCampaign: Campaign) => void;
}

export const DuplicateCampaignModal: React.FC<DuplicateCampaignModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onCampaignDuplicated,
}) => {
  const [newCampaignName, setNewCampaignName] = useState(`${campaign.name} (Copy)`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCampaignName.trim()) {
      setError("Campaign name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { apiClient } = await import("../../utils/apiClient");
      
      // Call the duplicate API endpoint
      const duplicatedCampaign = await apiClient.duplicateCampaign(campaign.id);
      
      // If the API doesn't support naming, update the campaign with the new name
      let finalCampaign = duplicatedCampaign;
      if (duplicatedCampaign.name === campaign.name && newCampaignName !== campaign.name) {
        finalCampaign = await apiClient.updateCampaign(duplicatedCampaign.id, {
          ...duplicatedCampaign,
          name: newCampaignName
        });
      }

      // Ensure proper ID mapping
      const mappedCampaign = {
        ...finalCampaign,
        id: finalCampaign._id || finalCampaign.id,
      };

      onCampaignDuplicated(mappedCampaign);
      onClose();
    } catch (error) {
      console.error("Failed to duplicate campaign:", error);
      setError(error instanceof Error ? error.message : "Failed to duplicate campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewCampaignName(`${campaign.name} (Copy)`);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Copy className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Duplicate Campaign</h2>
              <p className="text-sm text-gray-600">Create a copy of this campaign</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleDuplicate} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          {/* Original Campaign Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Original Campaign</h3>
            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Name:</span> {campaign.name}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Subject:</span> {campaign.subject}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Status:</span> 
                <span className="ml-1 capitalize">{campaign.status}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Recipients:</span> {campaign.totalRecipients.toLocaleString()}
              </div>
            </div>
          </div>

          {/* New Campaign Name */}
          <div className="mb-6">
            <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-2">
              New Campaign Name *
            </label>
            <input
              type="text"
              id="campaignName"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter name for the duplicated campaign"
              required
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              The duplicated campaign will have the same content and settings as the original
            </p>
          </div>

          {/* What will be copied */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <h4 className="text-sm font-medium text-blue-900 mb-2">What will be copied:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Campaign subject and content</li>
              <li>• From name and email settings</li>
              <li>• Reply-to email settings</li>
              <li>• HTML content and preheader</li>
              <li>• Recipient list assignments</li>
            </ul>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> The duplicated campaign will have a status of "draft" regardless of the original campaign's status.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newCampaignName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Duplicating...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Create Duplicate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};