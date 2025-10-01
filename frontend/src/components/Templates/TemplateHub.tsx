import React, { useState, useEffect } from "react";
import {
  Plus,
  Settings,
  TestTube,
  GitBranch,
  Upload,
  Download,
} from "lucide-react";
import { AdvancedEmailEditor } from "../EmailEditor/AdvancedEmailEditor";
import { TemplateTesting } from "./TemplateTesting";
import { TemplateManagement } from "./TemplateManagement";
import { apiClient } from "../../utils/apiClient";

interface TemplateHubProps {
  onTemplateCreate?: (template: any) => void;
  onTemplateUpdate?: (templateId: string, updates: any) => void;
}

export const TemplateHub: React.FC<TemplateHubProps> = ({
  onTemplateCreate,
  onTemplateUpdate,
}) => {
  const [activeView, setActiveView] = useState<
    "library" | "editor" | "testing" | "management"
  >("library");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates from API
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getTemplates();
      setTemplates(response || []);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load templates");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: any) => {
    try {
      const newTemplate = await apiClient.createTemplate(templateData);
      setTemplates((prev) => [...prev, newTemplate]);
      if (onTemplateCreate) {
        onTemplateCreate(newTemplate);
      }
      // Switch back to library view to see the new template
      setActiveView("library");
    } catch (err) {
      console.error("Error creating template:", err);
      setError("Failed to create template");
    }
  };

  const handleUpdateTemplate = async (templateId: string, updates: any) => {
    try {
      const updatedTemplate = await apiClient.updateTemplate(
        templateId,
        updates
      );
      setTemplates((prev) =>
        prev.map((t) => (t._id === templateId ? updatedTemplate : t))
      );
      setSelectedTemplate(updatedTemplate);
      if (onTemplateUpdate) {
        onTemplateUpdate(templateId, updatedTemplate);
      }
    } catch (err) {
      console.error("Error updating template:", err);
      setError("Failed to update template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await apiClient.deleteTemplate(templateId);
      setTemplates((prev) => prev.filter((t) => t._id !== templateId));
      if (selectedTemplate?._id === templateId) {
        setSelectedTemplate(null);
      }
    } catch (err) {
      console.error("Error deleting template:", err);
      setError("Failed to delete template");
    }
  };

  const ViewSelector = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {[
          { id: "library", label: "Template Library", icon: Plus },
          { id: "editor", label: "Email Editor", icon: Settings },
          { id: "testing", label: "Testing Tools", icon: TestTube },
          { id: "management", label: "Management", icon: GitBranch },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id as any)}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeView === id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Icon className="w-4 h-4 inline mr-2" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );

  const TemplateLibrary = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Library</h2>
          <p className="text-gray-600 mt-1">
            Choose from professional email templates or create your own
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveView("management")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setActiveView("editor");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchTemplates}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading templates...</span>
        </div>
      )}

      {/* Category Filter */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-2">
          {[
            "All",
            "Welcome",
            "Newsletter",
            "Promotional",
            "Transactional",
            "Announcement",
          ].map((category) => (
            <button
              key={category}
              className="px-4 py-2 rounded-full text-sm border border-gray-300 hover:bg-gray-50"
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Template Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 mb-4">No templates found</p>
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setActiveView("editor");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Template
              </button>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template._id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                  <img
                    src={template.thumbnailUrl || "/api/placeholder/300/200"}
                    alt={template.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {template.name}
                    </h3>
                    {template.isDefault && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="capitalize">{template.category}</span>
                    <span>
                      Modified{" "}
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setActiveView("editor");
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setActiveView("testing");
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template._id)}
                      className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <ViewSelector />

      {activeView === "library" && <TemplateLibrary />}
      {activeView === "editor" && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Email Editor</h2>
            <p className="text-gray-600 mt-1">
              {selectedTemplate
                ? `Editing: ${selectedTemplate.name}`
                : "Create a new email template"}
            </p>
          </div>
          <AdvancedEmailEditor
            content={
              selectedTemplate?.content || selectedTemplate?.htmlContent || ""
            }
            onChange={(newContent) => {
              // Update selectedTemplate content (local state only)
              if (selectedTemplate) {
                setSelectedTemplate({
                  ...selectedTemplate,
                  content: newContent,
                });
              }
            }}
            onSave={() => {
              if (selectedTemplate) {
                // Update existing template
                handleUpdateTemplate(selectedTemplate._id, selectedTemplate);
              } else {
                // Create new template - need to implement a form for template metadata
                const templateData = {
                  name: "New Template",
                  subject: "Template Subject",
                  content: selectedTemplate?.content || "",
                  category: "other",
                  description: "New template description",
                };
                handleCreateTemplate(templateData);
              }
            }}
          />
        </div>
      )}
      {activeView === "testing" && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Template Testing
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedTemplate
                ? `Testing: ${selectedTemplate.name}`
                : "Select a template to test"}
            </p>
          </div>
          <TemplateTesting
            templateContent={
              selectedTemplate?.content || selectedTemplate?.htmlContent || ""
            }
            templateSubject={selectedTemplate?.subject || ""}
            variables={selectedTemplate?.variables || {}}
          />
        </div>
      )}
      {activeView === "management" && (
        <div>
          <TemplateManagement />
        </div>
      )}
    </div>
  );
};
