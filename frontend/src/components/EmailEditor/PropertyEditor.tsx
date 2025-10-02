import { useState, useEffect } from "react";
import { EmailComponent } from "./BlockToolbox";
import { X, Upload, Link, Type, Palette, Layout } from "lucide-react";

interface PropertyEditorProps {
  component: EmailComponent | null;
  onUpdate: (component: EmailComponent) => void;
  onClose: () => void;
}

export const PropertyEditor = ({
  component,
  onUpdate,
  onClose,
}: PropertyEditorProps) => {
  const [editedContent, setEditedContent] = useState<any>({});

  useEffect(() => {
    if (component) {
      setEditedContent({ ...component.content });
    }
  }, [component]);

  if (!component) return null;

  const handleContentChange = (key: string, value: any) => {
    const newContent = { ...editedContent, [key]: value };
    setEditedContent(newContent);
    onUpdate({ ...component, content: newContent });
  };

  const renderTextProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Type className="w-4 h-4 inline mr-1" />
          Text Content
        </label>
        <textarea
          value={editedContent.text || ""}
          onChange={(e) => handleContentChange("text", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md resize-none"
          rows={3}
          placeholder="Enter your text here..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Size
          </label>
          <select
            value={editedContent.fontSize || "14px"}
            onChange={(e) => handleContentChange("fontSize", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="32px">32px</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Weight
          </label>
          <select
            value={editedContent.fontWeight || "normal"}
            onChange={(e) => handleContentChange("fontWeight", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="lighter">Light</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Palette className="w-4 h-4 inline mr-1" />
            Text Color
          </label>
          <input
            type="color"
            value={editedContent.color || "#333333"}
            onChange={(e) => handleContentChange("color", e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Layout className="w-4 h-4 inline mr-1" />
            Alignment
          </label>
          <select
            value={editedContent.textAlign || "left"}
            onChange={(e) => handleContentChange("textAlign", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderHeadingProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Heading Text
        </label>
        <input
          type="text"
          value={editedContent.text || ""}
          onChange={(e) => handleContentChange("text", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Your heading here..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Heading Level
          </label>
          <select
            value={editedContent.level || "h2"}
            onChange={(e) => handleContentChange("level", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
            <option value="h4">H4</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Size
          </label>
          <select
            value={editedContent.fontSize || "24px"}
            onChange={(e) => handleContentChange("fontSize", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="28px">28px</option>
            <option value="32px">32px</option>
            <option value="36px">36px</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <input
            type="color"
            value={editedContent.color || "#333333"}
            onChange={(e) => handleContentChange("color", e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alignment
          </label>
          <select
            value={editedContent.textAlign || "left"}
            onChange={(e) => handleContentChange("textAlign", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderImageProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Upload className="w-4 h-4 inline mr-1" />
          Image URL
        </label>
        <input
          type="url"
          value={editedContent.src || ""}
          onChange={(e) => handleContentChange("src", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alt Text
        </label>
        <input
          type="text"
          value={editedContent.alt || ""}
          onChange={(e) => handleContentChange("alt", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Description of the image"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Width
          </label>
          <input
            type="text"
            value={editedContent.width || "100%"}
            onChange={(e) => handleContentChange("width", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="100% or 300px"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alignment
          </label>
          <select
            value={editedContent.alignment || "center"}
            onChange={(e) => handleContentChange("alignment", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderButtonProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Button Text
        </label>
        <input
          type="text"
          value={editedContent.text || ""}
          onChange={(e) => handleContentChange("text", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Click Here"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Link className="w-4 h-4 inline mr-1" />
          Link URL
        </label>
        <input
          type="url"
          value={editedContent.link || ""}
          onChange={(e) => handleContentChange("link", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="https://example.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Background Color
          </label>
          <input
            type="color"
            value={editedContent.backgroundColor || "#3b82f6"}
            onChange={(e) =>
              handleContentChange("backgroundColor", e.target.value)
            }
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text Color
          </label>
          <input
            type="color"
            value={editedContent.textColor || "#ffffff"}
            onChange={(e) => handleContentChange("textColor", e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Padding
          </label>
          <input
            type="text"
            value={editedContent.padding || "12px 24px"}
            onChange={(e) => handleContentChange("padding", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="12px 24px"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Border Radius
          </label>
          <input
            type="text"
            value={editedContent.borderRadius || "6px"}
            onChange={(e) =>
              handleContentChange("borderRadius", e.target.value)
            }
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="6px"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alignment
        </label>
        <select
          value={editedContent.alignment || "center"}
          onChange={(e) => handleContentChange("alignment", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );

  const renderDividerProperties = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <input
            type="color"
            value={editedContent.color || "#e2e8f0"}
            onChange={(e) => handleContentChange("color", e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Height
          </label>
          <select
            value={editedContent.height || "1px"}
            onChange={(e) => handleContentChange("height", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="1px">1px</option>
            <option value="2px">2px</option>
            <option value="3px">3px</option>
            <option value="4px">4px</option>
            <option value="5px">5px</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Margin
        </label>
        <input
          type="text"
          value={editedContent.margin || "20px 0"}
          onChange={(e) => handleContentChange("margin", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="20px 0"
        />
      </div>
    </div>
  );

  const renderSpacerProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Height
        </label>
        <select
          value={editedContent.height || "20px"}
          onChange={(e) => handleContentChange("height", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="10px">10px</option>
          <option value="20px">20px</option>
          <option value="30px">30px</option>
          <option value="40px">40px</option>
          <option value="50px">50px</option>
          <option value="60px">60px</option>
        </select>
      </div>
    </div>
  );

  const renderProperties = () => {
    switch (component.type) {
      case "text":
        return renderTextProperties();
      case "heading":
        return renderHeadingProperties();
      case "image":
        return renderImageProperties();
      case "button":
        return renderButtonProperties();
      case "divider":
        return renderDividerProperties();
      case "spacer":
        return renderSpacerProperties();
      default:
        return <div>No properties available for this block type.</div>;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 capitalize">
          Edit {component.type}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
        >
          <X size={18} />
        </button>
      </div>

      {renderProperties()}
    </div>
  );
};
