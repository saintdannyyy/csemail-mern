import React, { useState, useEffect } from "react";
import { X, Plus, Edit, Trash2, Users } from "lucide-react";

interface ContactList {
  _id: string;
  name: string;
  description?: string;
  contactCount: number;
}

interface ContactListManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactListCreated?: (contactList: ContactList) => void;
  mode?: "select" | "manage"; // "select" for campaign modal, "manage" for full management
}

interface ContactListFormData {
  name: string;
  description: string;
}

export const ContactListManagerModal: React.FC<
  ContactListManagerModalProps
> = ({ isOpen, onClose, onContactListCreated, mode = "manage" }) => {
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingList, setEditingList] = useState<ContactList | null>(null);
  const [formData, setFormData] = useState<ContactListFormData>({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchContactLists();
    }
  }, [isOpen]);

  const fetchContactLists = async () => {
    try {
      setLoading(true);
      const response = await (
        await import("../../utils/apiClient")
      ).apiClient.getContactLists();
      setContactLists(response.lists || response || []);
    } catch (error) {
      console.error("Failed to fetch contact lists:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "List name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      if (editingList) {
        // Update existing list
        const updatedList = await (
          await import("../../utils/apiClient")
        ).apiClient.updateContactList(editingList._id, formData);

        setContactLists((lists) =>
          lists.map((list) =>
            list._id === editingList._id ? { ...list, ...formData } : list
          )
        );
      } else {
        // Create new list
        const newList = await (
          await import("../../utils/apiClient")
        ).apiClient.createContactList(formData);

        setContactLists((lists) => [...lists, newList]);

        if (onContactListCreated) {
          onContactListCreated(newList);
        }
      }

      // Reset form
      setFormData({ name: "", description: "" });
      setShowCreateForm(false);
      setEditingList(null);
      setErrors({});
    } catch (error) {
      console.error("Failed to save contact list:", error);
      setErrors({ submit: "Failed to save contact list. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (list: ContactList) => {
    setEditingList(list);
    setFormData({
      name: list.name,
      description: list.description || "",
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this contact list?")) return;

    try {
      setLoading(true);
      await (
        await import("../../utils/apiClient")
      ).apiClient.deleteContactList(listId);

      setContactLists((lists) => lists.filter((list) => list._id !== listId));
    } catch (error) {
      console.error("Failed to delete contact list:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingList(null);
    setFormData({ name: "", description: "" });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === "select" ? "Select Contact List" : "Manage Contact Lists"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-4">
                {editingList ? "Edit Contact List" : "Create New Contact List"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    List Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Newsletter Subscribers"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description for this contact list"
                    rows={3}
                  />
                </div>

                {errors.submit && (
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                )}

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading
                      ? "Saving..."
                      : editingList
                      ? "Update List"
                      : "Create List"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Contact Lists */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Contact Lists</h3>
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus size={16} />
                  <span>New List</span>
                </button>
              )}
            </div>

            {loading && contactLists.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading contact lists...</div>
              </div>
            ) : contactLists.length === 0 ? (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Contact Lists Yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first contact list to organize your contacts.
                </p>
                {!showCreateForm && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create First List
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {contactLists.map((list) => (
                  <div
                    key={list._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{list.name}</h4>
                      {list.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {list.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {list.contactCount} contact
                        {list.contactCount !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {mode === "manage" && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(list)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Edit list"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(list._id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Delete list"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            {mode === "select" ? "Done" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
