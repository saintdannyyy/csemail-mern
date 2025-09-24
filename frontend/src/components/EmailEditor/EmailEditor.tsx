import React, { useState } from 'react';
import { Bold, Italic, Link, Image, Palette, Eye, Smartphone, Monitor, Code } from 'lucide-react';

interface EmailEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const EmailEditor: React.FC<EmailEditorProps> = ({ content, onChange }) => {
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'code'>('editor');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const handleFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const insertMergeTag = (tag: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode(`{{${tag}}}`);
      range.deleteContents();
      range.insertNode(textNode);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'editor' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('editor')}
              >
                Editor
              </button>
              <button
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'preview' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('preview')}
              >
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
                HTML
              </button>
            </div>
            
            {viewMode === 'preview' && (
              <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
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
          
          {viewMode === 'editor' && (
            <div className="flex items-center space-x-1">
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                onClick={() => handleFormatting('bold')}
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                onClick={() => handleFormatting('italic')}
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                onClick={() => handleFormatting('createLink', prompt('Enter URL:') || '')}
              >
                <Link className="h-4 w-4" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                onClick={() => handleFormatting('insertImage', prompt('Enter image URL:') || '')}
              >
                <Image className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        
        {viewMode === 'editor' && (
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-sm text-gray-700 font-medium">Merge Tags:</span>
            <div className="flex items-center space-x-2">
              {['firstName', 'lastName', 'email', 'company'].map((tag) => (
                <button
                  key={tag}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  onClick={() => insertMergeTag(tag)}
                >
                  {`{{${tag}}}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4">
        {viewMode === 'editor' && (
          <div
            className="min-h-[400px] p-4 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            contentEditable
            dangerouslySetInnerHTML={{ __html: content }}
            onBlur={(e) => onChange(e.currentTarget.innerHTML)}
            style={{ lineHeight: '1.6' }}
          />
        )}
        
        {viewMode === 'preview' && (
          <div className={`mx-auto border border-gray-200 rounded ${
            previewDevice === 'desktop' ? 'max-w-2xl' : 'max-w-sm'
          }`}>
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-sm text-gray-600">
              Email Preview - {previewDevice === 'desktop' ? 'Desktop' : 'Mobile'}
            </div>
            <div 
              className="p-4 min-h-[400px]"
              dangerouslySetInnerHTML={{ __html: content }}
              style={{ 
                lineHeight: '1.6',
                fontSize: previewDevice === 'mobile' ? '14px' : '16px'
              }}
            />
          </div>
        )}
        
        {viewMode === 'code' && (
          <textarea
            className="w-full min-h-[400px] p-4 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your HTML code here..."
          />
        )}
      </div>
    </div>
  );
};