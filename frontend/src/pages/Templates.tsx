import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

// Variable detection utility
const detectVariables = (
  content: string
): Array<{
  name: string;
  type: "text" | "email" | "url" | "number";
  required: boolean;
  defaultValue?: string;
  description?: string;
}> => {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const matches = content.match(variableRegex);
  if (!matches) return [];

  const uniqueVars = [
    ...new Set(matches.map((match) => match.replace(/[{}]/g, "").trim())),
  ];

  return uniqueVars.map((varName) => ({
    name: varName,
    type: varName.includes("email")
      ? "email"
      : varName.includes("url") || varName.includes("link")
      ? "url"
      : varName.includes("count") || varName.includes("number")
      ? "number"
      : "text",
    required: false,
    defaultValue: "",
    description: `Auto-detected variable: ${varName}`,
  }));
};

export const Templates: React.FC = () => {
  const navigate = useNavigate();
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
    // Navigate to email editor with selected template
    console.log("Using template for new email:", template);

    // Check if you have an email editor route, if not, copy the template
    try {
      // Option 1: Navigate to email editor (uncomment and update route as needed)
      navigate("/email-editor", { state: { template } });
    } catch (error) {
      // Fallback: Copy the template to user's templates
      console.warn("Email editor route not found, copying template instead");
      handleCopyTemplate(template);
      alert(`Template "${template.name}" copied to your templates!`);
    }
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

      // Auto-detect variables for the copied template
      const contentToAnalyze = `${template.subject || ""} ${
        template.content || template.htmlContent || ""
      }`;
      const detectedVariables = detectVariables(contentToAnalyze);

      // Merge with existing variables
      const existingVars = template.variables || [];
      const mergedVariables = detectedVariables.map((detected) => {
        const existing = existingVars.find((v) => v.name === detected.name);
        return existing ? { ...detected, ...existing } : detected;
      });

      const customVars = existingVars.filter(
        (existing) =>
          !detectedVariables.find((detected) => detected.name === existing.name)
      );

      const finalVariables = [...mergedVariables, ...customVars];

      // Only send the fields that the backend expects
      const newTemplate = {
        name: `${template.name} (Copy)`,
        subject: template.subject,
        content: template.content || template.htmlContent, // Use content field for backend
        description: template.description,
        category: template.category,
        tags: template.tags || [],
        variables: finalVariables,
        thumbnailUrl: template.thumbnailUrl,
        isDefault: false, // Copies are never default
      };

      const created = await apiClient.createTemplate(newTemplate);
      await fetchTemplates(); // Refresh the list
      console.log("Template copied with variables:", created);
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
      // Auto-detect variables from content and subject
      const contentToAnalyze = `${editingTemplate.subject || ""} ${
        editingTemplate.content || editingTemplate.htmlContent || ""
      }`;
      const detectedVariables = detectVariables(contentToAnalyze);

      // Merge with existing variables, keeping user customizations
      const existingVars = editingTemplate.variables || [];
      const mergedVariables = detectedVariables.map((detected) => {
        const existing = existingVars.find((v) => v.name === detected.name);
        return existing ? { ...detected, ...existing } : detected;
      });

      // Add any existing variables that weren't detected (custom ones)
      const customVars = existingVars.filter(
        (existing) =>
          !detectedVariables.find((detected) => detected.name === existing.name)
      );

      const finalVariables = [...mergedVariables, ...customVars];

      const { apiClient } = await import("../utils/apiClient");
      const updatedTemplate = await apiClient.updateTemplate(
        editingTemplate._id || editingTemplate.id,
        {
          ...editingTemplate,
          variables: finalVariables,
        }
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
      console.log("Template updated with variables:", updatedTemplate);
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
                        {template.createdAt
                          ? new Date(template.createdAt).toLocaleDateString()
                          : "Unknown"}
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
                            {template.createdAt
                              ? new Date(
                                  template.createdAt
                                ).toLocaleDateString()
                              : "Unknown"}
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
                        prev
                          ? {
                              ...prev,
                              category: e.target
                                .value as EmailTemplate["category"],
                            }
                          : null
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
                {/* Top Section - Template Info in Horizontal Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Template Details Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Template Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</span>
                        <p className="text-sm text-gray-900 mt-1 font-medium">
                          {viewingTemplate.subject}
                        </p>
                      </div>
                      {viewingTemplate.description && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</span>
                          <p className="text-sm text-gray-700 mt-1">
                            {viewingTemplate.description}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</span>
                        <div className="mt-1">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                            {viewingTemplate.category}
                          </span>
                        </div>
                      </div>
                      {viewingTemplate.tags && viewingTemplate.tags.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {viewingTemplate.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statistics Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Statistics
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Times Used</span>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          {viewingTemplate.timesUsed || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</span>
                        <p className="text-sm text-gray-700 mt-1">
                          {viewingTemplate.createdAt
                            ? new Date(viewingTemplate.createdAt).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Modified</span>
                        <p className="text-sm text-gray-700 mt-1">
                          {viewingTemplate.updatedAt
                            ? new Date(viewingTemplate.updatedAt).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                      {viewingTemplate.isDefault && (
                        <div className="pt-2">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            ⭐ Default Template
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Variables Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M11 7l1.5 1.5" />
                      </svg>
                      Variables ({viewingTemplate.variables?.length || 0})
                    </h4>
                    {viewingTemplate.variables && viewingTemplate.variables.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {viewingTemplate.variables.map((variable, index) => (
                          <div key={index} className="bg-orange-50 border border-orange-200 rounded p-2">
                            <code className="text-xs font-mono text-orange-800 block">
                              {`{{${variable.name}}}`}
                            </code>
                            {variable.description && (
                              <p className="text-xs text-orange-600 mt-1">
                                {variable.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No variables defined</p>
                    )}
                  </div>
                </div>

                {/* Main Content - Email Preview */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Preview
                    </h4>
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors">
                        View HTML Source
                      </summary>
                      <div className="absolute right-0 mt-2 w-96 z-10 bg-gray-900 text-gray-100 p-4 rounded-lg shadow-xl border">
                        <pre className="text-xs whitespace-pre-wrap max-h-64 overflow-auto">
                          {viewingTemplate.content || viewingTemplate.htmlContent || "No content available"}
                        </pre>
                      </div>
                    </details>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
                    {/* Email Header */}
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-600">Subject:</span>
                          <span className="text-sm text-gray-900 ml-2 font-medium">{viewingTemplate.subject}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Preview</span>
                        </div>
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className="bg-white">
                      <iframe
                        srcDoc={viewingTemplate.content || viewingTemplate.htmlContent || ""}
                        className="w-full h-[500px] border-0"
                        title="Email Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                </div>
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
