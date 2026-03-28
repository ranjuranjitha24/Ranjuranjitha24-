-- =============================================
-- Gemini 768-D Postgres Architecture (Free Tier)
-- =============================================

CREATE EXTENSION IF NOT EXISTS vector;

-- Drop old 1536 Grok table if exists
DROP TABLE IF EXISTS documents;

-- 2. Create documents table (3072 Dimensions for full gemini-embedding-001)
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT DEFAULT 'text',
  file_url TEXT DEFAULT '',
  embedding VECTOR(3072),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Simple Index for 3072D (HNSW is limited to 2000D in many versions)
-- For small/medium collections, cosine similarity is fast enough without HNSW.
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents (user_id);

-- 4. Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (auth.uid() = user_id);

-- 5. MATCH FUNCTION (3072D)
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(3072),
  match_threshold FLOAT,
  match_count INT,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  source_type TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    documents.id,
    documents.title,
    documents.content,
    documents.source_type,
    documents.created_at,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE documents.user_id = p_user_id
    AND 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
$$;
