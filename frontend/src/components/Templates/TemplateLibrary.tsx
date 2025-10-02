import React, { useState, useEffect } from "react";
import {
  Grid,
  Search,
  Eye,
  Copy,
  Star,
  Tag,
  Clock,
  User,
  Download,
} from "lucide-react";
import { apiClient } from "../../utils/apiClient";

interface TemplateVariable {
  name: string;
  type: "text" | "email" | "url" | "number" | "textarea";
  defaultValue: string;
  required: boolean;
  description: string;
}

interface TemplateLibraryItem {
  _id: string;
  name: string;
  category: string;
  tags: string[];
  subject: string;
  content: string;
  variables: TemplateVariable[];
  metadata: {
    createdBy: string;
    industry: string;
    difficulty: string;
    estimatedTime: string;
  };
}

interface TemplateLibraryProps {
  onTemplateSelect: (template: TemplateLibraryItem) => void;
}

const CATEGORIES = [
  { value: "all", label: "All Categories", icon: "📧" },
  { value: "welcome", label: "Welcome", icon: "👋" },
  { value: "newsletter", label: "Newsletter", icon: "📰" },
  { value: "promotional", label: "Promotional", icon: "🎉" },
  { value: "transactional", label: "Transactional", icon: "📋" },
  { value: "announcement", label: "Announcement", icon: "📢" },
];

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onTemplateSelect,
}) => {
  const [templates, setTemplates] = useState<
    Record<string, TemplateLibraryItem[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewTemplate, setPreviewTemplate] =
    useState<TemplateLibraryItem | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const category =
        selectedCategory === "all" ? undefined : selectedCategory;
      const data = await apiClient.getTemplateLibrary(category);
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const seedTemplates = async () => {
    try {
      setSeeding(true);
      const result = await apiClient.seedTemplates(true); // Force seed
      console.log("Seeding result:", result);
      await fetchTemplates(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed templates");
    } finally {
      setSeeding(false);
    }
  };

  const cloneTemplate = async (template: TemplateLibraryItem) => {
    try {
      // Use the create template endpoint with modified data
      const templateData = {
        name: `${template.name} (My Copy)`,
        subject: template.subject,
        content: template.content,
        category: template.category,
        description: `Copy of ${template.name}`,
        tags: template.tags,
        variables: template.variables,
      };

      const clonedTemplate = await apiClient.createTemplate(templateData);
      onTemplateSelect(clonedTemplate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clone template");
    }
  };

  const filteredTemplates = () => {
    const allTemplates = Object.values(templates).flat();
    return allTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  };

  const TemplateCard: React.FC<{ template: TemplateLibraryItem }> = ({
    template,
  }) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {template.subject}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {CATEGORIES.find((c) => c.value === template.category)?.icon}{" "}
              {template.category}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              +{template.tags.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{template.metadata.difficulty}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{template.metadata.estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            <span>{template.variables.length} variables</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setPreviewTemplate(template)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => cloneTemplate(template)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            <Copy className="w-4 h-4" />
            Use Template
          </button>
        </div>
      </div>
    </div>
  );

  const PreviewModal: React.FC = () => {
    if (!previewTemplate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold">{previewTemplate.name}</h3>
              <p className="text-sm text-gray-600">{previewTemplate.subject}</p>
            </div>
            <button
              onClick={() => setPreviewTemplate(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="flex max-h-[calc(90vh-8rem)]">
            <div className="w-1/3 p-4 border-r overflow-y-auto">
              <h4 className="font-semibold mb-3">Template Variables</h4>
              <div className="space-y-3">
                {previewTemplate.variables.map((variable, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">
                        {variable.name}
                      </span>
                      {variable.required && (
                        <span className="text-red-500 text-xs">*</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {variable.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      Type: {variable.type} | Default: {variable.defaultValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <h4 className="font-semibold mb-3">Email Preview</h4>
              <div
                className="border rounded p-4 bg-gray-50 min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: previewTemplate.content }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4 border-t">
            <button
              onClick={() => setPreviewTemplate(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
            <button
              onClick={() => {
                cloneTemplate(previewTemplate);
                setPreviewTemplate(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Library</h1>
          <p className="text-gray-600">
            Choose from professionally designed email templates
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={seedTemplates}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {seeding ? "Seeding..." : "Seed Templates"}
          </button>
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === category.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {Object.keys(templates).length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Download className="w-12 h-12 mx-auto mb-2" />
            <p>No templates found in the library.</p>
            <p className="text-sm">
              Click "Seed Templates" to load predefined templates.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`grid ${
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          } gap-6`}
        >
          {filteredTemplates().map((template) => (
            <TemplateCard key={template._id} template={template} />
          ))}
        </div>
      )}

      <PreviewModal />
    </div>
  );
};

export default TemplateLibrary;
