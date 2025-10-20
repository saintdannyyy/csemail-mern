import React, { useState } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Campaign } from "../../types";

interface DeleteCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onCampaignDeleted: (deletedCampaignId: string) => void;
}

export const DeleteCampaignModal: React.FC<DeleteCampaignModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onCampaignDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== campaign.name) {
      setError(
        "Campaign name doesn't match. Please type the exact campaign name to confirm deletion."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { apiClient } = await import("../../utils/apiClient");
      await apiClient.deleteCampaign(campaign.id);
      // Delete successful, no need to parse response body
      onCampaignDeleted(campaign.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete campaign"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const canDelete = confirmText === campaign.name;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Delete Campaign
              </h2>
              <p className="text-sm text-gray-600">
                This action cannot be undone
              </p>
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
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Warning
                  </h3>
                  <div className="text-sm text-yellow-700 mt-1">
                    {campaign.status === "sent" ? (
                      <p>
                        This campaign has already been sent to{" "}
                        {campaign.sentCount.toLocaleString()} recipients.
                        Deleting it will remove all associated analytics and
                        reports.
                      </p>
                    ) : campaign.status === "sending" ? (
                      <p>
                        <strong>This campaign is currently being sent!</strong>{" "}
                        Deleting it will stop the sending process and may cause
                        delivery issues.
                      </p>
                    ) : campaign.status === "scheduled" ? (
                      <p>
                        This campaign is scheduled to be sent. Deleting it will
                        cancel the scheduled send.
                      </p>
                    ) : (
                      <p>
                        You are about to permanently delete this campaign and
                        all its associated data.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Campaign Details:
              </h4>
              <dl className="text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Name:</dt>
                  <dd className="font-medium text-gray-900">{campaign.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Subject:</dt>
                  <dd className="font-medium text-gray-900">
                    {campaign.subject}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Status:</dt>
                  <dd className="font-medium text-gray-900 capitalize">
                    {campaign.status}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Recipients:</dt>
                  <dd className="font-medium text-gray-900">
                    {campaign.totalRecipients.toLocaleString()}
                  </dd>
                </div>
                {campaign.sentCount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Already Sent:</dt>
                    <dd className="font-medium text-gray-900">
                      {campaign.sentCount.toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {campaign.status === "sending" && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      <strong>Critical Warning:</strong> This campaign is
                      actively being sent. Deleting it now may cause delivery
                      failures and inconsistent data.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type the campaign name to confirm deletion:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={campaign.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Type "<span className="font-medium">{campaign.name}</span>" to
                enable the delete button
              </p>
            </div>
          </div>
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
          <button
            onClick={handleDelete}
            disabled={!canDelete || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Campaign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
