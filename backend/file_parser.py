"""
File parser module.
Extracts plain text from PDF, DOCX, and TXT files.
"""
import io
import PyPDF2
from docx import Document


def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n".join(text_parts)


def parse_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)


def parse_txt(file_bytes: bytes) -> str:
    """Extract text from a TXT file."""
    return file_bytes.decode("utf-8", errors="ignore")


def parse_file(filename: str, file_bytes: bytes) -> str:
    """
    Route to the correct parser based on file extension.
    Returns extracted plain text.
    """
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext == "pdf":
        return parse_pdf(file_bytes)
    elif ext == "docx":
        return parse_docx(file_bytes)
    elif ext in ("txt", "md", "csv"):
        return parse_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}. Supported: pdf, docx, txt, md, csv")
