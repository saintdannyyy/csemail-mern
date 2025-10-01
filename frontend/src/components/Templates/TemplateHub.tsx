import React, { useState } from "react";
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
  const [templates] = useState([
    {
      id: "1",
      name: "Welcome Series - Onboarding",
      category: "welcome",
      description: "Professional welcome email template for new users",
      thumbnail: "/api/placeholder/300/200",
      lastModified: "2024-01-15",
      isDefault: true,
    },
    {
      id: "2",
      name: "Monthly Newsletter",
      category: "newsletter",
      description: "Clean newsletter template with sections for updates",
      thumbnail: "/api/placeholder/300/200",
      lastModified: "2024-01-14",
      isDefault: true,
    },
    {
      id: "3",
      name: "Product Launch Announcement",
      category: "promotional",
      description: "Eye-catching template for product launches",
      thumbnail: "/api/placeholder/300/200",
      lastModified: "2024-01-13",
      isDefault: true,
    },
  ]);

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
            onClick={() => setActiveView("editor")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </div>
      </div>

      {/* Category Filter */}
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

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-w-16 aspect-h-9 bg-gray-100">
              <img
                src={template.thumbnail}
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
                <span>Modified {template.lastModified}</span>
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
                <button className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
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
            template={selectedTemplate}
            onSave={(template) => {
              if (selectedTemplate) {
                onTemplateUpdate?.(selectedTemplate.id, template);
              } else {
                onTemplateCreate?.(template);
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
          <TemplateTesting templateId={selectedTemplate?.id} />
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
