import React, { useState } from "react";
import { Download, X, FileText, Table, Users, Filter } from "lucide-react";

interface ExportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  totalContacts: number;
  filteredContacts?: number;
}

export interface ExportOptions {
  format: "csv" | "xlsx" | "json";
  includeFields: string[];
  filterType: "all" | "filtered" | "selected";
  selectedIds?: string[];
}

const AVAILABLE_FIELDS = [
  { id: "firstName", label: "First Name", required: true },
  { id: "lastName", label: "Last Name", required: true },
  { id: "email", label: "Email", required: true },
  { id: "phone", label: "Phone" },
  { id: "company", label: "Company" },
  { id: "position", label: "Position" },
  { id: "tags", label: "Tags" },
  { id: "status", label: "Status" },
  { id: "createdAt", label: "Date Added" },
  { id: "lastActivity", label: "Last Activity" },
];

export const ExportContactsModal: React.FC<ExportContactsModalProps> = ({
  isOpen,
  onClose,
  onExport,
  totalContacts,
  filteredContacts,
}) => {
  const [format, setFormat] = useState<"csv" | "xlsx" | "json">("csv");
  const [filterType, setFilterType] = useState<"all" | "filtered" | "selected">("all");
  const [includeFields, setIncludeFields] = useState<string[]>([
    "firstName",
    "lastName",
    "email",
    "phone",
    "company",
    "position",
    "status",
  ]);
  const [isExporting, setIsExporting] = useState(false);

  const handleFieldToggle = (fieldId: string) => {
    const field = AVAILABLE_FIELDS.find(f => f.id === fieldId);
    if (field?.required) return; // Don't allow toggling required fields

    setIncludeFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({
        format,
        includeFields,
        filterType,
      });
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      // Error handling is done in parent component
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  const getContactCount = () => {
    switch (filterType) {
      case "all":
        return totalContacts;
      case "filtered":
        return filteredContacts || totalContacts;
      case "selected":
        return 0; // Will be implemented when selection is added
      default:
        return totalContacts;
    }
  };

  const getFormatIcon = (formatType: string) => {
    switch (formatType) {
      case "csv":
        return <FileText className="h-5 w-5" />;
      case "xlsx":
        return <Table className="h-5 w-5" />;
      case "json":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Center the modal */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal panel */}
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Export Contacts
                </h3>
                <p className="text-sm text-gray-500">
                  Choose format and fields to export your contacts
                </p>
              </div>
            </div>
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleClose}
              disabled={isExporting}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Export Format */}
            <div>
              <label className="text-base font-medium text-gray-900">Export Format</label>
              <p className="text-sm leading-5 text-gray-500">
                Choose the file format for your export
              </p>
              <fieldset className="mt-4">
                <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                  {[
                    { id: "csv", label: "CSV", description: "Comma-separated values" },
                    { id: "xlsx", label: "Excel", description: "Excel spreadsheet" },
                    { id: "json", label: "JSON", description: "JSON data format" },
                  ].map((option) => (
                    <div key={option.id} className="flex items-center">
                      <input
                        id={option.id}
                        name="format"
                        type="radio"
                        checked={format === option.id}
                        onChange={(e) => setFormat(e.target.value as any)}
                        value={option.id}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <label htmlFor={option.id} className="ml-3 block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          {getFormatIcon(option.id)}
                          <span className="ml-2">{option.label}</span>
                        </div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Contact Filter */}
            <div>
              <label className="text-base font-medium text-gray-900">Contacts to Export</label>
              <p className="text-sm leading-5 text-gray-500">
                Choose which contacts to include in the export
              </p>
              <fieldset className="mt-4">
                <div className="space-y-4">
                  {[
                    { 
                      id: "all", 
                      label: "All Contacts", 
                      description: `Export all ${totalContacts} contacts`,
                      icon: <Users className="h-4 w-4" />
                    },
                    { 
                      id: "filtered", 
                      label: "Filtered Contacts", 
                      description: `Export ${filteredContacts || totalContacts} contacts matching current filters`,
                      icon: <Filter className="h-4 w-4" />,
                      disabled: !filteredContacts || filteredContacts === totalContacts
                    },
                  ].map((option) => (
                    <div key={option.id} className="flex items-center">
                      <input
                        id={option.id}
                        name="filterType"
                        type="radio"
                        checked={filterType === option.id}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        value={option.id}
                        disabled={option.disabled}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 disabled:opacity-50"
                      />
                      <label htmlFor={option.id} className={`ml-3 block text-sm font-medium ${option.disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                        <div className="flex items-center">
                          {option.icon}
                          <span className="ml-2">{option.label}</span>
                        </div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Fields to Include */}
            <div>
              <label className="text-base font-medium text-gray-900">Fields to Include</label>
              <p className="text-sm leading-5 text-gray-500">
                Select which contact fields to include in the export
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {AVAILABLE_FIELDS.map((field) => (
                  <div key={field.id} className="flex items-center">
                    <input
                      id={field.id}
                      name="fields"
                      type="checkbox"
                      checked={includeFields.includes(field.id)}
                      onChange={() => handleFieldToggle(field.id)}
                      disabled={field.required}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded disabled:opacity-50"
                    />
                    <label htmlFor={field.id} className={`ml-3 block text-sm ${field.required ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Export Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Format: <span className="font-medium">{format.toUpperCase()}</span></div>
                <div>Contacts: <span className="font-medium">{getContactCount()}</span></div>
                <div>Fields: <span className="font-medium">{includeFields.length}</span></div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </div>
              ) : (
                <div className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Contacts
                </div>
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClose}
              disabled={isExporting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};