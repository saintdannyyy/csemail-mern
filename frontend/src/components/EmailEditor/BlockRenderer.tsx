import { EmailComponent } from "./BlockToolbox";

interface BlockRendererProps {
  component: EmailComponent;
  isEditing?: boolean;
}

export const BlockRenderer = ({ component, isEditing }: BlockRendererProps) => {
  const { type, content } = component;

  const getInlineStyles = (content: any) => {
    const baseStyles: React.CSSProperties = {};

    if (content.fontSize) baseStyles.fontSize = content.fontSize;
    if (content.color) baseStyles.color = content.color;
    if (content.backgroundColor)
      baseStyles.backgroundColor = content.backgroundColor;
    if (content.textAlign) baseStyles.textAlign = content.textAlign as any;
    if (content.fontWeight) baseStyles.fontWeight = content.fontWeight;
    if (content.padding) baseStyles.padding = content.padding;
    if (content.margin) baseStyles.margin = content.margin;
    if (content.borderRadius) baseStyles.borderRadius = content.borderRadius;
    if (content.width) baseStyles.width = content.width;
    if (content.height) baseStyles.height = content.height;

    return baseStyles;
  };

  switch (type) {
    case "text":
      return (
        <div
          style={getInlineStyles(content)}
          className={`whitespace-pre-wrap ${isEditing ? "outline-none" : ""}`}
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
        >
          {content.text || "Enter your text here..."}
        </div>
      );

    case "heading":
      const HeadingTag = content.level || "h2";
      return (
        <HeadingTag
          style={getInlineStyles(content)}
          className={`${isEditing ? "outline-none" : ""}`}
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
        >
          {content.text || "Your Heading Here"}
        </HeadingTag>
      );

    case "image":
      return (
        <div style={{ textAlign: content.alignment || "center" }}>
          <img
            src={
              content.src ||
              "https://via.placeholder.com/600x300/e2e8f0/64748b?text=Click+to+upload+image"
            }
            alt={content.alt || "Image"}
            style={getInlineStyles(content)}
            className="max-w-full h-auto"
          />
        </div>
      );

    case "button":
      return (
        <div style={{ textAlign: content.alignment || "center" }}>
          <a
            href={content.link || "#"}
            style={{
              ...getInlineStyles(content),
              display: "inline-block",
              textDecoration: "none",
              color: content.textColor || "#ffffff",
            }}
            className="inline-block no-underline"
          >
            {content.text || "Click Here"}
          </a>
        </div>
      );

    case "divider":
      return (
        <hr
          style={{
            border: "none",
            borderTop: `${content.height || "1px"} solid ${
              content.color || "#e2e8f0"
            }`,
            margin: content.margin || "20px 0",
          }}
        />
      );

    case "spacer":
      return (
        <div
          style={{
            height: content.height || "20px",
            width: "100%",
          }}
        />
      );

    default:
      return (
        <div className="p-4 bg-gray-100 text-gray-500 text-center">
          Unknown block type: {type}
        </div>
      );
  }
};
