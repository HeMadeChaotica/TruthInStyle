#!/usr/bin/env python3
"""Extract private, source-grounding text from the user's CPT11 textbook."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "private" / "issa" / "cpt11-textbook"
CHAPTER_RANGES = {
    1: (9, 20), 2: (21, 56), 3: (57, 94), 4: (95, 128),
    5: (129, 180), 6: (181, 202), 7: (203, 262), 8: (263, 284),
    9: (285, 310), 10: (311, 366), 11: (367, 412), 12: (413, 462),
    13: (463, 520), 14: (521, 556), 15: (557, 616), 16: (617, 652),
    17: (653, 682), 18: (683, 714), 19: (715, 762), 20: (763, 781),
}


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: generate_issa_cpt_textbook_context.py <cpt11-textbook.pdf>")
    source = Path(sys.argv[1]).expanduser().resolve()
    if not source.is_file():
        raise SystemExit(f"textbook not found: {source}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    document = fitz.open(source)
    for chapter, (start, end) in CHAPTER_RANGES.items():
        pages = []
        for page_number in range(start, end + 1):
            pages.append({"page": page_number, "text": clean(document[page_number - 1].get_text())})
        (OUTPUT_DIR / f"chapter-{chapter:02d}.json").write_text(
            json.dumps({"chapter": chapter, "pages": pages}, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
    print(f"generated {len(CHAPTER_RANGES)} source-grounding chapter files")


if __name__ == "__main__":
    main()
