import io
from pathlib import Path
from fastapi.testclient import TestClient
import pypdf
import pytest

from backend.main import app
from backend.services.document_service import DocumentService

client = TestClient(app)

# Minimal standalone valid PDF containing searchable text
MINIMAL_PDF_BYTES = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 55 >> stream
BT
/F1 18 Tf
50 100 Td
(Hello PDF World) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000227 00000 n 
0000000334 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
403
%%EOF"""


def test_extract_valid_txt_file():
    """Test extracting text from a valid plain text (.txt) file."""
    content = b"Welcome to the text to speech application.\nThis is a test line."
    files = {"file": ("notes.txt", io.BytesIO(content), "text/plain")}

    response = client.post("/api/extract-text", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["filename"] == "notes.txt"
    assert "Welcome to the text to speech application." in data["text"]
    assert data["char_count"] == len(data["text"])
    assert data["page_count"] == 1
    assert data["truncated"] is False


def test_extract_valid_pdf_file():
    """Test extracting text from a valid PDF document."""
    files = {"file": ("document.pdf", io.BytesIO(MINIMAL_PDF_BYTES), "application/pdf")}

    response = client.post("/api/extract-text", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["filename"] == "document.pdf"
    assert "Hello PDF World" in data["text"]
    assert data["page_count"] == 1
    assert data["truncated"] is False


def test_extract_multi_page_pdf_if_available():
    """Test extracting text from a real multi-page PDF if present in workspace root."""
    pdf_path = Path(__file__).resolve().parent.parent.parent / "Python -Text-to-Speech Application.pdf"
    if pdf_path.exists():
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        files = {"file": ("Python -Text-to-Speech Application.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        response = client.post("/api/extract-text", files=files)
        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["page_count"] > 1
        assert data["char_count"] <= 1000
        assert data["truncated"] is True
        assert len(data["text"]) <= 1000


def test_extract_empty_file():
    """Test rejection of a 0-byte empty file."""
    files = {"file": ("empty.txt", io.BytesIO(b""), "text/plain")}

    response = client.post("/api/extract-text", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_extract_blank_pdf_without_text():
    """Test rejection of a PDF with no readable text."""
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=100, height=100)
    buf = io.BytesIO()
    writer.write(buf)

    files = {"file": ("blank.pdf", io.BytesIO(buf.getvalue()), "application/pdf")}
    response = client.post("/api/extract-text", files=files)
    assert response.status_code == 400
    assert "no readable text" in response.json()["detail"].lower()


def test_extract_unsupported_extension():
    """Test rejection of unsupported file types (e.g. .png, .exe, .py)."""
    files = {"file": ("script.py", io.BytesIO(b"print('hello')"), "text/x-python")}

    response = client.post("/api/extract-text", files=files)
    assert response.status_code == 400
    assert "unsupported file format" in response.json()["detail"].lower()


def test_extract_text_truncation():
    """Test that text exceeding 1,000 characters is cleanly truncated with truncated=True."""
    long_text = "Word " * 300  # 1500 chars
    files = {"file": ("long.txt", io.BytesIO(long_text.encode("utf-8")), "text/plain")}

    response = client.post("/api/extract-text", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["truncated"] is True
    assert data["char_count"] == 1000
    assert len(data["text"]) == 1000


def test_extract_text_whitespace_normalization():
    """Test standardizing newlines and collapsing multiple blank lines."""
    raw_content = b"Paragraph 1\r\n\r\n\r\n\r\nParagraph 2    \n   Paragraph 3   "
    files = {"file": ("spaces.txt", io.BytesIO(raw_content), "text/plain")}

    response = client.post("/api/extract-text", files=files)
    assert response.status_code == 200
    data = response.json()

    assert "Paragraph 1\n\nParagraph 2\nParagraph 3" == data["text"]
