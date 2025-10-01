import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Link, 
  Image, 
  Palette, 
  Eye, 
  Smartphone, 
  Monitor, 
  Code,
  Type,
  Layout,
  Square,
  Columns,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Undo,
  Redo,
  Save,
  Download,
  Settings,
  Plus,
  Trash2,
  Move,
  Edit3
} from 'lucide-react';

interface EmailBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'columns' | 'social' | 'spacer';
  content: any;
  styles: Record<string, any>;
}

interface TemplateVariable {
  name: string;
  type: 'text' | 'email' | 'url' | 'number' | 'textarea';
  defaultValue: string;
  required: boolean;
  description: string;
}

interface AdvancedEmailEditorProps {
  content: string;
  onChange: (content: string) => void;
  variables?: TemplateVariable[];
  onSave?: () => void;
  onExport?: () => void;
}

const BLOCK_TEMPLATES = {
  text: {
    id: '',
    type: 'text' as const,
    content: { text: 'Enter your text here...' },
    styles: { fontSize: '16px', color: '#333333', padding: '10px', textAlign: 'left' }
  },
  image: {
    id: '',
    type: 'image' as const,
    content: { src: '', alt: '', link: '' },
    styles: { width: '100%', padding: '10px', textAlign: 'center' }
  },
  button: {
    id: '',
    type: 'button' as const,
    content: { text: 'Click Here', link: '#' },
    styles: { 
      backgroundColor: '#2563eb', 
      color: '#ffffff', 
      padding: '12px 24px', 
      borderRadius: '6px',
      textAlign: 'center',
      margin: '10px 0'
    }
  },
  divider: {
    id: '',
    type: 'divider' as const,
    content: {},
    styles: { height: '1px', backgroundColor: '#e5e7eb', margin: '20px 0' }
  },
  columns: {
    id: '',
    type: 'columns' as const,
    content: { columns: [{ content: 'Column 1' }, { content: 'Column 2' }] },
    styles: { gap: '20px', padding: '10px' }
  },
  social: {
    id: '',
    type: 'social' as const,
    content: { 
      links: [
        { platform: 'facebook', url: '#' },
        { platform: 'twitter', url: '#' },
        { platform: 'linkedin', url: '#' }
      ]
    },
    styles: { textAlign: 'center', padding: '20px' }
  },
  spacer: {
    id: '',
    type: 'spacer' as const,
    content: {},
    styles: { height: '40px' }
  }
};

