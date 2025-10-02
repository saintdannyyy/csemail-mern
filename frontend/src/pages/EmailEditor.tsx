import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
  PhotoIcon,
  LinkIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";

// Email block types
export interface EmailBlock {
  id: string;
  type: "text" | "image" | "button" | "divider" | "spacer" | "columns";
  content: any;
  styles: Record<string, any>;
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
  const [emailSubject, setEmailSubject] = useState("");

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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newBlocks = Array.from(blocks);
    const [reorderedItem] = newBlocks.splice(result.source.index, 1);
    newBlocks.splice(result.destination.index, 0, reorderedItem);

    setBlocks(newBlocks);
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
        <title>${emailSubject}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4; }
          .email-container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
          .email-block { margin-bottom: 15px; }
          .button { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          .divider { border: none; height: 1px; background-color: #e5e5e5; margin: 20px 0; }
          img { max-width: 100%; height: auto; }
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
        return <DividerBlock key={block.id} {...commonProps} />;
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

              <button
                onClick={exportEmail}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            {previewMode ? (
              /* Preview Mode */
              <div
                className="bg-white p-6 rounded-lg shadow-sm border"
                dangerouslySetInnerHTML={{ __html: generateEmailHTML() }}
              />
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
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="email-blocks">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-4"
                        >
                          {blocks.map((block, index) => (
                            <Draggable
                              key={block.id}
                              draggableId={block.id}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="bg-gray-50 p-2 rounded-lg border"
                                >
                                  {renderBlock(block, index)}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
