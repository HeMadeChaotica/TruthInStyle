#!/usr/bin/env python3
"""Extract private source-grounding text from Mista.Thicc's Nutrition textbook."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "private" / "issa" / "nutrition-textbook"
CHAPTER_RANGES = {
    1: (9, 20), 2: (21, 54), 3: (55, 76), 4: (77, 94),
    5: (95, 116), 6: (117, 138), 7: (139, 164), 8: (165, 192),
    9: (193, 208), 10: (209, 226), 11: (227, 252), 12: (253, 276),
    13: (277, 294), 14: (295, 306), 15: (307, 332), 16: (333, 344),
    17: (345, 374), 18: (375, 417),
}


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: generate_issa_nutrition_textbook_context.py <nutrition-textbook.pdf>")
    source = Path(sys.argv[1]).expanduser().resolve()
    if not source.is_file():
        raise SystemExit(f"textbook not found: {source}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    document = fitz.open(source)
    for chapter, (start, end) in CHAPTER_RANGES.items():
        pages = [
            {"page": page_number, "text": clean(document[page_number - 1].get_text())}
            for page_number in range(start, end + 1)
        ]
        (OUTPUT_DIR / f"chapter-{chapter:02d}.json").write_text(
            json.dumps({"chapter": chapter, "pages": pages}, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
    print(f"generated {len(CHAPTER_RANGES)} nutrition source-grounding chapter files")


if __name__ == "__main__":
    main()
