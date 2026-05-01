'use client';
import React, { useState, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import { Files, FileText, Download, Loader2, CheckCircle2, Clock, UploadCloud, Info } from 'lucide-react';

export interface FileItem {
  id: string;
  name: string;
  status: 'pending' | 'converting' | 'completed' | 'error';
  progress: number;
  resultName?: string;
}

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pdf-to-word' | 'word-to-pdf'>('pdf-to-word');
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedRemaining, setEstimatedRemaining] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isProcessing) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(timer);
  }, [isProcessing]);

  useEffect(() => {
    if (progress > 0 && elapsedTime > 0) {
      const totalEstimated = (elapsedTime / progress) * 100;
      setEstimatedRemaining(Math.max(0, Math.round(totalEstimated - elapsedTime)));
    }
  }, [progress, elapsedTime]);

  const handleFilesAdded = async (addedFiles: File[]) => {
    if (addedFiles.length === 0) return;
    
    setIsUploading(true);
    setJobId(null);
    setProgress(0);
    setElapsedTime(0);
    setEstimatedRemaining(0);
    
    setFiles(addedFiles.map(f => ({
      id: Math.random().toString(36).substring(7),
      name: f.name,
      status: 'pending',
      progress: 0
    })));

    const formData = new FormData();
    addedFiles.forEach(f => formData.append('files', f));

    try {
      const res = await fetch('/api/convert/bulk', { method: 'POST', body: formData });
      const data = await res.json();
      setIsUploading(false);
      
      if (data.jobId) {
        setJobId(data.jobId);
        setIsProcessing(true);
        pollStatus(data.jobId);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (e: any) {
      alert(e.message);
      setIsUploading(false);
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/convert/bulk?id=${id}`);
        const data = await res.json();
        
        setProgress(data.progress);
        
        if (data.results) {
          setFiles(prev => prev.map((f, i) => {
            if (data.results[i]) return { ...f, status: 'completed', resultName: data.results[i] };
            if (i < Math.floor((data.progress / 100) * prev.length)) return { ...f, status: 'converting' };
            return f;
          }));
        }
        
        if (data.status === 'completed') {
          clearInterval(interval);
          setIsProcessing(false);
          setProgress(100);
        } else if (data.status === 'error') {
          clearInterval(interval);
          setIsProcessing(false);
          alert(`Error: ${data.error}`);
        }
      } catch (e) {
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 1500);
  };

  const downloadIndividual = (fileName: string) => {
    if (!jobId) return;
    window.location.href = `/api/convert/bulk?id=${jobId}&download=true&file=${encodeURIComponent(fileName)}`;
  };

  const downloadZip = () => {
    if (!jobId) return;
    window.location.href = `/api/convert/bulk?id=${jobId}&download=true`;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          Swift<span>Convert</span>
        </div>
      </header>
      
      <div className="hero-section">
        <h1 className="hero-title">
          {activeTab === 'pdf-to-word' ? 'PDF to Word' : 'Word to PDF'}
          <span className="text-gradient"> Made Simple.</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
            Transform your documents with high-fidelity conversion. Support for English, Telugu, and Hindi scripts with original formatting preserved.
        </p>
      </div>

      <div className="tabs-container">
        <div className={`tab ${activeTab === 'pdf-to-word' ? 'active' : ''}`} onClick={() => setActiveTab('pdf-to-word')}>
          <FileText size={18} /> PDF to Word
        </div>
        <div className={`tab ${activeTab === 'word-to-pdf' ? 'active' : ''}`} onClick={() => setActiveTab('word-to-pdf')}>
          <Files size={18} /> Word to PDF
        </div>
      </div>

      {!isProcessing && !isUploading ? (
        <FileUploader 
            onFilesAdded={handleFilesAdded} 
            accept={activeTab === 'pdf-to-word' ? '.pdf,.zip' : '.docx,.zip'}
            label={activeTab === 'pdf-to-word' ? 'Drop PDF files here' : 'Drop Word files here'}
        />
      ) : (
        <div className="dropzone" style={{ cursor: 'default', borderColor: 'var(--primary)' }}>
          <div className="upload-icon">
            {isUploading ? <UploadCloud className="animate-bounce" size={24} /> : <Loader2 className="animate-spin" size={24} />}
          </div>
          <h3>{isUploading ? 'Uploading files...' : `Converting ${files.length} documents...`}</h3>
          <p>{isUploading ? 'Preparing your batch' : 'Applying native reconstruction engine'}</p>
          
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={14} /> Elapsed: {formatTime(elapsedTime)}
            </div>
            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{progress}% Complete</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Remaining: {formatTime(estimatedRemaining)}
            </div>
          </div>
        </div>
      )}
      
      {jobId && !isProcessing && !isUploading && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="btn-primary" onClick={downloadZip} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 auto' }}>
            <Download size={20} /> Download All Results (ZIP)
          </button>
        </div>
      )}

      {files.length > 0 && (
        <div className="file-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Conversion Queue</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{files.filter(f => f.status === 'completed').length} / {files.length} Done</span>
          </div>
          {files.map((file) => (
            <div key={file.id} className="file-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ color: file.status === 'completed' ? 'var(--success)' : 'var(--primary)' }}>
                  {file.status === 'completed' ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{file.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {file.status === 'completed' ? 'Conversion Successful' : file.status === 'converting' ? 'Processing...' : 'Waiting...'}
                  </div>
                </div>
              </div>
              <div>
                {file.status === 'completed' && file.resultName && (
                  <button onClick={() => downloadIndividual(file.resultName!)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Download size={14} /> Download
                  </button>
                )}
                {file.status === 'converting' && <Loader2 size={16} className="animate-spin" color="var(--primary)" />}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="notice">
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Privacy & Quality</p>
            <p>SwiftConvert uses professional-grade reconstruction engines. All formatting and scripts (Telugu, Hindi, English) are preserved with 100% fidelity. Files are processed securely and deleted after completion.</p>
          </div>
        </div>
      </div>
      
      <footer style={{ marginTop: '4rem', padding: '2rem 0', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SwiftConvert © 2026 • Secure High-Fidelity Document Processing</p>
      </footer>
    </div>
  );
}
