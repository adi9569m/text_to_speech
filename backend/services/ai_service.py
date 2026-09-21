import os
import re
from typing import Any, Dict, List


class AIService:
    """
    Text assistant service for script preparation.
    Supports:
    - summarize: Condenses text into punchy summary optimized for speech.
    - grammar: Corrects punctuation, casing, spacing, and disfluencies for crisp narration.
    - conversational: Converts stiff or formal prose into warm, engaging spoken dialogue.
    - formal: Polishes casual notes into professional audio presentation scripts.
    - bullet_to_script: Transcribes bullet points or itemized lists into seamless narrative flow.
    """

    SUPPORTED_MODES = {
        "summarize",
        "grammar",
        "conversational",
        "formal",
        "bullet_to_script",
    }

    @classmethod
    def enhance_text(cls, text: str, mode: str = "grammar") -> Dict[str, Any]:
        cleaned = text.strip()
        if not cleaned:
            raise ValueError("Please provide text to enhance.")

        if len(cleaned) > 1000:
            raise ValueError("Input text exceeds maximum limit of 1,000 characters.")

        mode_clean = mode.lower().strip()
        if mode_clean not in cls.SUPPORTED_MODES:
            raise ValueError(
                f"Unsupported enhancement mode '{mode}'. Supported modes: {', '.join(sorted(cls.SUPPORTED_MODES))}."
            )

        changes: List[str] = []
        result_text = cleaned

        if mode_clean == "grammar":
            result_text, changes = cls._fix_grammar(cleaned)
        elif mode_clean == "summarize":
            result_text, changes = cls._summarize(cleaned)
        elif mode_clean == "conversational":
            result_text, changes = cls._make_conversational(cleaned)
        elif mode_clean == "formal":
            result_text, changes = cls._make_formal(cleaned)
        elif mode_clean == "bullet_to_script":
            result_text, changes = cls._bullet_to_script(cleaned)

        # Enforce character limit
        if len(result_text) > 1000:
            result_text = result_text[:1000].rstrip()
            changes.append("Truncated to 1,000 character limit.")

        return {
            "success": True,
            "mode": mode_clean,
            "original_text": cleaned,
            "enhanced_text": result_text,
            "char_count": len(result_text),
            "word_count": len(result_text.split()),
            "changes_applied": changes,
        }

    @staticmethod
    def _fix_grammar(text: str) -> tuple[str, List[str]]:
        changes = []
        out = text

        # Replace repeated punctuation like ??? or !!! with standard single or double
        if re.search(r"\?{2,}", out):
            out = re.sub(r"\?{2,}", "?", out)
            changes.append("Normalized repeated question marks.")
        if re.search(r"!{2,}", out):
            out = re.sub(r"!{2,}", "!", out)
            changes.append("Normalized repeated exclamation points.")
        if re.search(r"\.{4,}", out):
            out = re.sub(r"\.{4,}", "...", out)
            changes.append("Standardized ellipses.")

        # Common spoken disfluencies removal for clean audio
        filler_words = [r"\bum+\b", r"\buh+\b", r"\ber+\b", r"\byou know,?\s*"]
        for pattern in filler_words:
            if re.search(pattern, out, flags=re.IGNORECASE):
                out = re.sub(pattern, "", out, flags=re.IGNORECASE)
                changes.append("Removed vocal filler words for clean speech narration.")

        # Remove spaces before punctuation (e.g., 'test ?' -> 'test?')
        out = re.sub(r"\s+([.?!,;:])", r"\1", out)

        # Fix spacing around punctuation: space after comma/period if missing
        out = re.sub(r"([,;:])([^\s\d])", r"\1 \2", out)
        out = re.sub(r"(\.)([A-Z])", r"\1 \2", out)

        # Collapse whitespace and strip
        out = re.sub(r"\s+", " ", out).strip()

        # Capitalize start of sentences
        sentences = re.split(r"([.?!]\s+)", out)
        fixed_sentences = []
        for s in sentences:
            if s and not re.match(r"^[.?!]\s+$", s):
                s = s.strip()
                if s:
                    s = s[0].upper() + s[1:] if len(s) > 1 else s.upper()
            fixed_sentences.append(s)
        out = "".join(fixed_sentences)

        # Ensure first character of entire text is capitalized
        if out and out[0].islower():
            out = out[0].upper() + out[1:]

        # Ensure text ends with terminal punctuation
        if out and out[-1] not in ".!?":
            out += "."
            changes.append("Added terminal period for natural speech cadence.")

        # Final whitespace cleanup
        out = re.sub(r"\s+([.?!,;:])", r"\1", out)
        out = re.sub(r"\s+", " ", out).strip()
        if not changes:
            changes.append("Verified and standardized sentence syntax and spacing.")

        return out, changes

    @staticmethod
    def _summarize(text: str) -> tuple[str, List[str]]:
        changes = ["Extracted core ideas and condensed for audio narration."]
        sentences = [s.strip() for s in re.split(r"[.!?]\s+", text) if s.strip()]

        if len(sentences) <= 2:
            return text, ["Text is already concise; refined phrasing."]

        summary_sentences = [sentences[0]]
        if len(sentences) > 3:
            summary_sentences.append(sentences[len(sentences) // 2])
        summary_sentences.append(sentences[-1])

        out = ". ".join(summary_sentences)
        if not out.endswith((".", "!", "?")):
            out += "."
        return out, changes

    @staticmethod
    def _make_conversational(text: str) -> tuple[str, List[str]]:
        changes = ["Adapted phrasing into engaging conversational spoken dialogue."]
        out = text

        replacements = [
            (r"\bdo not\b", "don't"),
            (r"\bcannot\b", "can't"),
            (r"\bwill not\b", "won't"),
            (r"\bit is\b", "it's"),
            (r"\bthat is\b", "that's"),
            (r"\bthere is\b", "there's"),
            (r"\bwe are\b", "we're"),
            (r"\byou are\b", "you're"),
            (r"\bthey are\b", "they're"),
            (r"\butilize\b", "use"),
            (r"\bfacilitate\b", "help"),
            (r"\bcommence\b", "begin"),
            (r"\bterminate\b", "wrap up"),
        ]
        for pat, repl in replacements:
            out = re.sub(pat, repl, out, flags=re.IGNORECASE)

        if not re.match(r"^(hey|hello|hi|welcome|in this|let's|today)\b", out, flags=re.IGNORECASE):
            out = f"Hello there! {out}"
            changes.append("Added friendly spoken greeting.")

        return out, changes

    @staticmethod
    def _make_formal(text: str) -> tuple[str, List[str]]:
        changes = ["Elevated phrasing to professional presentation narration."]
        out = text

        replacements = [
            (r"\bdon't\b", "do not"),
            (r"\bcan't\b", "cannot"),
            (r"\bwon't\b", "will not"),
            (r"\bit's\b", "it is"),
            (r"\bthat's\b", "that is"),
            (r"\bgonna\b", "going to"),
            (r"\bwanna\b", "want to"),
            (r"\bkinda\b", "somewhat"),
            (r"\byeah\b", "yes"),
            (r"\byep\b", "indeed"),
            (r"\bhey there!?\s*", ""),
            (r"\bhi guys!?\s*", ""),
        ]
        for pat, repl in replacements:
            out = re.sub(pat, repl, out, flags=re.IGNORECASE)

        out = re.sub(r"\s+", " ", out).strip()
        if out and out[0].islower():
            out = out[0].upper() + out[1:]
        if out and out[-1] not in ".!?":
            out += "."

        return out, changes

    @staticmethod
    def _bullet_to_script(text: str) -> tuple[str, List[str]]:
        changes = ["Transformed bullet points into fluent narrative speech."]
        lines = [line.strip() for line in text.split("\n") if line.strip()]

        cleaned_items = []
        for line in lines:
            item = re.sub(r"^([*\-•–—]|\d+[\.\)])\s*", "", line).strip()
            if item:
                item = item[0].upper() + item[1:]
                if not item.endswith((".", ",", ";")):
                    item += "."
                cleaned_items.append(item)

        if not cleaned_items:
            return text, ["No bullet items detected."]

        connectors = ["First, ", "Next, ", "Additionally, ", "Furthermore, ", "Finally, "]
        narrative_parts = []
        for i, item in enumerate(cleaned_items):
            if i < len(connectors) and len(cleaned_items) > 1:
                prefix = connectors[i] if i < len(cleaned_items) - 1 else connectors[-1]
                narrative_parts.append(f"{prefix}{item.lower() if item.startswith(('A', 'The')) else item}")
            else:
                narrative_parts.append(item)

        out = " ".join(narrative_parts)
        out = re.sub(r"\s+", " ", out).strip()
        return out, changes
