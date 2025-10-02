import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Copy,
  Trash2,
  Grid,
  List,
  BookOpen,
  FileText,
} from "lucide-react";
import { EmailTemplate } from "../types";
import TemplateLibrary from "../components/Templates/TemplateLibrary";

export const Templates: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"templates" | "library">(
    "templates"
  );

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState<boolean>(false);

  // Template editing state
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Template viewing state
  const [viewingTemplate, setViewingTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [showViewModal, setShowViewModal] = useState<boolean>(false);

  // Template deletion state
  const [deletingTemplate, setDeletingTemplate] =
    useState<EmailTemplate | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await (
        await import("../utils/apiClient")
      ).apiClient.getTemplates();
      setTemplates(response.templates || response || []);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch templates");
      setTemplates([]);
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const seedTemplates = async () => {
    setSeeding(true);
    try {
      await (await import("../utils/apiClient")).apiClient.seedTemplates();
      // Refresh templates after seeding
      await fetchTemplates();
    } catch (err: any) {
      setError(err?.message || "Failed to seed templates");
      console.error("Failed to seed templates:", err);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description &&
        template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleTemplateSelect = (template: any) => {
    // Handle template selection from library - could navigate to editor
    console.log("Selected template:", template);
    // You could navigate to the email editor with this template
    // navigate('/email-editor', { state: { template } });
  };

  const handleViewTemplate = (template: EmailTemplate) => {
    // Open template in view mode
    setViewingTemplate(template);
    setShowViewModal(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    // Open template in edit mode
    setEditingTemplate({ ...template });
    setShowEditModal(true);
  };

  const handleCopyTemplate = async (template: EmailTemplate) => {
    try {
      const { apiClient } = await import("../utils/apiClient");
      const newTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        isDefault: false,
      };
      delete newTemplate.id;
      delete newTemplate._id;
      delete newTemplate.createdAt;
      delete newTemplate.updatedAt;

      const created = await apiClient.createTemplate(newTemplate);
      await fetchTemplates(); // Refresh the list
      console.log("Template copied:", created);
    } catch (error) {
      console.error("Failed to copy template:", error);
      setError("Failed to copy template");
    }
  };

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    setDeletingTemplate(template);
    setShowDeleteModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      const { apiClient } = await import("../utils/apiClient");
      const updatedTemplate = await apiClient.updateTemplate(
        editingTemplate._id || editingTemplate.id,
        editingTemplate
      );

      // Update the template in the local state
      setTemplates((prev) =>
        prev.map((t) =>
          (t._id || t.id) === (editingTemplate._id || editingTemplate.id)
            ? updatedTemplate
            : t
        )
      );

      setShowEditModal(false);
      setEditingTemplate(null);
      console.log("Template updated:", updatedTemplate);
    } catch (error) {
      console.error("Failed to update template:", error);
      setError("Failed to update template");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setShowEditModal(false);
  };

  const handleCloseView = () => {
    setViewingTemplate(null);
    setShowViewModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;

    setDeleting(true);
    try {
      const { apiClient } = await import("../utils/apiClient");
      await apiClient.deleteTemplate(
        deletingTemplate._id || deletingTemplate.id
      );
      await fetchTemplates(); // Refresh the list
      setShowDeleteModal(false);
      setDeletingTemplate(null);
    } catch (error) {
      console.error("Failed to delete template:", error);
      setError("Failed to delete template");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingTemplate(null);
    setShowDeleteModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Email Templates
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Create and manage reusable email templates
            </p>
          </div>
          {activeTab === "templates" && (
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("templates")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "templates"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              My Templates
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "library"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Template Library
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "library" ? (
        <TemplateLibrary onTemplateSelect={handleTemplateSelect} />
      ) : (
        <>
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className={`p-2 rounded-md ${
                    viewMode === "grid"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  className={`p-2 rounded-md ${
                    viewMode === "list"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                {error}
              </div>
              <button
                onClick={() => {
                  setError(null);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Retry
              </button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No templates found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? `No templates found matching "${searchTerm}"`
                  : "No templates found in the library."}
              </p>
              {!searchTerm && (
                <div className="space-y-3">
                  <button
                    onClick={seedTemplates}
                    disabled={seeding}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {seeding ? (
                      <>
                        <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Seeding Templates...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Seed Templates
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-500">
                    Click "Seed Templates" to load predefined templates.
                  </p>
                </div>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template, index) => (
                <div
                  key={template.id || template._id || `template-${index}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {template.thumbnailUrl ? (
                      <img
                        src={template.thumbnailUrl}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📧</div>
                          <div className="text-sm">No Preview</div>
                        </div>
                      </div>
                    )}
                    {template.isDefault && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Default
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        Created{" "}
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewTemplate(template)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View template"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit template"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCopyTemplate(template)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Copy template"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-gray-400"
                        >
                          Loading templates...
                        </td>
                      </tr>
                    ) : filteredTemplates.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-gray-400"
                        >
                          No templates found.
                        </td>
                      </tr>
                    ) : (
                      filteredTemplates.map((template, index) => (
                        <tr
                          key={
                            template.id ||
                            template._id ||
                            `template-list-${index}`
                          }
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-16">
                                {template.thumbnailUrl ? (
                                  <img
                                    className="h-12 w-16 object-cover rounded"
                                    src={template.thumbnailUrl}
                                    alt=""
                                  />
                                ) : (
                                  <div className="h-12 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                                    No Preview
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {template.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {template.description || "No description"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {template.isDefault ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Default
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Custom
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewTemplate(template)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View template"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditTemplate(template)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit template"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleCopyTemplate(template)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Copy template"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete template"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Template Edit Modal */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Template
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.name || ""}
                    onChange={(e) =>
                      setEditingTemplate((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.subject || ""}
                    onChange={(e) =>
                      setEditingTemplate((prev) =>
                        prev ? { ...prev, subject: e.target.value } : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingTemplate.description || ""}
                    onChange={(e) =>
                      setEditingTemplate((prev) =>
                        prev ? { ...prev, description: e.target.value } : null
                      )
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter template description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editingTemplate.category || "other"}
                    onChange={(e) =>
                      setEditingTemplate((prev) =>
                        prev ? { ...prev, category: e.target.value } : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="welcome">Welcome</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="promotional">Promotional</option>
                    <option value="transactional">Transactional</option>
                    <option value="announcement">Announcement</option>
                    <option value="reminder">Reminder</option>
                    <option value="survey">Survey</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Content (HTML)
                  </label>
                  <textarea
                    value={
                      editingTemplate.content ||
                      editingTemplate.htmlContent ||
                      ""
                    }
                    onChange={(e) =>
                      setEditingTemplate((prev) =>
                        prev ? { ...prev, content: e.target.value } : null
                      )
                    }
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="Enter HTML content for the email template"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={
                    saving || !editingTemplate.name || !editingTemplate.subject
                  }
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Template"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template View Modal */}
      {showViewModal && viewingTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-gray-900">
                  {viewingTemplate.name}
                </h3>
                <button
                  onClick={handleCloseView}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Template Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Template Details
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Subject:
                        </span>
                        <p className="text-sm text-gray-900 mt-1">
                          {viewingTemplate.subject}
                        </p>
                      </div>
                      {viewingTemplate.description && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Description:
                          </span>
                          <p className="text-sm text-gray-900 mt-1">
                            {viewingTemplate.description}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Category:
                        </span>
                        <span className="inline-block ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                          {viewingTemplate.category}
                        </span>
                      </div>
                      {viewingTemplate.tags &&
                        viewingTemplate.tags.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              Tags:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {viewingTemplate.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-block px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Template Statistics
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Times Used:
                        </span>
                        <p className="text-sm text-gray-900 mt-1">
                          {viewingTemplate.timesUsed || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Created:
                        </span>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(
                            viewingTemplate.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Last Modified:
                        </span>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(
                            viewingTemplate.updatedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      {viewingTemplate.isDefault && (
                        <div>
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Default Template
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email Content Preview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Email Content Preview
                  </h4>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    {/* Email Header */}
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                      <div className="text-sm text-gray-600">
                        <strong>Subject:</strong> {viewingTemplate.subject}
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className="bg-white">
                      <iframe
                        srcDoc={
                          viewingTemplate.content ||
                          viewingTemplate.htmlContent ||
                          ""
                        }
                        className="w-full h-96 border-0"
                        title="Email Preview"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    </div>
                  </div>
                </div>

                {/* Raw HTML (collapsible) */}
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    View Raw HTML
                  </summary>
                  <div className="mt-2 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {viewingTemplate.content ||
                        viewingTemplate.htmlContent ||
                        "No content available"}
                    </pre>
                  </div>
                </details>
              </div>

              <div className="mt-8 flex justify-between">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      handleCloseView();
                      handleEditTemplate(viewingTemplate);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Template
                  </button>
                  <button
                    onClick={() => {
                      handleCloseView();
                      handleCopyTemplate(viewingTemplate);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Copy Template
                  </button>
                </div>
                <button
                  onClick={handleCloseView}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Delete Confirmation Modal */}
      {showDeleteModal && deletingTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Template
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete "
                  <strong>{deletingTemplate.name}</strong>"? This action cannot
                  be undone.
                </p>
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Template"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
