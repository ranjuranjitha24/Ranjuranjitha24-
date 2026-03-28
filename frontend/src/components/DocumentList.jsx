import { useState, useEffect } from 'react';
import { IconFile, IconMusic, IconVideo, IconTrash, IconLoader2 } from '@tabler/icons-react';

export default function DocumentList({ session, refreshTrigger }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const handleDelete = async (title) => {
    if (!confirm(`Delete "${title}" and all its chunks?`)) return;

    try {
      const res = await fetch(`/api/documents/${encodeURIComponent(title)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setDocuments(documents.filter(d => d.title !== title));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getIcon = (type) => {
    if (type === 'audio') return <IconMusic size={18} className="text-green-400" />;
    if (type === 'video') return <IconVideo size={18} className="text-purple-400" />;
    return <IconFile size={18} className="text-blue-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-neutral-500 text-sm">
        <IconLoader2 size={18} className="animate-spin mr-2" /> Loading documents...
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 text-sm">
        No documents uploaded yet. Upload files to start searching!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            {getIcon(doc.source_type)}
            <div className="min-w-0">
              <p className="text-neutral-200 text-sm font-medium truncate">{doc.title}</p>
              <p className="text-neutral-500 text-xs">
                {doc.chunk_count} chunk{doc.chunk_count !== 1 ? 's' : ''} • {doc.source_type}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDelete(doc.title)}
            className="p-2 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <IconTrash size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
