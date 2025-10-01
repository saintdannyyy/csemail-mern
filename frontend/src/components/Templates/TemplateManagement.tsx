import React, { useState, useRef } from "react";
import {
  Upload,
  Download,
  Share2,
  GitBranch,
  Users,
  FileText,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";

interface TemplateVersion {
  id: string;
  version: number;
  createdAt: string;
  createdBy: string;
  changes: string;
  isPublished: boolean;
}

interface TemplateShare {
  id: string;
  sharedWith: string;
  permission: "view" | "edit";
  sharedAt: string;
}

interface TemplateManagementProps {
  templateId?: string;
  onTemplateSelect?: (templateId: string) => void;
}

export const TemplateManagement: React.FC<TemplateManagementProps> = () => {
  const [activeTab, setActiveTab] = useState<
    "versions" | "sharing" | "import" | "export"
  >("versions");
  const [versions, setVersions] = useState<TemplateVersion[]>([
    {
      id: "v1",
      version: 1,
      createdAt: "2024-01-15T10:00:00Z",
      createdBy: "John Doe",
      changes: "Initial template creation",
      isPublished: true,
    },
    {
      id: "v2",
      version: 2,
      createdAt: "2024-01-16T14:30:00Z",
      createdBy: "Jane Smith",
      changes: "Updated header design and color scheme",
      isPublished: false,
    },
    {
      id: "v3",
      version: 3,
      createdAt: "2024-01-17T09:15:00Z",
      createdBy: "John Doe",
      changes: "Added social media links and improved mobile responsiveness",
      isPublished: true,
    },
  ]);

  const [shares, setShares] = useState<TemplateShare[]>([
    {
      id: "s1",
      sharedWith: "marketing@company.com",
      permission: "edit",
      sharedAt: "2024-01-15T12:00:00Z",
    },
    {
      id: "s2",
      sharedWith: "design@company.com",
      permission: "view",
      sharedAt: "2024-01-16T10:00:00Z",
    },
  ]);

  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState<"view" | "edit">(
    "view"
  );
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "html" | "zip">(
    "json"
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createVersion = async (changes: string) => {
    const newVersion: TemplateVersion = {
      id: `v${versions.length + 1}`,
      version: versions.length + 1,
      createdAt: new Date().toISOString(),
      createdBy: "Current User",
      changes,
      isPublished: false,
    };

    setVersions((prev) => [...prev, newVersion]);
  };

  const publishVersion = async (versionId: string) => {
    setVersions((prev) =>
      prev.map((v) => ({
        ...v,
        isPublished: v.id === versionId ? true : v.isPublished,
      }))
    );
  };

  const shareTemplate = async () => {
    if (!shareEmail.trim()) return;

    const newShare: TemplateShare = {
      id: `s${shares.length + 1}`,
      sharedWith: shareEmail,
      permission: sharePermission,
      sharedAt: new Date().toISOString(),
    };

    setShares((prev) => [...prev, newShare]);
    setShareEmail("");
  };

  const removeShare = async (shareId: string) => {
    setShares((prev) => prev.filter((s) => s.id !== shareId));
  };

  const importTemplate = async () => {
    if (!importFile) return;

    setImporting(true);
    try {
      const text = await importFile.text();

      if (importFile.type === "application/json") {
        const templateData = JSON.parse(text);
        console.log("Importing template:", templateData);
        // Handle JSON template import
      } else if (importFile.type === "text/html") {
        console.log("Importing HTML template:", text);
        // Handle HTML template import
      }

      // Simulate import process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setImportFile(null);
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setImporting(false);
    }
  };

  const exportTemplate = async () => {
    setExporting(true);
    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const templateData = {
        name: "Sample Template",
        version: "1.0.0",
        content: "<html>...</html>",
        variables: [],
        metadata: {
          exportedAt: new Date().toISOString(),
          format: exportFormat,
        },
      };

      let blob: Blob;
      let filename: string;

      switch (exportFormat) {
        case "json":
          blob = new Blob([JSON.stringify(templateData, null, 2)], {
            type: "application/json",
          });
          filename = "template.json";
          break;
        case "html":
          blob = new Blob([templateData.content], { type: "text/html" });
          filename = "template.html";
          break;
        case "zip":
          // In a real implementation, you'd create a ZIP file with multiple assets
          blob = new Blob([JSON.stringify(templateData, null, 2)], {
            type: "application/zip",
          });
          filename = "template.zip";
          break;
        default:
          return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const VersionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
        <button
          onClick={() => {
            const changes = prompt("Describe the changes in this version:");
            if (changes) createVersion(changes);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <GitBranch className="w-4 h-4" />
          Create Version
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <GitBranch className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Version Control</h4>
            <p className="text-sm text-blue-700 mt-1">
              Track changes to your templates over time. Create new versions
              when making significant updates.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {versions.map((version) => (
          <div
            key={version.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    version.isPublished
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  v{version.version}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Version {version.version}
                  </h4>
                  <p className="text-sm text-gray-600">
                    by {version.createdBy} •{" "}
                    {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {version.isPublished && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Published
                  </span>
                )}
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Eye className="w-4 h-4" />
                </button>
                {!version.isPublished && (
                  <button
                    onClick={() => publishVersion(version.id)}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-700">{version.changes}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const SharingTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Template Sharing</h3>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">
          Share with Team Members
        </h4>
        <div className="flex gap-4">
          <input
            type="email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={sharePermission}
            onChange={(e) =>
              setSharePermission(e.target.value as "view" | "edit")
            }
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="view">View Only</option>
            <option value="edit">Can Edit</option>
          </select>
          <button
            onClick={shareTemplate}
            disabled={!shareEmail.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Current Shares</h4>
        {shares.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>This template hasn't been shared yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {share.sharedWith}
                    </p>
                    <p className="text-sm text-gray-600">
                      {share.permission === "edit" ? "Can edit" : "View only"} •
                      Shared {new Date(share.sharedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeShare(share.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const ImportTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Import Template</h3>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">Supported Formats</h4>
            <ul className="text-sm text-yellow-800 mt-1 space-y-1">
              <li>• JSON template files (.json)</li>
              <li>• HTML email templates (.html)</li>
              <li>• Template archives (.zip)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.html,.zip"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="hidden"
          />

          {!importFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Upload Template File
              </h4>
              <p className="text-gray-600">
                Click to browse or drag and drop your template file here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{importFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => setImportFile(null)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={importTemplate}
                disabled={importing}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {importing ? "Importing..." : "Import Template"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ExportTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Export Template</h3>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Export Format</h4>
        <div className="space-y-3 mb-6">
          {[
            {
              id: "json",
              label: "JSON Template",
              desc: "Complete template with metadata and variables",
            },
            {
              id: "html",
              label: "HTML Only",
              desc: "Pure HTML content without metadata",
            },
            {
              id: "zip",
              label: "ZIP Archive",
              desc: "Template with assets and documentation",
            },
          ].map((format) => (
            <label
              key={format.id}
              className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name="exportFormat"
                value={format.id}
                checked={exportFormat === format.id}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-gray-900">{format.label}</p>
                <p className="text-sm text-gray-600">{format.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={exportTemplate}
          disabled={exporting}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {exporting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {exporting ? "Exporting..." : "Export Template"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Template Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage versions, sharing, and import/export for your templates
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "versions", label: "Versions", icon: GitBranch },
              { id: "sharing", label: "Sharing", icon: Share2 },
              { id: "import", label: "Import", icon: Upload },
              { id: "export", label: "Export", icon: Download },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
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

        {/* Tab Content */}
        <div>
          {activeTab === "versions" && <VersionsTab />}
          {activeTab === "sharing" && <SharingTab />}
          {activeTab === "import" && <ImportTab />}
          {activeTab === "export" && <ExportTab />}
        </div>
      </div>
    </div>
  );
};
