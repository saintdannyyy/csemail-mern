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

  useEffect(() => {
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
    console.log('Selected template:', template);
    // You could navigate to the email editor with this template
    // navigate('/email-editor', { state: { template } });
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
          {activeTab === 'templates' && (
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
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              My Templates
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'library'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Template Library
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'library' ? (
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
        <div className="text-center py-8 text-gray-400">
          {searchTerm
            ? `No templates found matching "${searchTerm}"`
            : "No templates found. Create your first template to get started."}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
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
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
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
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      Loading templates...
                    </td>
                  </tr>
                ) : filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      No templates found.
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
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
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
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
    </div>
  );
};
