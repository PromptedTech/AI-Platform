/**
 * KnowledgeManager Component
 * 
 * Manages user's knowledge base files:
 * - Upload PDF, DOCX, TXT files
 * - Display uploaded files with metadata
 * - Delete files and their embeddings
 * - Show upload progress and stats
 */

import { useState, useEffect } from 'react';
import { Upload, File, Trash2, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { authenticatedUpload, authenticatedPost, authenticatedGet } from '../lib/authClient';

export default function KnowledgeManager() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  /**
   * Load user's uploaded files from API
   */
  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await authenticatedGet('/api/knowledge/files');
      
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      } else {
        throw new Error('Failed to load files');
      }
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load knowledge base files');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle file drag events
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handle file drop
   */
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      await uploadFile(droppedFiles[0]);
    }
  };

  /**
   * Handle file selection via input
   */
  const handleFileSelect = async (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      await uploadFile(selectedFiles[0]);
    }
    // Reset input
    e.target.value = '';
  };

  /**
   * Upload file and create embeddings
   */
  const uploadFile = async (file) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload PDF, DOCX, or TXT files only');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress (actual progress tracking requires xhr)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await authenticatedUpload('/api/upload', formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Successfully uploaded ${data.filename} (${data.chunks} chunks created)`);
        
        // Reload files list
        await loadFiles();
        
        // Clear success message after 5s
        setTimeout(() => setSuccess(null), 5000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Delete a file and its embeddings
   */
  const handleDelete = async (fileId, filename) => {
    if (!confirm(`Delete "${filename}" and all its embeddings?`)) {
      return;
    }

    try {
      setError(null);
      
      const response = await authenticatedPost('/api/knowledge/delete', {
        fileId,
      });

      if (response.ok) {
        setSuccess(`Deleted ${filename}`);
        await loadFiles();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete file');
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Format date for display
   */
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Knowledge Base</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload documents to enhance AI responses with your own knowledge
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 mb-6 transition-all
          ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}
          ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-blue-400 cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && document.getElementById('file-upload').click()}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-lg font-medium mb-2">Uploading and processing...</p>
              <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {uploadProgress}%
              </p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Supports PDF, DOCX, and TXT files (max 10MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">Success</p>
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        </div>
      )}

      {/* Files List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Uploaded Files ({files.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No files uploaded yet</p>
            <p className="text-sm mt-1">Upload documents to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start flex-1 min-w-0">
                  <File className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.filename}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.chunks || 0} chunks</span>
                      <span>Uploaded {formatDate(file.uploadedAt)}</span>
                    </div>
                    {file.preview && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">
                        {file.preview}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(file.id, file.filename)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                  title="Delete file"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
