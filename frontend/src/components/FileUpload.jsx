import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconUpload, IconFile, IconMusic, IconVideo, IconCheck, IconLoader2, IconX } from '@tabler/icons-react';

export default function FileUpload({ session, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setError('');
    setResult(null);

    const ext = file.name.split('.').pop().toLowerCase();
    const isMedia = ['mp3', 'wav', 'm4a', 'mp4', 'webm', 'mov'].includes(ext);

    try {
      setStatus(isMedia ? '🎙️ Transcribing audio/video...' : '📄 Extracting text...');

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      setStatus('🧠 Generating embeddings...');
      const data = await res.json();

      setResult(data);
      setStatus('');
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setError(err.message);
      setStatus('');
    } finally {
      setUploading(false);
    }
  }, [session, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt', '.md', '.csv'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'],
      'video/*': ['.mp4', '.webm', '.mov']
    }
  });

  const getIcon = (type) => {
    if (['audio'].includes(type)) return <IconMusic size={20} className="text-green-400" />;
    if (['video'].includes(type)) return <IconVideo size={20} className="text-purple-400" />;
    return <IconFile size={20} className="text-blue-400" />;
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <IconLoader2 size={32} className="text-blue-400 animate-spin" />
          ) : (
            <IconUpload size={32} className="text-neutral-500" />
          )}
          <div>
            <p className="text-neutral-300 text-sm font-medium">
              {isDragActive ? 'Drop file here...' : 'Drag & drop a file, or click to browse'}
            </p>
            <p className="text-neutral-500 text-xs mt-1">
              PDF, DOCX, TXT, MP3, WAV, MP4, WEBM supported
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
          <IconLoader2 size={16} className="animate-spin" />
          {status}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <IconX size={16} />
          {error}
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
          <IconCheck size={16} />
          <div className="flex-1">
            <span className="font-medium">{result.title}</span> 
            {result.status === 'processing' 
              ? ' processing started! Check the list in a moment.' 
              : ' processed successfully!'}
            {result.chunks_created && (
              <span className="text-green-400/60 ml-1">({result.chunks_created} chunks created)</span>
            )}
          </div>
          {getIcon(result.source_type)}
        </div>
      )}
    </div>
  );
}
