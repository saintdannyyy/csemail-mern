import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ImportContactsModalProps {
  onImport: (file: File) => Promise<any>; // Changed to return any result
  trigger?: React.ReactNode;
}

interface ImportStatus {
  type: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
  importedCount?: number;
  totalCount?: number;
}

export function ImportContactsModal({ onImport, trigger }: ImportContactsModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<ImportStatus>({ type: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const acceptedExtensions = ['.csv', '.xls', '.xlsx'];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    const isValidType = acceptedTypes.includes(file.type) || 
      acceptedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      setStatus({
        type: 'error',
        message: 'Please select a valid CSV or Excel file (.csv, .xls, .xlsx)'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setStatus({
        type: 'error',
        message: 'File size must be less than 10MB'
      });
      return;
    }

    setSelectedFile(file);
    setStatus({ type: 'idle' });
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setStatus({
        type: 'error',
        message: 'Please select a file first'
      });
      return;
    }

    console.log('Starting import with file:', selectedFile.name);
    setStatus({ type: 'uploading', message: 'Processing file...' });

    try {
      const result = await onImport(selectedFile);
      console.log('Import result:', result);
      
      setStatus({
        type: 'success',
        message: 'Contacts imported successfully!',
        importedCount: result?.importedCount || result?.created || 0,
        totalCount: result?.totalCount || result?.total || 0
      });
      
      // Reset form after successful import
      setTimeout(() => {
        setSelectedFile(null);
        setStatus({ type: 'idle' });
        setOpen(false);
      }, 3000);
    } catch (error) {
      console.error('Import error:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to import contacts'
      });
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setStatus({ type: 'idle' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.csv')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    }
    return <FileSpreadsheet className="h-8 w-8 text-blue-600" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Contacts
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Contacts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            <Label>Select File</Label>
            
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    {getFileIcon(selectedFile.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    className="mt-2"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <Upload className="h-12 w-12 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Drop your file here, or{' '}
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-500"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports CSV, XLS, and XLSX files (max 10MB)
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* Status Messages */}
          {status.type !== 'idle' && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              status.type === 'error' ? 'bg-red-50 border border-red-200' :
              status.type === 'success' ? 'bg-green-50 border border-green-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              {status.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />}
              {status.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
              {status.type === 'uploading' && (
                <div className="h-5 w-5 mt-0.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  status.type === 'error' ? 'text-red-800' :
                  status.type === 'success' ? 'text-green-800' :
                  'text-blue-800'
                }`}>
                  {status.message}
                </p>
                {status.type === 'success' && status.importedCount !== undefined && (
                  <p className="text-xs text-green-700 mt-1">
                    Successfully imported {status.importedCount} contacts
                    {status.totalCount && status.totalCount > 0 && ` out of ${status.totalCount} processed`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* File Format Help */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Expected File Format
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Your file should contain columns with these headers:</p>
              <div className="font-mono bg-white p-2 rounded border text-xs">
                email, firstName, lastName, status, tags, company, position
              </div>
              <p className="mt-2">
                • <strong>email</strong> is required
                • <strong>status</strong> should be: active, unsubscribed, bounced, or complained
                • <strong>tags</strong> should be comma-separated if multiple
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={status.type === 'uploading'}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!selectedFile || status.type === 'uploading'}
          >
            {status.type === 'uploading' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Contacts
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}