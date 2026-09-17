import io
import os
import re
from pathlib import Path
from typing import Any, Dict
import pypdf


class DocumentService:
    """Service for extracting and normalizing text from uploaded documents (TXT, PDF)."""

    MAX_CHARACTERS = 1000
    SUPPORTED_EXTENSIONS = {".txt", ".text", ".pdf"}

    @classmethod
    def extract_text(cls, filename: str, content: bytes) -> Dict[str, Any]:
        """
        Extract text from a file buffer (.txt or .pdf), normalize whitespace,
        and enforce the 1,000 character maximum limit.
        """
        if not content or len(content) == 0:
            raise ValueError("The uploaded document is empty.")

        # Validate file extension
        ext = Path(filename).suffix.lower()
        if ext not in cls.SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file format: '{ext}'. Only .txt and .pdf files are supported."
            )

        raw_text = ""
        page_count = 1

        if ext in {".txt", ".text"}:
            try:
                raw_text = content.decode("utf-8-sig")
            except UnicodeDecodeError:
                try:
                    raw_text = content.decode("latin-1")
                except Exception as exc:
                    raise ValueError(f"Unable to decode text file: {exc}")
        elif ext == ".pdf":
            try:
                pdf_stream = io.BytesIO(content)
                reader = pypdf.PdfReader(pdf_stream)
                
                # Check for password protection
                if reader.is_encrypted:
                    try:
                        reader.decrypt("")
                    except Exception:
                        raise ValueError(
                            "The PDF document is password protected and cannot be extracted."
                        )

                page_count = len(reader.pages)
                if page_count == 0:
                    raise ValueError("The uploaded PDF contains no pages.")

                extracted_pages = []
                for page in reader.pages:
                    txt = page.extract_text() or ""
                    if txt.strip():
                        extracted_pages.append(txt.strip())

                raw_text = "\n\n".join(extracted_pages)
            except ValueError:
                raise
            except Exception as exc:
                raise ValueError(
                    f"Failed to read PDF document. The file may be damaged: {exc}"
                )

        # Normalize text and collapse excessive whitespace
        normalized_text = cls.normalize_text(raw_text)

        if not normalized_text:
            raise ValueError("The uploaded document contains no readable text.")

        # Check character limit truncation
        truncated = False
        if len(normalized_text) > cls.MAX_CHARACTERS:
            final_text = normalized_text[: cls.MAX_CHARACTERS]
            truncated = True
        else:
            final_text = normalized_text

        return {
            "success": True,
            "text": final_text,
            "filename": os.path.basename(filename),
            "char_count": len(final_text),
            "page_count": page_count,
            "truncated": truncated,
        }

    @staticmethod
    def normalize_text(text: str) -> str:
        """Standardize newlines, collapse duplicate spacing, and strip ends."""
        if not text:
            return ""
        # Standardize line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # Collapse 3 or more consecutive newlines into 2
        text = re.sub(r"\n{3,}", "\n\n", text)
        # Strip trailing and leading whitespace on each line
        lines = [line.strip() for line in text.split("\n")]
        text = "\n".join(lines)
        return text.strip()
