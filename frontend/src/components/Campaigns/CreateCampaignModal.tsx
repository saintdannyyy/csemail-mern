import React, { useState, useEffect } from "react";
import { X, Mail, Users, Settings, Eye, Plus } from "lucide-react";
import { ContactListManagerModal } from "../Contact/ContactListManagerModal";
const fromName = import.meta.env.VITE_COMPANY_NAME;
const support = import.meta.env.VITE_SUPPORT_EMAIL;
const noreply = import.meta.env.VITE_DEFAULT_FROM_EMAIL;
interface Template {
  _id: string;
  name: string;
  subject: string;
  description?: string;
  content: string;
  variables?: Array<{
    name: string;
    type: string;
    defaultValue?: string;
    required?: boolean;
    description?: string;
  }>;
  thumbnailUrl?: string;
}

interface ContactList {
  _id: string;
  name: string;
  description?: string;
  contactCount: number;
}

interface CampaignFormData {
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
  preheader: string;
  templateId: string;
  htmlContent: string;
  variables: Record<string, string>;
  listIds: string[];
  scheduledAt: string;
}

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: (campaign: any) => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onCampaignCreated,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showContactListManager, setShowContactListManager] = useState(false);

  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    subject: "",
    fromName: "",
    fromEmail: "",
    replyToEmail: "",
    preheader: "",
    templateId: "",
    htmlContent: "",
    variables: {},
    listIds: [],
    scheduledAt: "",
  });

  const steps = [
    { id: 1, name: "Template", icon: Mail },
    { id: 2, name: "Content", icon: Settings },
    { id: 3, name: "Recipients", icon: Users },
    { id: 4, name: "Review", icon: Eye },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      fetchContactLists();
      fetchEmailDefaults();
    }
  }, [isOpen]);

  // const fetch

  const fetchEmailDefaults = async () => {
    try {
      const response = await (
        await import("../../utils/apiClient")
      ).apiClient.get("/api/settings/email-defaults");

      if (response) {
        setFormData((prev) => ({
          ...prev,
          fromName:
            (response as any).fromName ||
            import.meta.env.VITE_DEFAULT_FROM_NAME ||
            fromName ||
            "",
          fromEmail:
            (response as any).fromEmail ||
            import.meta.env.VITE_DEFAULT_FROM_EMAIL ||
            noreply ||
            "",
          replyToEmail:
            (response as any).replyToEmail ||
            import.meta.env.VITE_SUPPORT_EMAIL ||
            support ||
            "",
        }));
      } else {
        // Fallback to environment variables if API fails
        setFormData((prev) => ({
          ...prev,
          fromName: import.meta.env.VITE_DEFAULT_FROM_NAME || fromName || "",
          fromEmail: import.meta.env.VITE_DEFAULT_FROM_EMAIL || noreply || "",
          replyToEmail: import.meta.env.VITE_SUPPORT_EMAIL || support || "",
        }));
      }
    } catch (error) {
      // Fallback to environment variables
      setFormData((prev) => ({
        ...prev,
        fromName: import.meta.env.VITE_DEFAULT_FROM_NAME || fromName || "",
        fromEmail: import.meta.env.VITE_DEFAULT_FROM_EMAIL || noreply || "",
        replyToEmail: import.meta.env.VITE_SUPPORT_EMAIL || support || "",
      }));
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await (
        await import("../../utils/apiClient")
      ).apiClient.getTemplates();
      setTemplates(response.templates || response || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const fetchContactLists = async () => {
    try {
      const response = await (
        await import("../../utils/apiClient")
      ).apiClient.getContactLists();
      setContactLists(response.lists || response || []);
    } catch (error) {
      console.error("Failed to fetch contact lists:", error);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.templateId) {
          newErrors.templateId = "Please select a template";
        }
        break;
      case 2:
        if (!formData.name.trim()) {
          newErrors.name = "Campaign name is required";
        }
        if (!formData.subject.trim()) {
          newErrors.subject = "Subject is required";
        }
        if (!formData.fromName.trim()) {
          newErrors.fromName = "From name is required";
        }
        if (!formData.fromEmail.trim()) {
          newErrors.fromEmail = "From email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.fromEmail)) {
          newErrors.fromEmail = "Invalid email format";
        }

        // Validate template variables
        if (selectedTemplate && selectedTemplate.variables) {
          const missingRequired = selectedTemplate.variables.filter(
            (variable) =>
              variable.required && !formData.variables[variable.name]?.trim()
          );

          if (missingRequired.length > 0) {
            newErrors.variables = `Required variables missing: ${missingRequired
              .map((v) => v.name)
              .join(", ")}`;
          }

          // Validate variable types
          selectedTemplate.variables.forEach((variable) => {
            const value = formData.variables[variable.name];
            if (value && value.trim()) {
              switch (variable.type) {
                case "email":
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    newErrors[
                      `variable_${variable.name}`
                    ] = `${variable.name} must be a valid email`;
                  }
                  break;
                case "url":
                  try {
                    new URL(value);
                  } catch {
                    newErrors[
                      `variable_${variable.name}`
                    ] = `${variable.name} must be a valid URL`;
                  }
                  break;
                case "number":
                  if (isNaN(Number(value))) {
                    newErrors[
                      `variable_${variable.name}`
                    ] = `${variable.name} must be a number`;
                  }
                  break;
              }
            }
          });
        }
        break;
      case 3:
        if (formData.listIds.length === 0) {
          newErrors.listIds = "Please select at least one contact list";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleTemplateSelect = (template: Template) => {
    // Extract variable names from the variables array and set default values
    const templateVariables = (template.variables || []).reduce(
      (acc, variable) => {
        if (typeof variable.name === "string") {
          acc[variable.name] = variable.defaultValue || "";
        }
        return acc;
      },
      {} as Record<string, string>
    );

    setFormData((prev) => ({
      ...prev,
      templateId: template._id,
      subject: template.subject,
      htmlContent: template.content,
      variables: templateVariables,
    }));
  };

  const handleVariableChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      variables: {
        ...prev.variables,
        [key]: value,
      },
    }));
  };

  // Function to preview content with variables replaced
  const getVariablePreview = (content: string): string => {
    let previewContent = content;

    // Replace variables with actual values or placeholders
    Object.entries(formData.variables).forEach(([key, value]) => {
      const placeholder = value.trim() || `[${key}]`;
      const variableRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      previewContent = previewContent.replace(variableRegex, placeholder);
    });

    // Show remaining unreplaced variables
    const remainingVars = previewContent.match(/\{\{[^}]+\}\}/g);
    if (remainingVars) {
      remainingVars.forEach((variable) => {
        const varName = variable.replace(/[{}]/g, "").trim();
        previewContent = previewContent.replace(variable, `[${varName}]`);
      });
    }

    return previewContent;
  };

  const handleContactListToggle = (listId: string) => {
    setFormData((prev) => ({
      ...prev,
      listIds: prev.listIds.includes(listId)
        ? prev.listIds.filter((id) => id !== listId)
        : [...prev.listIds, listId],
    }));
  };

  const handleContactListCreated = (newList: ContactList) => {
    setContactLists((prev) => [...prev, newList]);
    setShowContactListManager(false);
  };

  const handlePreview = async () => {
    if (!formData.templateId || !selectedTemplate) return;

    try {
      setLoading(true);

      // Generate preview content directly from template and variables
      let previewContent = selectedTemplate.content || "";

      // Replace variables with actual values or sample data
      const sampleData = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        company_name: "Sample Company",
        ...formData.variables,
      };

      // Replace all variables in the content
      Object.entries(sampleData).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
        previewContent = previewContent.replace(regex, value || `[${key}]`);
      });

      // Replace any remaining unreplaced variables with placeholder text
      previewContent = previewContent.replace(
        /\{\{([^}]+)\}\}/g,
        (_match: string, varName: string) => {
          return `[${varName.trim()}]`;
        }
      );

      setPreviewHtml(previewContent);
    } catch (error) {
      console.error("Preview failed:", error);
      setPreviewHtml(
        "<p>Preview generation failed. Please check your template.</p>"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (isDraft = true) => {
    if (!validateStep(currentStep)) return;

    try {
      setLoading(true);

      // Create the campaign with the appropriate status
      const campaign = await (
        await import("../../utils/apiClient")
      ).apiClient.createCampaign({
        ...formData,
        status: isDraft ? "draft" : "sending", // Use "sending" status for immediate sending
      });

      if (isDraft) {
        // For drafts, just notify and close
        onCampaignCreated(campaign);
        onClose();
      } else {
        // For immediate sending, the backend handles it automatically
        // Show success message
        const actualSentCount = campaign.sentCount || totalRecipients;
        setErrors({
          submit: `Campaign sent successfully to ${actualSentCount} recipients!`,
        });

        // Wait a moment to show the success message
        setTimeout(() => {
          onCampaignCreated({ ...campaign, status: "sent" });
          onClose();
        }, 2000);
      }

      // Reset form only if we're closing the modal
      if (isDraft) {
        setFormData({
          name: "",
          subject: "",
          fromName: "",
          fromEmail: "",
          replyToEmail: "",
          preheader: "",
          templateId: "",
          htmlContent: "",
          variables: {},
          listIds: [],
          scheduledAt: "",
        });
        setCurrentStep(1);
      }
    } catch (error) {
      console.error("Failed to create campaign:", error);
      setErrors({
        submit: `Failed to create campaign: ${
          (error as any).message || "Please try again."
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedTemplate = templates.find((t) => t._id === formData.templateId);
  const totalRecipients = contactLists
    .filter((list) => formData.listIds.includes(list._id))
    .reduce((sum, list) => sum + list.contactCount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Campaign
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 ${
                  currentStep >= step.id ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep >= step.id
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300"
                  }`}
                >
                  <step.icon size={16} />
                </div>
                <span className="text-sm font-medium">{step.name}</span>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 ml-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Template Selection */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Choose a Template</h3>
              {templates.length === 0 ? (
                <p className="text-gray-500">
                  No templates available. Create a template first.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template._id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.templateId === template._id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {template.thumbnailUrl && (
                        <img
                          src={template.thumbnailUrl}
                          alt={template.name}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      )}
                      <h4 className="font-medium text-gray-900">
                        {template.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {template.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Subject: {template.subject}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {errors.templateId && (
                <p className="text-red-600 text-sm mt-2">{errors.templateId}</p>
              )}
            </div>
          )}

          {/* Step 2: Content Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">
                Configure Campaign Content
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Summer Sale Newsletter"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Don't miss our summer sale!"
                  />
                  {errors.subject && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Name *
                  </label>
                  <input
                    type="text"
                    value={`${fromName}` || formData.fromName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fromName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      import.meta.env.VITE_DEFAULT_FROM_NAME ||
                      fromName ||
                      "e.g., Codlogics Software Engineering"
                    }
                  />
                  {errors.fromName && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.fromName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Email *
                  </label>
                  <input
                    type="email"
                    value={formData.fromEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fromEmail: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      import.meta.env.VITE_DEFAULT_FROM_EMAIL ||
                      noreply ||
                      "e.g., noreply@codlogics.com"
                    }
                  />
                  {errors.fromEmail && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.fromEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reply-To Email
                  </label>
                  <input
                    type="email"
                    value={formData.replyToEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        replyToEmail: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      import.meta.env.VITE_SUPPORT_EMAIL ||
                      support ||
                      "e.g., support@codlogics.com"
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preheader Text
                  </label>
                  <input
                    type="text"
                    value={formData.preheader}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        preheader: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Preview text that appears after subject"
                  />
                </div>
              </div>

              {/* Template Variables */}
              {selectedTemplate &&
                selectedTemplate.variables &&
                selectedTemplate.variables.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Template Variables
                    </h4>
                    {errors.variables && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">
                          {errors.variables}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {variable.name
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            {variable.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                            {variable.description && (
                              <span className="text-gray-500 text-xs ml-2">
                                ({variable.description})
                              </span>
                            )}
                          </label>
                          <input
                            type={
                              variable.type === "email"
                                ? "email"
                                : variable.type === "url"
                                ? "url"
                                : variable.type === "number"
                                ? "number"
                                : "text"
                            }
                            value={formData.variables[variable.name] || ""}
                            onChange={(e) =>
                              handleVariableChange(
                                variable.name,
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              errors[`variable_${variable.name}`]
                                ? "border-red-300 focus:ring-red-500"
                                : "border-gray-300 focus:ring-blue-500"
                            }`}
                            placeholder={
                              variable.defaultValue ||
                              variable.description ||
                              `Enter ${variable.name}`
                            }
                            required={variable.required}
                          />
                          {errors[`variable_${variable.name}`] && (
                            <p className="text-red-600 text-sm mt-1">
                              {errors[`variable_${variable.name}`]}
                            </p>
                          )}
                          {variable.type && (
                            <p className="text-gray-500 text-xs mt-1">
                              Expected type: {variable.type}
                            </p>
                          )}
                          {formData.variables[variable.name] && (
                            <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-xs">
                              <span className="text-green-700 font-medium">
                                Preview:{" "}
                              </span>
                              <code className="text-green-800">
                                {`{{${variable.name}}}}`} → "
                                {formData.variables[variable.name]}"
                              </code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Real-time subject preview with variables */}
                    {Object.keys(formData.variables).some(
                      (key) => formData.variables[key]
                    ) && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h5 className="text-sm font-medium text-yellow-800 mb-2">
                          Live Subject Preview:
                        </h5>
                        <div className="bg-white p-2 rounded border text-sm font-medium">
                          {getVariablePreview(formData.subject)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Step 3: Recipients */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Select Recipients</h3>
                <button
                  onClick={() => setShowContactListManager(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  <Plus size={16} />
                  <span>Manage Lists</span>
                </button>
              </div>

              {contactLists.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No Contact Lists Found
                  </h4>
                  <p className="text-gray-500 mb-4">
                    Create your first contact list to start sending campaigns.
                  </p>
                  <button
                    onClick={() => setShowContactListManager(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Contact List
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {contactLists.map((list) => (
                    <div
                      key={list._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.listIds.includes(list._id)}
                          onChange={() => handleContactListToggle(list._id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {list.name}
                          </h4>
                          {list.description && (
                            <p className="text-sm text-gray-500">
                              {list.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {list.contactCount.toLocaleString()} contacts
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.listIds && (
                <p className="text-red-600 text-sm mt-2">{errors.listIds}</p>
              )}

              {totalRecipients > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Total recipients:{" "}
                    <strong>{totalRecipients.toLocaleString()}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Review & Send</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Campaign Details
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Name:</dt>
                      <dd className="text-gray-900">{formData.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Subject:</dt>
                      <dd className="text-gray-900">{formData.subject}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">From:</dt>
                      <dd className="text-gray-900">
                        {formData.fromName} &lt;{formData.fromEmail}&gt;
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Recipients:</dt>
                      <dd className="text-gray-900">
                        {totalRecipients.toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Preview</h4>

                  {/* Variable Preview */}
                  {selectedTemplate &&
                    selectedTemplate.variables &&
                    selectedTemplate.variables.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h5 className="text-sm font-medium text-blue-800 mb-2">
                          Variable Preview
                        </h5>
                        <div className="space-y-1 text-xs">
                          <div className="font-medium text-blue-700">
                            Subject:
                          </div>
                          <div className="bg-white p-2 rounded border text-blue-900">
                            {getVariablePreview(formData.subject)}
                          </div>
                          {selectedTemplate.content && (
                            <>
                              <div className="font-medium text-blue-700 mt-2">
                                Content (first 200 chars):
                              </div>
                              <div className="bg-white p-2 rounded border text-blue-900">
                                {getVariablePreview(
                                  selectedTemplate.content
                                ).substring(0, 200)}
                                {selectedTemplate.content.length > 200 && "..."}
                              </div>
                            </>
                          )}
                          <div className="text-blue-600 text-xs mt-2">
                            Variables in [brackets] will be replaced with actual
                            values when sent.
                          </div>
                        </div>
                      </div>
                    )}

                  <button
                    onClick={handlePreview}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 w-full"
                  >
                    {loading ? "Loading..." : "Generate Full Preview"}
                  </button>

                  {previewHtml && (
                    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                      <div className="p-2 bg-gray-50 text-xs text-gray-600">
                        Full Email Preview
                      </div>
                      <div
                        className="p-4 max-h-40 overflow-y-auto text-xs"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {errors.submit && (
                <div
                  className={`text-sm mt-4 p-3 rounded-lg ${
                    errors.submit.includes("successfully")
                      ? "text-green-700 bg-green-50 border border-green-200"
                      : "text-red-600 bg-red-50 border border-red-200"
                  }`}
                >
                  {errors.submit}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div>
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Save as Draft"}
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading
                    ? `Sending to ${totalRecipients} recipients...`
                    : "Send Now"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contact List Manager Modal */}
      <ContactListManagerModal
        isOpen={showContactListManager}
        onClose={() => setShowContactListManager(false)}
        onContactListCreated={handleContactListCreated}
        mode="select"
      />
    </div>
  );
};
