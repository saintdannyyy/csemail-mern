import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Eye,
  Save,
  ArrowLeft,
  Download,
  Smartphone,
  Monitor,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import {
  BlockToolbox,
  EmailComponent,
  blockConfigs,
  BlockTypes,
} from "./BlockToolbox";
import { EmailBlock } from "./EmailBlock";
import { BlockRenderer } from "./BlockRenderer";
import { PropertyEditor } from "./PropertyEditor";

type BlockType = (typeof BlockTypes)[keyof typeof BlockTypes];

export const DragDropEmailEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sensors = useSensors(useSensor(PointerSensor));

  const [components, setComponents] = useState<EmailComponent[]>([]);
  const [selectedComponent, setSelectedComponent] =
    useState<EmailComponent | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [emailSubject, setEmailSubject] = useState("Your Email Subject");
  const [templateName, setTemplateName] = useState("Untitled Template");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load template data if passed from Templates page
  useEffect(() => {
    const templateData = location.state?.template;
    if (templateData) {
      setTemplateName(templateData.name || "Untitled Template");
      setEmailSubject(templateData.subject || "Your Email Subject");

      // Convert template content to components if available
      if (templateData.content) {
        try {
          // If the template has HTML content, create a single text block with it
          const htmlContent =
            typeof templateData.content === "string"
              ? templateData.content
              : templateData.content.html || "";

          if (htmlContent) {
            const newComponent: EmailComponent = {
              id: uuidv4(),
              type: "text",
              content: {
                text: htmlContent.replace(/<[^>]*>/g, ""), // Strip HTML tags for editing
                fontSize: "14px",
                color: "#333333",
                textAlign: "left",
                fontWeight: "normal",
              },
            };
            setComponents([newComponent]);
          }
        } catch (error) {
          console.error("Error parsing template content:", error);
        }
      }
    }
  }, [location.state]);

  const handleAddBlock = (blockType: BlockType) => {
    const config = blockConfigs[blockType];
    const newComponent: EmailComponent = {
      id: uuidv4(),
      type: blockType,
      content: { ...config.defaultContent },
    };

    setComponents((prev) => [...prev, newComponent]);
    setSelectedComponent(newComponent);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleEditComponent = (component: EmailComponent) => {
    setSelectedComponent(component);
  };

  const handleUpdateComponent = (updatedComponent: EmailComponent) => {
    setComponents((prev) =>
      prev.map((comp) =>
        comp.id === updatedComponent.id ? updatedComponent : comp
      )
    );
    setSelectedComponent(updatedComponent);
  };

  const handleDeleteComponent = (componentId: string) => {
    setComponents((prev) => prev.filter((comp) => comp.id !== componentId));
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  };

  const handleSelectComponent = (component: EmailComponent) => {
    setSelectedComponent(component);
  };

  const generateEmailHTML = () => {
    const emailStyles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f7f7f7; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: white; }
        .email-content { padding: 20px; }
        img { max-width: 100%; height: auto; }
        a { text-decoration: none; }
        .button { display: inline-block; }
      </style>
    `;

    const emailContent = components
      .map((component) => {
        const { type, content } = component;

        switch (type) {
          case "text":
            return `<p style="font-size: ${content.fontSize}; color: ${content.color}; text-align: ${content.textAlign}; font-weight: ${content.fontWeight}; margin: 0 0 16px 0;">${content.text}</p>`;

          case "heading":
            return `<${content.level} style="font-size: ${content.fontSize}; color: ${content.color}; text-align: ${content.textAlign}; margin: 0 0 16px 0;">${content.text}</${content.level}>`;

          case "image":
            return `<div style="text-align: ${content.alignment}; margin: 16px 0;"><img src="${content.src}" alt="${content.alt}" style="width: ${content.width}; height: ${content.height};" /></div>`;

          case "button":
            return `<div style="text-align: ${content.alignment}; margin: 16px 0;"><a href="${content.link}" style="background-color: ${content.backgroundColor}; color: ${content.textColor}; padding: ${content.padding}; border-radius: ${content.borderRadius}; text-decoration: none; display: inline-block;">${content.text}</a></div>`;

          case "divider":
            return `<hr style="border: none; border-top: ${content.height} solid ${content.color}; margin: ${content.margin};" />`;

          case "spacer":
            return `<div style="height: ${content.height};"></div>`;

          default:
            return "";
        }
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
        ${emailStyles}
      </head>
      <body>
        <div class="email-container">
          <div class="email-content">
            ${emailContent}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleSaveTemplate = () => {
    const templateData = {
      name: templateName,
      subject: emailSubject,
      content: generateEmailHTML(),
      components: components,
    };

    // Here you would typically save to your backend
    console.log("Saving template:", templateData);
    alert("Template saved successfully!");
  };

  const handleExportHTML = () => {
    const htmlContent = generateEmailHTML();
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/templates")}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Templates
            </button>

            <div className="flex flex-col">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="font-semibold text-lg bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-300 rounded px-2 py-1"
              />
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="text-sm text-gray-600 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-300 rounded px-2 py-1"
                placeholder="Email subject..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("desktop")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "desktop"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "mobile"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Smartphone size={16} />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                previewMode
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:text-gray-800"
              }`}
            >
              <Eye size={16} />
              Preview
            </button>

            <button
              onClick={handleExportHTML}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 hover:text-gray-800 rounded-md transition-colors"
            >
              <Download size={16} />
              Export
            </button>

            <button
              onClick={handleSaveTemplate}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Block Toolbox */}
        {!previewMode && <BlockToolbox onAddBlock={handleAddBlock} />}

        {/* Center - Email Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div
              className={`mx-auto bg-white shadow-lg ${
                viewMode === "mobile" ? "max-w-sm" : "max-w-2xl"
              } transition-all duration-300`}
            >
              {previewMode ? (
                // Preview Mode
                <div className="p-6">
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {emailSubject}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Preview of your email
                    </p>
                  </div>
                  <div className="space-y-4">
                    {components.map((component) => (
                      <BlockRenderer key={component.id} component={component} />
                    ))}
                  </div>
                  {components.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p>
                        No content yet. Exit preview mode to start building your
                        email.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Edit Mode
                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={components.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="min-h-[500px] p-6">
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">
                          {emailSubject}
                        </h2>
                        <p className="text-sm text-gray-600">
                          Drag and drop blocks to build your email
                        </p>
                      </div>

                      {components.map((component, index) => (
                        <EmailBlock
                          key={component.id}
                          id={component.id}
                          index={index}
                          type={component.type}
                          content={component.content}
                          isSelected={selectedComponent?.id === component.id}
                          onClick={() => handleSelectComponent(component)}
                          onEdit={() => handleEditComponent(component)}
                          onDelete={() => handleDeleteComponent(component.id)}
                        >
                          <BlockRenderer component={component} />
                        </EmailBlock>
                      ))}

                      {components.length === 0 && (
                        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-lg font-medium mb-2">
                            Start building your email
                          </p>
                          <p>
                            Drag blocks from the left sidebar to get started
                          </p>
                        </div>
                      )}
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeId ? (
                      <div className="bg-white shadow-lg rounded-lg border">
                        <BlockRenderer
                          component={components.find((c) => c.id === activeId)!}
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Property Editor */}
        {!previewMode && selectedComponent && (
          <PropertyEditor
            component={selectedComponent}
            onUpdate={handleUpdateComponent}
            onClose={() => setSelectedComponent(null)}
          />
        )}
      </div>
    </div>
  );
};
