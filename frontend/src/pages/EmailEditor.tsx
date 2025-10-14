import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  TrashIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
  PhotoIcon,
  LinkIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";

// Sortable item component for @dnd-kit
const SortableItem: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-50 p-2 rounded-lg border"
    >
      {children}
    </div>
  );
};

// Email block types
export interface EmailBlock {
  id: string;
  type: "text" | "image" | "button" | "divider" | "spacer" | "columns";
  content: any;
  styles: Record<string, any>;
}

export interface TemplateVariable {
  name: string;
  type: "text" | "email" | "url" | "number";
  defaultValue?: string;
  description?: string;
  required?: boolean;
}

// Block components
const TextBlock: React.FC<{
  block: EmailBlock;
  onUpdate: (block: EmailBlock) => void;
  onDelete: () => void;
}> = ({ block, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(
    block.content?.text || "Enter your text here..."
  );

  const handleSave = () => {
    onUpdate({
      ...block,
      content: { ...block.content, text: content },
    });
    setIsEditing(false);
  };

  return (
    <div className="relative group border-2 border-dashed border-transparent hover:border-blue-300 p-2 rounded">
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDelete}
          className="bg-red-500 text-white p-1 rounded text-xs hover:bg-red-600"
        >
          <TrashIcon className="w-3 h-3" />
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="cursor-pointer min-h-[40px] p-2 rounded hover:bg-gray-50"
          style={{
            fontSize: block.styles?.fontSize || "14px",
            color: block.styles?.color || "#000000",
            textAlign: block.styles?.textAlign || "left",
            fontWeight: block.styles?.fontWeight || "normal",
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

const ImageBlock: React.FC<{
  block: EmailBlock;
  onUpdate: (block: EmailBlock) => void;
  onDelete: () => void;
}> = ({ block, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState(block.content?.src || "");
  const [altText, setAltText] = useState(block.content?.alt || "");

  const handleSave = () => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        src: imageUrl,
        alt: altText,
      },
    });
    setIsEditing(false);
  };

  return (
    <div className="relative group border-2 border-dashed border-transparent hover:border-blue-300 p-2 rounded">
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-500 text-white p-1 rounded text-xs hover:bg-blue-600 mr-1"
        >
          <Cog6ToothIcon className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="bg-red-500 text-white p-1 rounded text-xs hover:bg-red-600"
        >
          <TrashIcon className="w-3 h-3" />
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-2 p-2 bg-gray-50 rounded">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Image description"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={altText}
              className="max-w-full h-auto mx-auto rounded"
              style={{
                width: block.styles?.width || "auto",
                maxWidth: "100%",
              }}
              onClick={() => setIsEditing(true)}
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="flex flex-col items-center justify-center h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-200"
            >
              <PhotoIcon className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-500">Click to add image</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ButtonBlock: React.FC<{
  block: EmailBlock;
  onUpdate: (block: EmailBlock) => void;
  onDelete: () => void;
}> = ({ block, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(block.content?.text || "Click here");
  const [url, setUrl] = useState(block.content?.url || "");

  const handleSave = () => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        text,
        url,
      },
    });
    setIsEditing(false);
  };

  return (
    <div className="relative group border-2 border-dashed border-transparent hover:border-blue-300 p-2 rounded">
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-500 text-white p-1 rounded text-xs hover:bg-blue-600 mr-1"
        >
          <Cog6ToothIcon className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="bg-red-500 text-white p-1 rounded text-xs hover:bg-red-600"
        >
          <TrashIcon className="w-3 h-3" />
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-2 p-2 bg-gray-50 rounded">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Button Text
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="https://example.com"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <a
            href={url}
            onClick={(e) => {
              e.preventDefault();
              setIsEditing(true);
            }}
            className="inline-block px-6 py-3 rounded cursor-pointer transition-colors"
            style={{
              backgroundColor: block.styles?.backgroundColor || "#3B82F6",
              color: block.styles?.color || "#FFFFFF",
              textDecoration: "none",
            }}
          >
            {text}
          </a>
        </div>
      )}
    </div>
  );
};

const DividerBlock: React.FC<{ block: EmailBlock; onDelete: () => void }> = ({
  onDelete,
}) => {
  return (
    <div className="relative group border-2 border-dashed border-transparent hover:border-blue-300 p-2 rounded">
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDelete}
          className="bg-red-500 text-white p-1 rounded text-xs hover:bg-red-600"
        >
          <TrashIcon className="w-3 h-3" />
        </button>
      </div>
      <hr className="border-gray-300" />
    </div>
  );
};

