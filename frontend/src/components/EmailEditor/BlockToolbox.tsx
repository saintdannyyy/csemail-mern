import { useState } from "react";
import { Mail, Image, Type, Square, Minus, MousePointer } from "lucide-react";

export interface EmailComponent {
  id: string;
  type: "text" | "image" | "button" | "divider" | "spacer" | "heading";
  content: any;
}

export const BlockTypes = {
  TEXT: "text",
  HEADING: "heading",
  IMAGE: "image",
  BUTTON: "button",
  DIVIDER: "divider",
  SPACER: "spacer",
} as const;

type BlockType = (typeof BlockTypes)[keyof typeof BlockTypes];

export const blockConfigs: Record<BlockType, any> = {
  [BlockTypes.TEXT]: {
    icon: Type,
    name: "Text Block",
    description: "Add paragraphs of text",
    defaultContent: {
      text: "Enter your text here...",
      fontSize: "14px",
      color: "#333333",
      textAlign: "left",
      fontWeight: "normal",
    },
  },
  [BlockTypes.HEADING]: {
    icon: Type,
    name: "Heading",
    description: "Add a heading or title",
    defaultContent: {
      text: "Your Heading Here",
      fontSize: "24px",
      color: "#333333",
      textAlign: "left",
      fontWeight: "bold",
      level: "h2",
    },
  },
  [BlockTypes.IMAGE]: {
    icon: Image,
    name: "Image",
    description: "Add an image",
    defaultContent: {
      src: "https://via.placeholder.com/600x300/e2e8f0/64748b?text=Click+to+upload+image",
      alt: "Image description",
      width: "100%",
      height: "auto",
      alignment: "center",
    },
  },
  [BlockTypes.BUTTON]: {
    icon: MousePointer,
    name: "Button",
    description: "Add a call-to-action button",
    defaultContent: {
      text: "Click Here",
      link: "https://example.com",
      backgroundColor: "#3b82f6",
      textColor: "#ffffff",
      borderRadius: "6px",
      padding: "12px 24px",
      alignment: "center",
    },
  },
  [BlockTypes.DIVIDER]: {
    icon: Minus,
    name: "Divider",
    description: "Add a horizontal line",
    defaultContent: {
      height: "1px",
      color: "#e2e8f0",
      margin: "20px 0",
    },
  },
  [BlockTypes.SPACER]: {
    icon: Square,
    name: "Spacer",
    description: "Add vertical spacing",
    defaultContent: {
      height: "20px",
    },
  },
};

interface BlockToolboxProps {
  onAddBlock: (type: BlockType) => void;
}

export const BlockToolbox = ({ onAddBlock }: BlockToolboxProps) => {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "content" | "layout"
  >("all");

  const contentBlocks: BlockType[] = [
    BlockTypes.TEXT,
    BlockTypes.HEADING,
    BlockTypes.IMAGE,
    BlockTypes.BUTTON,
  ];
  const layoutBlocks: BlockType[] = [BlockTypes.DIVIDER, BlockTypes.SPACER];

  const getFilteredBlocks = (): BlockType[] => {
    switch (activeCategory) {
      case "content":
        return contentBlocks;
      case "layout":
        return layoutBlocks;
      default:
        return Object.values(BlockTypes);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">Email Blocks</h3>
      </div>

      {/* Category Filter */}
      <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
        {["all", "content", "layout"].map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as any)}
            className={`flex-1 py-1 px-2 text-xs font-medium rounded-md transition-colors ${
              activeCategory === category
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Block List */}
      <div className="space-y-2">
        {getFilteredBlocks().map((blockType) => {
          const config = blockConfigs[blockType];
          const IconComponent = config.icon;

          return (
            <button
              key={blockType}
              onClick={() => onAddBlock(blockType)}
              className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-md group-hover:bg-blue-100 transition-colors">
                  <IconComponent className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 text-sm">
                    {config.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {config.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Tips */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Quick Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Drag blocks to reorder them</li>
          <li>• Click blocks to edit content</li>
          <li>• Use preview to test your email</li>
        </ul>
      </div>
    </div>
  );
};
