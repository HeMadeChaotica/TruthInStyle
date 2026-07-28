#!/usr/bin/env python3
"""Build the transparent Mista.THICC OPEN SESAME activation animation."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
DORMANT_PATH = ROOT / "public/opening/chaotica-opening-entrance-closed.png"
ACTIVATED_PATH = ROOT / "public/opening/chaotica-opening-entrance-activated.png"
OUTPUT_PATH = ROOT / "public/opening/mistathicc-open-sesame.webp"

SIZE = 768
FPS = 30
DURATION_SECONDS = 1.7
FRAME_COUNT = round(FPS * DURATION_SECONDS)


def clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def smoothstep(value: float) -> float:
    value = clamp(value)
    return value * value * (3 - 2 * value)


def ease_out_back(value: float) -> float:
    value = clamp(value)
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2


def scaled_layer(image: Image.Image, scale: float, opacity: float, dx: int = 0, dy: int = 0) -> Image.Image:
    width = max(1, round(SIZE * scale))
    resized = image.resize((width, width), Image.Resampling.LANCZOS)
    if opacity < 1:
        alpha = resized.getchannel("A").point(lambda value: round(value * clamp(opacity)))
        resized.putalpha(alpha)
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    layer.alpha_composite(resized, ((SIZE - width) // 2 + dx, (SIZE - width) // 2 + dy))
    return layer


def pink_glow(source: Image.Image, radius: int, opacity: float) -> Image.Image:
    alpha = source.getchannel("A").filter(ImageFilter.GaussianBlur(radius))
    alpha = alpha.point(lambda value: round(value * clamp(opacity)))
    glow = Image.new("RGBA", source.size, (255, 56, 132, 0))
    glow.putalpha(alpha)
    return glow


def shockwave(progress: float) -> Image.Image:
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    if not 0 < progress < 1:
        return layer
    draw = ImageDraw.Draw(layer)
    radius = round(SIZE * (0.22 + 0.5 * ease_out_back(progress)))
    alpha = round(220 * (1 - progress) ** 1.5)
    width = max(2, round(18 * (1 - progress)))
    box = (SIZE // 2 - radius, SIZE // 2 - radius, SIZE // 2 + radius, SIZE // 2 + radius)
    draw.ellipse(box, outline=(255, 104, 164, alpha), width=width)
    return layer.filter(ImageFilter.GaussianBlur(2))


def flash(progress: float) -> Image.Image:
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    if progress <= 0:
        return layer
    peak = math.sin(math.pi * clamp(progress))
    radius = round(SIZE * (0.06 + 0.25 * progress))
    center_x = SIZE // 2
    center_y = round(SIZE * 0.62)
    draw = ImageDraw.Draw(layer)
    for current_radius in range(radius, 0, -4):
        normalized = 1 - current_radius / max(1, radius)
        alpha = round(235 * peak * normalized ** 2.2)
        box = (
            center_x - current_radius,
            center_y - current_radius,
            center_x + current_radius,
            center_y + current_radius,
        )
        draw.ellipse(box, fill=(255, 216, 230, alpha))
    return layer.filter(ImageFilter.GaussianBlur(3))


def build_frames() -> list[Image.Image]:
    dormant = Image.open(DORMANT_PATH).convert("RGBA").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    activated = Image.open(ACTIVATED_PATH).convert("RGBA").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    frames: list[Image.Image] = []

    for index in range(FRAME_COUNT):
        time = index / (FRAME_COUNT - 1)
        frame = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

        press = smoothstep(clamp(time / 0.16))
        release = ease_out_back(clamp((time - 0.16) / 0.42))
        reveal = smoothstep(clamp((time - 0.12) / 0.34))
        settle = smoothstep(clamp((time - 0.62) / 0.38))

        dormant_scale = 1 - 0.045 * press + 0.035 * release
        dormant_opacity = 1 - reveal

        active_scale = 0.94 + 0.18 * release - 0.065 * settle
        active_opacity = reveal

        shake_strength = 9 * math.sin(math.pi * clamp((time - 0.28) / 0.34))
        dx = round(math.sin(index * 2.7) * shake_strength)
        dy = round(math.cos(index * 2.1) * shake_strength * 0.55)

        dormant_layer = scaled_layer(dormant, dormant_scale, dormant_opacity)
        active_layer = scaled_layer(activated, active_scale, active_opacity, dx, dy)

        frame.alpha_composite(pink_glow(active_layer, 10, active_opacity * (0.12 + 0.10 * (1 - settle))))
        frame.alpha_composite(dormant_layer)
        frame.alpha_composite(active_layer)
        frame.alpha_composite(shockwave(clamp((time - 0.30) / 0.46)))
        frame.alpha_composite(flash(clamp((time - 0.26) / 0.34)))

        peak = math.sin(math.pi * clamp((time - 0.22) / 0.58))
        if peak > 0:
            frame = ImageEnhance.Brightness(frame).enhance(1 + 0.22 * peak)
            frame = ImageEnhance.Contrast(frame).enhance(1 + 0.08 * peak)

        pixels = frame.load()
        for y in range(SIZE):
            for x in range(SIZE):
                red, green, blue, alpha = pixels[x, y]
                if alpha <= 8:
                    pixels[x, y] = (0, 0, 0, 0)

        frames.append(frame)

    return frames


def main() -> None:
    frames = build_frames()
    frames[0].save(
        OUTPUT_PATH,
        save_all=True,
        append_images=frames[1:],
        duration=round(1000 / FPS),
        loop=0,
        lossless=False,
        quality=88,
        method=4,
        minimize_size=True,
    )
    result = Image.open(OUTPUT_PATH)
    print(f"Wrote {OUTPUT_PATH}")
    print(f"Frames: {getattr(result, 'n_frames', 1)}")
    print(f"Mode: {result.mode}; size: {result.size}")


if __name__ == "__main__":
    main()
