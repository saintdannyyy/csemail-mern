import { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Edit3, Move } from "lucide-react";

interface EmailBlockProps {
  id: string;
  index: number;
  type: string;
  content: any;
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  onClick?: () => void;
}

export const EmailBlock = ({
  id,
  type,
  children,
  onEdit,
  onDelete,
  isSelected,
  onClick,
}: EmailBlockProps) => {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group border-2 transition-all duration-200 
        ${
          isSelected
            ? "border-blue-500 bg-blue-50"
            : "border-transparent hover:border-gray-300"
        }
        ${isDragging ? "shadow-lg opacity-50" : "shadow-sm"}
      `}
      onClick={onClick}
    >
      {/* Drag Handle and Actions */}
      <div className="absolute -top-10 left-0 right-0 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <div className="flex items-center gap-2 bg-white rounded-md shadow-md px-2 py-1 text-xs text-gray-600">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move p-1 hover:bg-gray-100 rounded"
          >
            <Move size={12} />
          </div>
          <span className="capitalize">{type}</span>
        </div>

        <div className="flex items-center gap-1 bg-white rounded-md shadow-md px-1 py-1">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 hover:bg-blue-100 rounded text-blue-600"
              title="Edit block"
            >
              <Edit3 size={12} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 hover:bg-red-100 rounded text-red-600"
              title="Delete block"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Block Content */}
      <div className="min-h-[40px] p-2">{children}</div>
    </div>
  );
};
