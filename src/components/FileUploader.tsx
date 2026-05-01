'use client';
import React, { useCallback } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void;
  accept?: string;
  label?: string;
}

export default function FileUploader({ onFilesAdded, label, accept }: FileUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);

  const getAcceptMapping = (): Accept => {
    if (!accept) {
      return {
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/zip': ['.zip']
      };
    }

    const mapping: Accept = {};
    if (accept.includes('.pdf')) mapping['application/pdf'] = ['.pdf'];
    if (accept.includes('.docx')) mapping['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] = ['.docx'];
    if (accept.includes('.zip')) mapping['application/zip'] = ['.zip'];
    
    return mapping;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptMapping()
  });

  return (
    <div {...getRootProps()} className="dropzone" style={{ borderColor: isDragActive ? 'var(--primary)' : 'var(--border)' }}>
      <input {...getInputProps()} />
      <div className="upload-icon">
        <UploadCloud size={24} />
      </div>
      <h3>{label || 'Drop files here'}</h3>
      <p>or click to browse — multiple files and ZIP archives supported</p>
      
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
        <span className="badge">Single / Bulk</span>
        <span className="badge">ZIP Archive</span>
        <span className="badge">Max 200MB</span>
      </div>
    </div>
  );
}
