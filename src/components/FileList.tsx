'use client';
import React from 'react';
import { FileText, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface FileItem {
  id: string;
  name: string;
  status: 'pending' | 'converting' | 'completed' | 'error';
  progress: number;
  result?: { name: string; data: Uint8Array; type: string };
  error?: string;
}

interface FileListProps {
  files: FileItem[];
  onDownload: (file: FileItem) => void;
}

export default function FileList({ files, onDownload }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="file-list">
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Conversion Queue ({files.length})
        </h3>
      </div>
      {files.map((file) => (
        <div key={file.id} className="file-item" style={{ 
          border: file.status === 'completed' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid var(--border)',
          background: file.status === 'completed' ? 'rgba(34, 197, 94, 0.02)' : 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: 'rgba(255,255,255,0.03)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <FileText size={20} color={file.status === 'completed' ? '#22c55e' : 'var(--text-muted)'} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{file.name}</div>
              <div style={{ fontSize: '0.75rem', color: file.status === 'completed' ? '#22c55e' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {file.status === 'converting' && <><Loader2 className="animate-spin" size={12} /> Converting to desired format...</>}
                {file.status === 'completed' && <><CheckCircle2 size={12} /> Conversion successful</>}
                {file.status === 'error' && <><AlertCircle size={12} /> {file.error}</>}
                {file.status === 'pending' && 'Waiting in queue...'}
              </div>
            </div>
          </div>

          <div>
            {file.status === 'converting' && (
              <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '60%', height: '100%', background: 'var(--primary)', borderRadius: '2px' }} className="animate-pulse" />
              </div>
            )}
            {file.status === 'completed' && (
              <button 
                onClick={() => onDownload(file)}
                style={{ 
                  background: 'var(--gradient-brand)', 
                  border: 'none', 
                  padding: '0.5rem 1.25rem', 
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)'
                }}
              >
                Download File
              </button>
            )}
            {file.status === 'error' && (
              <button 
                onClick={() => window.location.reload()}
                style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem' }}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