const SpacerBlock: React.FC<{ block: EmailBlock; onDelete: () => void }> = ({
  block,
  onDelete,
}) => {
  return (
    <div className="relative group border-2 border-dashed border-transparent hover:border-blue-300 p-2 rounded">
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDelete}
          className="bg-red-500 text-white p-1 rounded text-xs hover:bg-red-600"
        >
          <TrashIcon className="w-3 h-3" />
        </button>
      </div>
      <div
        className="bg-gray-100 border border-dashed border-gray-300 rounded"
        style={{ height: block.content?.height || "20px" }}
      >
        <div className="text-center text-gray-400 text-xs pt-1">Spacer</div>
      </div>
    </div>
  );
};

// Main Email Editor Component
export const EmailEditor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [showVariablePanel, setShowVariablePanel] = useState(false);
  const [editingVariable, setEditingVariable] =
    useState<TemplateVariable | null>(null);

  // Function to automatically detect variables in content
  const detectVariables = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(variableRegex);
    if (!matches) return [];

    return [
      ...new Set(matches.map((match) => match.replace(/[{}]/g, "").trim())),
    ];
  };

  // Function to extract all variables from all blocks
  const extractAllVariables = (): string[] => {
    const allContent = blocks
      .map((block) => {
        if (block.type === "text") {
          return block.content?.text || "";
        } else if (block.type === "button") {
          return `${block.content?.text || ""} ${block.content?.url || ""}`;
        }
        return "";
      })
      .join(" ");

    return detectVariables(`${emailSubject} ${allContent}`);
  };

  // Function to sync detected variables with managed variables
  const syncVariables = () => {
    const detectedVars = extractAllVariables();
    const currentVarNames = variables.map((v) => v.name);

    // Add new detected variables
    const newVariables = detectedVars
      .filter((varName) => !currentVarNames.includes(varName))
      .map((varName) => ({
        name: varName,
        type: "text" as const,
        defaultValue: "",
        description: "",
        required: false,
      }));

    if (newVariables.length > 0) {
      setVariables((prev) => [...prev, ...newVariables]);
    }
  };

  // Auto-sync variables when blocks or subject change
  useEffect(() => {
    syncVariables();
  }, [blocks, emailSubject]);

  // Function to insert variable into text
  const insertVariableIntoText = (variableName: string) => {
    const variableText = `{{${variableName}}}`;
    // Focus on a text block or show instruction
    alert(`Copy this variable and paste it in your text: ${variableText}`);
  };

  // Function to validate variables in content
  const validateVariables = (): string[] => {
    const detectedVars = extractAllVariables();
    const managedVars = variables.map((v) => v.name);
    const missingVars = detectedVars.filter(
      (varName) => !managedVars.includes(varName)
    );
    return missingVars;
  };

  // Load template data if coming from Templates page
  useEffect(() => {
    if (location.state?.template) {
      const template = location.state.template;
      setEmailSubject(template.subject || "");

      // Convert template content to blocks (basic parsing)
      if (template.content || template.htmlContent) {
        const content = template.content || template.htmlContent;
        // For now, create a single text block with the template content
        const initialBlock: EmailBlock = {
          id: Date.now().toString(),
          type: "text",
          content: { text: content },
          styles: {},
        };
        setBlocks([initialBlock]);
      }
    }
  }, [location.state]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over?.id);

      setBlocks(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const addBlock = (type: EmailBlock["type"]) => {
    const newBlock: EmailBlock = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      styles: {},
    };
    setBlocks([...blocks, newBlock]);
  };

  const getDefaultContent = (type: EmailBlock["type"]) => {
    switch (type) {
      case "text":
        return { text: "Enter your text here..." };
      case "image":
        return { src: "", alt: "" };
      case "button":
        return { text: "Click here", url: "" };
      case "divider":
        return {};
      case "spacer":
        return { height: "20px" };
      default:
        return {};
    }
  };

  const updateBlock = (index: number, updatedBlock: EmailBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
  };

  const deleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
  };

  const generateEmailHTML = () => {
    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject || "Email"}</title>
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6;
          }
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .email-block { margin-bottom: 20px; }
          .button { 
            display: inline-block; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600;
            text-align: center;
            transition: all 0.2s;
          }
          .button:hover { opacity: 0.9; transform: translateY(-1px); }
          .divider { 
            border: none; 
            height: 2px; 
            background: linear-gradient(90deg, transparent, #e5e5e5, transparent); 
            margin: 30px 0; 
          }
          img { 
            max-width: 100%; 
            height: auto; 
            border-radius: 8px;
          }
          @media only screen and (max-width: 600px) {
            .email-container { 
              padding: 20px; 
              margin: 10px;
              border-radius: 8px;
            }
            .button { 
              display: block; 
              text-align: center; 
              margin: 10px 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
    `;

    blocks.forEach((block) => {
      html += '<div class="email-block">';

      switch (block.type) {
        case "text":
          html += `<p style="color: ${
            block.styles?.color || "#000"
          }; font-size: ${block.styles?.fontSize || "14px"}; text-align: ${
            block.styles?.textAlign || "left"
          };">${block.content.text}</p>`;
          break;
        case "image":
          if (block.content.src) {
            html += `<img src="${block.content.src}" alt="${
              block.content.alt
            }" style="width: ${block.styles?.width || "auto"};" />`;
          }
          break;
        case "button":
          html += `<a href="${
            block.content.url
          }" class="button" style="background-color: ${
            block.styles?.backgroundColor || "#3B82F6"
          }; color: ${block.styles?.color || "#FFFFFF"};">${
            block.content.text
          }</a>`;
          break;
        case "divider":
          html += '<hr class="divider" />';
          break;
        case "spacer":
          html += `<div style="height: ${
            block.content.height || "20px"
          };"></div>`;
          break;
      }

      html += "</div>";
    });

    html += `
        </div>
      </body>
      </html>
    `;

    return html;
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }

    try {
      setSaving(true);
      const templateData = {
        name: templateName,
        subject: emailSubject,
        content: generateEmailHTML(),
        description: `Created from Email Editor - ${blocks.length} blocks, ${variables.length} variables`,
        variables: variables,
      };

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        alert("Template saved successfully!");
        setShowSaveModal(false);
        setTemplateName("");
      } else {
        throw new Error("Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const exportEmail = () => {
    const html = generateEmailHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${emailSubject || "email"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    const data = {
      subject: emailSubject,
      blocks: blocks,
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${emailSubject || "email"}-template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderBlock = (block: EmailBlock, index: number) => {
    const commonProps = {
      onDelete: () => deleteBlock(index),
    };

    switch (block.type) {
      case "text":
        return (
          <TextBlock
            key={block.id}
            block={block}
            onUpdate={(updatedBlock) => updateBlock(index, updatedBlock)}
            {...commonProps}
          />
        );
      case "image":
        return (
          <ImageBlock
            key={block.id}
            block={block}
            onUpdate={(updatedBlock) => updateBlock(index, updatedBlock)}
            {...commonProps}
          />
        );
      case "button":
        return (
          <ButtonBlock
            key={block.id}
            block={block}
            onUpdate={(updatedBlock) => updateBlock(index, updatedBlock)}
            {...commonProps}
          />
        );
      case "divider":
        return <DividerBlock key={block.id} block={block} {...commonProps} />;
      case "spacer":
        return <SpacerBlock key={block.id} block={block} {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar - Block Palette */}
      <div className="w-64 bg-white shadow-lg p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Email Blocks</h2>
          <button
            onClick={() => navigate("/templates")}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => addBlock("text")}
            className="w-full flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            <span className="text-sm">📝</span>
            <span className="text-sm font-medium">Text Block</span>
          </button>

          <button
            onClick={() => addBlock("image")}
            className="w-full flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
          >
            <PhotoIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Image Block</span>
          </button>

          <button
            onClick={() => addBlock("button")}
            className="w-full flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Button Block</span>
          </button>

          <button
            onClick={() => addBlock("divider")}
            className="w-full flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
          >
            <MinusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Divider</span>
          </button>

          <button
            onClick={() => addBlock("spacer")}
            className="w-full flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors"
          >
            <span className="text-sm">📏</span>
            <span className="text-sm font-medium">Spacer</span>
          </button>
        </div>

        {/* Variables Section */}
        <div className="mt-6 border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-800">
              Template Variables
            </h3>
            <button
              onClick={() => setShowVariablePanel(!showVariablePanel)}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            >
              {showVariablePanel ? "Hide" : "Manage"}
            </button>
          </div>

          {variables.length > 0 ? (
            <div className="space-y-2">
              {variables
                .slice(0, showVariablePanel ? variables.length : 3)
                .map((variable, index) => (
                  <div
                    key={variable.name}
                    className="bg-yellow-50 border border-yellow-200 rounded p-2"
                  >
                    <div className="flex items-center justify-between">
                      <code className="text-xs font-mono text-yellow-800">
                        {`{{${variable.name}}}`}
                      </code>
                      <span className="text-xs text-yellow-600 capitalize">
                        {variable.type}
                      </span>
                    </div>
                    {variable.description && (
                      <p className="text-xs text-yellow-700 mt-1">
                        {variable.description}
                      </p>
                    )}
                    {showVariablePanel && (
                      <div className="mt-2 space-y-1">
                        <input
                          type="text"
                          placeholder="Description..."
                          value={variable.description || ""}
                          onChange={(e) => {
                            const updatedVariables = [...variables];
                            updatedVariables[index] = {
                              ...variable,
                              description: e.target.value,
                            };
                            setVariables(updatedVariables);
                          }}
                          className="w-full text-xs px-2 py-1 border border-yellow-300 rounded focus:outline-none focus:border-yellow-500"
                        />
                        <div className="flex gap-1">
                          <select
                            value={variable.type}
                            onChange={(e) => {
                              const updatedVariables = [...variables];
                              updatedVariables[index] = {
                                ...variable,
                                type: e.target.value as any,
                              };
                              setVariables(updatedVariables);
                            }}
                            className="text-xs px-1 py-1 border border-yellow-300 rounded focus:outline-none focus:border-yellow-500"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="url">URL</option>
                            <option value="number">Number</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Default value..."
                            value={variable.defaultValue || ""}
                            onChange={(e) => {
                              const updatedVariables = [...variables];
                              updatedVariables[index] = {
                                ...variable,
                                defaultValue: e.target.value,
                              };
                              setVariables(updatedVariables);
                            }}
                            className="flex-1 text-xs px-2 py-1 border border-yellow-300 rounded focus:outline-none focus:border-yellow-500"
                          />
                          <button
                            onClick={() => {
                              const updatedVariables = variables.filter(
                                (_, i) => i !== index
                              );
                              setVariables(updatedVariables);
                            }}
                            className="text-xs text-red-600 hover:text-red-800 px-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              {!showVariablePanel && variables.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{variables.length - 3} more variables...
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded">
              <p>No variables detected</p>
              <p className="mt-1">Use {`{{variable_name}}`} in your content</p>
            </div>
          )}

          {showVariablePanel && (
            <div className="mt-3">
              <button
                onClick={() => {
                  const newVarName = prompt("Enter variable name:");
                  if (
                    newVarName &&
                    !variables.find((v) => v.name === newVarName)
                  ) {
                    setVariables((prev) => [
                      ...prev,
                      {
                        name: newVarName.replace(/\s+/g, "_").toLowerCase(),
                        type: "text",
                        defaultValue: "",
                        description: "",
                        required: false,
                      },
                    ]);
                  }
                }}
                className="w-full text-xs bg-green-100 text-green-700 px-2 py-2 rounded hover:bg-green-200 border border-green-300"
              >
                + Add Custom Variable
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email Subject"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  previewMode
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <EyeIcon className="w-4 h-4" />
                {previewMode ? "Edit" : "Preview"}
              </button>

              {previewMode && (
                <button
                  onClick={() => setMobilePreview(!mobilePreview)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    mobilePreview
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  📱 {mobilePreview ? "Desktop" : "Mobile"}
                </button>
              )}

              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                💾 Save Template
              </button>

              <div className="relative">
                <button
                  onClick={exportEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Export HTML
                </button>
              </div>

              <button
                onClick={exportAsJSON}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                📄 JSON
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            {previewMode ? (
              /* Preview Mode */
              <div className="flex justify-center">
                <div
                  className={`bg-white rounded-lg shadow-sm border transition-all duration-300 ${
                    mobilePreview
                      ? "w-80 p-4" // Mobile width
                      : "w-full max-w-2xl p-6" // Desktop width
                  }`}
                >
                  <div
                    className={mobilePreview ? "text-sm" : ""}
                    dangerouslySetInnerHTML={{ __html: generateEmailHTML() }}
                  />
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="bg-white p-6 rounded-lg shadow-sm border min-h-96">
                {blocks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-2xl mb-4 block">📧</span>
                    <p className="mb-2">Your email is empty</p>
                    <p className="text-sm">
                      Add blocks from the sidebar to start building your email
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={blocks.map((block) => block.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {blocks.map((block, index) => (
                          <SortableItem key={block.id} id={block.id}>
                            {renderBlock(block, index)}
                          </SortableItem>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Save as Template</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Newsletter Template v1"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email subject line"
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p>Template will include:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>{blocks.length} email blocks</li>
                    <li>{variables.length} template variables</li>
                    <li>Complete HTML structure</li>
                    <li>All styling and formatting</li>
                  </ul>
                  {variables.length > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs font-medium text-yellow-800 mb-1">
                        Variables:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {variables.map((variable) => (
                          <code
                            key={variable.name}
                            className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded"
                          >
                            {`{{${variable.name}}}`}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setTemplateName("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveAsTemplate}
                  disabled={!templateName.trim() || saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Template"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
