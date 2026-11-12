#!/usr/bin/env python3
"""Build the private THICC.SCHOOL workbook viewer from the user's CPT workbook.

The source PDF is deliberately not copied into the repository. This script
creates authenticated page images plus the minimum field metadata needed by
the app. Run it only with the user's own fillable workbook.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

import fitz
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PAGE_DIR = ROOT / "private" / "issa" / "cpt11-workbook" / "pages"
LAYOUT_PATH = ROOT / "lib" / "thiccSchool" / "cptWorkbookLayout.mjs"
CONTEXT_PATH = ROOT / "src" / "server" / "cptWorkbookContext.mjs"
TARGET_WIDTH = 1100


def clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def field_prompt(page: fitz.Page, widget: fitz.Widget) -> str:
    label = clean(widget.field_label or widget.field_name)
    blocks = []
    for block in page.get_text("blocks"):
        x0, y0, x1, y1, text, *_ = block
        text = clean(text)
        if not text or y1 > widget.rect.y0 + 8 or y1 < widget.rect.y0 - 190:
            continue
        blocks.append((y1, text))
    nearby = " ".join(text for _, text in sorted(blocks)[-3:])
    if label and not label.isdigit() and not label.lower().startswith("undefined"):
        return clean(f"{nearby} Field: {label}")[-1400:]
    return nearby[-1400:]


def mjs_export(name: str, value) -> str:
    return f"export const {name} = {json.dumps(value, ensure_ascii=False, separators=(',', ':'))};\n"


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: generate_issa_cpt_workbook_assets.py <fillable-workbook.pdf>")

    source = Path(sys.argv[1]).expanduser().resolve()
    if not source.is_file():
        raise SystemExit(f"workbook not found: {source}")

    PAGE_DIR.mkdir(parents=True, exist_ok=True)
    LAYOUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONTEXT_PATH.parent.mkdir(parents=True, exist_ok=True)

    document = fitz.open(source)
    layout = {}
    context = {}
    total_fields = 0

    for index, page in enumerate(document):
        page_number = index + 1
        if page_number < 3:
            continue

        page_width = float(page.rect.width)
        page_height = float(page.rect.height)
        scale = TARGET_WIDTH / page_width
        pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        image.save(PAGE_DIR / f"{page_number:03d}.jpg", "JPEG", quality=84, optimize=True, progressive=True)

        fields = []
        field_context = {}
        for field_index, widget in enumerate(page.widgets() or []):
            seed = f"{page_number}:{field_index}:{widget.field_name}".encode("utf-8")
            field_id = f"wb-p{page_number:03d}-{hashlib.sha1(seed).hexdigest()[:10]}"
            rect = widget.rect
            label = clean(widget.field_label or widget.field_name) or f"Response {field_index + 1}"
            prompt = field_prompt(page, widget)
            field = {
                "id": field_id,
                "label": label,
                "x": round((rect.x0 / page_width) * 100, 4),
                "y": round((rect.y0 / page_height) * 100, 4),
                "width": round((rect.width / page_width) * 100, 4),
                "height": round((rect.height / page_height) * 100, 4),
                "multiline": bool(int(widget.field_flags or 0) & 4096) or rect.height > 32,
            }
            fields.append(field)
            field_context[field_id] = {"label": label, "prompt": prompt}

        total_fields += len(fields)
        layout[str(page_number)] = {
            "number": page_number,
            "width": round(page_width, 2),
            "height": round(page_height, 2),
            "fields": fields,
        }
        context[str(page_number)] = {
            "text": clean(page.get_text()),
            "fields": field_context,
        }

    layout_header = "// Generated from the user's fillable CPT11 workbook. Do not edit by hand.\n"
    LAYOUT_PATH.write_text(
        layout_header
        + mjs_export("CPT_WORKBOOK_PAGES", layout)
        + mjs_export("CPT_WORKBOOK_PAGE_NUMBERS", [int(number) for number in layout])
        + f"export const CPT_WORKBOOK_FIELD_COUNT = {total_fields};\n",
        encoding="utf-8",
    )
    CONTEXT_PATH.write_text(
        "// Server-only assessment context generated from the user's workbook.\n"
        + mjs_export("CPT_WORKBOOK_CONTEXT", context),
        encoding="utf-8",
    )
    print(f"generated {len(layout)} workbook pages and {total_fields} fields")


if __name__ == "__main__":
    main()