export const AdvancedEmailEditor: React.FC<AdvancedEmailEditorProps> = ({ 
  content, 
  onChange, 
  variables = [],
  onSave,
  onExport 
}) => {
  const [viewMode, setViewMode] = useState<'builder' | 'preview' | 'code'>('builder');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [showVariables, setShowVariables] = useState(false);
  const [undoStack, setUndoStack] = useState<EmailBlock[][]>([]);
  const [redoStack, setRedoStack] = useState<EmailBlock[][]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize blocks from content
  useEffect(() => {
    if (content && blocks.length === 0) {
      // For now, start with a simple text block if content exists
      const initialBlock: EmailBlock = {
        id: 'block-1',
        type: 'text',
        content: { text: content },
        styles: { fontSize: '16px', color: '#333333', padding: '10px' }
      };
      setBlocks([initialBlock]);
    }
  }, [content, blocks.length]);

  // Generate HTML from blocks
  const generateHTML = () => {
    return blocks.map(block => {
      switch (block.type) {
        case 'text':
          return `<div style="${styleObjectToString(block.styles)}">${block.content.text}</div>`;
        case 'image':
          return `<div style="${styleObjectToString(block.styles)}">
            ${block.content.link ? `<a href="${block.content.link}">` : ''}
            <img src="${block.content.src}" alt="${block.content.alt}" style="max-width: 100%;" />
            ${block.content.link ? '</a>' : ''}
          </div>`;
        case 'button':
          return `<div style="${styleObjectToString(block.styles)}">
            <a href="${block.content.link}" style="display: inline-block; background-color: ${block.styles.backgroundColor}; color: ${block.styles.color}; padding: ${block.styles.padding}; border-radius: ${block.styles.borderRadius}; text-decoration: none;">
              ${block.content.text}
            </a>
          </div>`;
        case 'divider':
          return `<div style="${styleObjectToString(block.styles)}"></div>`;
        case 'columns':
          return `<div style="display: flex; gap: ${block.styles.gap}; ${styleObjectToString(block.styles)}">
            ${block.content.columns.map((col: any) => `<div style="flex: 1;">${col.content}</div>`).join('')}
          </div>`;
        case 'social':
          return `<div style="${styleObjectToString(block.styles)}">
            ${block.content.links.map((link: any) => `
              <a href="${link.url}" style="margin: 0 10px; display: inline-block;">
                ${link.platform} 
              </a>
            `).join('')}
          </div>`;
        case 'spacer':
          return `<div style="${styleObjectToString(block.styles)}"></div>`;
        default:
          return '';
      }
    }).join('');
  };

  const styleObjectToString = (styles: Record<string, any>) => {
    return Object.entries(styles)
      .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
      .join('; ');
  };

  const camelToKebab = (str: string) => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  };

  // Update content when blocks change
  useEffect(() => {
    const html = generateHTML();
    onChange(html);
  }, [blocks]);

  const addBlock = (type: keyof typeof BLOCK_TEMPLATES) => {
    const newBlock = {
      ...BLOCK_TEMPLATES[type],
      id: `block-${Date.now()}`
    };
    
    // Save current state to undo stack
    setUndoStack(prev => [...prev, blocks]);
    setRedoStack([]);
    
    setBlocks(prev => [...prev, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<EmailBlock>) => {
    setUndoStack(prev => [...prev, blocks]);
    setRedoStack([]);
    
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setUndoStack(prev => [...prev, blocks]);
    setRedoStack([]);
    
    setBlocks(prev => prev.filter(block => block.id !== id));
    if (selectedBlock === id) {
      setSelectedBlock(null);
    }
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    setUndoStack(prev => [...prev, blocks]);
    setRedoStack([]);
    
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    setBlocks(newBlocks);
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [blocks, ...prev]);
      setUndoStack(prev => prev.slice(0, -1));
      setBlocks(previousState);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setUndoStack(prev => [...prev, blocks]);
      setRedoStack(prev => prev.slice(1));
      setBlocks(nextState);
    }
  };

  const insertVariable = (variableName: string) => {
    if (selectedBlock) {
      const block = blocks.find(b => b.id === selectedBlock);
      if (block && block.type === 'text') {
        updateBlock(selectedBlock, {
          content: { 
            ...block.content, 
            text: block.content.text + `{{${variableName}}}` 
          }
        });
      }
    }
  };

  const BlockLibrary = () => (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Content Blocks</h3>
      <div className="space-y-2">
        {Object.entries(BLOCK_TEMPLATES).map(([type, template]) => (
          <button
            key={type}
            onClick={() => addBlock(type as keyof typeof BLOCK_TEMPLATES)}
            className="w-full p-3 text-left bg-white border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {type === 'text' && <Type className="w-4 h-4" />}
              {type === 'image' && <Image className="w-4 h-4" />}
              {type === 'button' && <Square className="w-4 h-4" />}
              {type === 'divider' && <Layout className="w-4 h-4" />}
              {type === 'columns' && <Columns className="w-4 h-4" />}
              {type === 'social' && <Link className="w-4 h-4" />}
              {type === 'spacer' && <Plus className="w-4 h-4" />}
              <span className="capitalize">{type}</span>
            </div>
          </button>
        ))}
      </div>
      
      {variables.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Variables</h3>
          <div className="space-y-1">
            {variables.map((variable) => (
              <button
                key={variable.name}
                onClick={() => insertVariable(variable.name)}
                className="w-full p-2 text-left text-sm bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                title={variable.description}
              >
                {`{{${variable.name}}}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const PropertiesPanel = () => {
    const selectedBlockData = blocks.find(b => b.id === selectedBlock);
    
    if (!selectedBlock || !selectedBlockData) {
      return (
        <div className="w-64 bg-gray-50 border-l border-gray-200 p-4">
          <div className="text-center text-gray-500 mt-8">
            Select a block to edit its properties
          </div>
        </div>
      );
    }

    return (
      <div className="w-64 bg-gray-50 border-l border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Block Properties</h3>
        
        {selectedBlockData.type === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
              <textarea
                value={selectedBlockData.content.text}
                onChange={(e) => updateBlock(selectedBlock, {
                  content: { ...selectedBlockData.content, text: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
              <input
                type="text"
                value={selectedBlockData.styles.fontSize}
                onChange={(e) => updateBlock(selectedBlock, {
                  styles: { ...selectedBlockData.styles, fontSize: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="color"
                value={selectedBlockData.styles.color}
                onChange={(e) => updateBlock(selectedBlock, {
                  styles: { ...selectedBlockData.styles, color: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        )}
        
        {selectedBlockData.type === 'button' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
              <input
                type="text"
                value={selectedBlockData.content.text}
                onChange={(e) => updateBlock(selectedBlock, {
                  content: { ...selectedBlockData.content, text: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
              <input
                type="url"
                value={selectedBlockData.content.link}
                onChange={(e) => updateBlock(selectedBlock, {
                  content: { ...selectedBlockData.content, link: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <input
                type="color"
                value={selectedBlockData.styles.backgroundColor}
                onChange={(e) => updateBlock(selectedBlock, {
                  styles: { ...selectedBlockData.styles, backgroundColor: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        )}
        
        <button
          onClick={() => deleteBlock(selectedBlock)}
          className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4" />
          Delete Block
        </button>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Toolbar */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'builder' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('builder')}
              >
                Builder
              </button>
              <button
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'preview' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('preview')}
              >
                <Eye className="w-4 h-4 inline mr-1" />
                Preview
              </button>
              <button
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'code' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('code')}
              >
                <Code className="w-4 h-4 inline mr-1" />
                Code
              </button>
            </div>
            
            {viewMode === 'preview' && (
              <div className="flex items-center space-x-2">
                <button
                  className={`p-2 rounded ${
                    previewDevice === 'desktop' 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setPreviewDevice('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  className={`p-2 rounded ${
                    previewDevice === 'mobile' 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setPreviewDevice('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {viewMode === 'builder' && (
              <>
                <button
                  onClick={undo}
                  disabled={undoStack.length === 0}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <Undo className="h-4 w-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <Redo className="h-4 w-4" />
                </button>
              </>
            )}
            
            {onSave && (
              <button
                onClick={onSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            )}
            
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {viewMode === 'builder' && <BlockLibrary />}
        
        <div className="flex-1 overflow-auto">
          {viewMode === 'builder' && (
            <div className="p-8">
              <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                {blocks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Layout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Start building your email by adding blocks from the left panel</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {blocks.map((block, index) => (
                      <div
                        key={block.id}
                        className={`relative group p-4 ${selectedBlock === block.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}
                        onClick={() => setSelectedBlock(block.id)}
                      >
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlock(block.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div dangerouslySetInnerHTML={{ 
                          __html: generateHTML().split('</div>')[index] + '</div>' 
                        }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {viewMode === 'preview' && (
            <div className="p-8">
              <div className={`mx-auto border border-gray-200 rounded ${
                previewDevice === 'desktop' ? 'max-w-2xl' : 'max-w-sm'
              }`}>
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-sm text-gray-600">
                  Email Preview - {previewDevice === 'desktop' ? 'Desktop' : 'Mobile'}
                </div>
                <div 
                  className="p-4 min-h-[400px]"
                  dangerouslySetInnerHTML={{ __html: generateHTML() }}
                  style={{ 
                    lineHeight: '1.6',
                    fontSize: previewDevice === 'mobile' ? '14px' : '16px'
                  }}
                />
              </div>
            </div>
          )}
          
          {viewMode === 'code' && (
            <div className="p-4">
              <textarea
                className="w-full h-full min-h-[500px] p-4 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                value={generateHTML()}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter your HTML code here..."
              />
            </div>
          )}
        </div>
        
        {viewMode === 'builder' && <PropertiesPanel />}
      </div>
    </div>
  );
};