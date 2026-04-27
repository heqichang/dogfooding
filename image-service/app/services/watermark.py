import os
import platform
from typing import Tuple, Optional

from PIL import Image, ImageDraw, ImageFont

from app.core.exceptions import ImageProcessingError
from app.models.schemas import WatermarkPosition


def _get_system_font_paths() -> list:
    system = platform.system()
    paths = []
    
    if system == "Windows":
        windir = os.environ.get("WINDIR", "C:\\Windows")
        fonts_dir = os.path.join(windir, "Fonts")
        paths.extend([
            os.path.join(fonts_dir, "arial.ttf"),
            os.path.join(fonts_dir, "times.ttf"),
            os.path.join(fonts_dir, "cour.ttf"),
            os.path.join(fonts_dir, "verdana.ttf"),
            os.path.join(fonts_dir, "calibri.ttf"),
        ])
    elif system == "Darwin":
        paths.extend([
            "/Library/Fonts/Arial.ttf",
            "/Library/Fonts/Times New Roman.ttf",
            "/Library/Fonts/Courier New.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
        ])
    else:
        paths.extend([
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/TTF/arial.ttf",
        ])
    
    return paths


def _get_default_font(size: int) -> ImageFont.FreeTypeFont:
    font_paths = _get_system_font_paths()
    
    for font_path in font_paths:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except (IOError, OSError):
                continue
    
    return ImageFont.load_default()


def _calculate_position(
    orig_size: Tuple[int, int],
    watermark_size: Tuple[int, int],
    position: str,
    margin: int,
) -> Tuple[int, int]:
    orig_width, orig_height = orig_size
    wm_width, wm_height = watermark_size
    
    pos_map = {
        WatermarkPosition.TOP_LEFT.value: (margin, margin),
        WatermarkPosition.TOP_RIGHT.value: (orig_width - wm_width - margin, margin),
        WatermarkPosition.BOTTOM_LEFT.value: (margin, orig_height - wm_height - margin),
        WatermarkPosition.BOTTOM_RIGHT.value: (orig_width - wm_width - margin, orig_height - wm_height - margin),
        WatermarkPosition.CENTER.value: ((orig_width - wm_width) // 2, (orig_height - wm_height) // 2),
    }
    
    pos_lower = position.lower() if isinstance(position, str) else position
    
    x, y = pos_map.get(pos_lower, pos_map[WatermarkPosition.BOTTOM_RIGHT.value])
    
    x = max(0, min(x, orig_width - wm_width))
    y = max(0, min(y, orig_height - wm_height))
    
    return x, y


def _validate_opacity(value: float) -> None:
    if not (0 <= value <= 1):
        raise ImageProcessingError("Opacity must be between 0 and 1")


def _validate_margin(value: int) -> None:
    if value < 0:
        raise ImageProcessingError("Margin must be a non-negative integer")


def add_text_watermark(
    image: Image.Image,
    text: str,
    position: str = WatermarkPosition.BOTTOM_RIGHT,
    font_size: int = 36,
    color: Tuple[int, int, int] = (255, 255, 255),
    opacity: float = 0.8,
    margin: int = 20,
) -> Image.Image:
    if not text or not text.strip():
        return image
    
    if font_size <= 0:
        raise ImageProcessingError("Font size must be a positive integer")
    
    _validate_opacity(opacity)
    _validate_margin(margin)
    
    orig_mode = image.mode
    if orig_mode != "RGBA":
        image = image.convert("RGBA")
    
    overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    
    font = _get_default_font(font_size)
    
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x, y = _calculate_position(image.size, (text_width, text_height), position, margin)
    
    alpha = int(opacity * 255)
    fill_color = color + (alpha,)
    
    draw.text((x, y), text, font=font, fill=fill_color)
    
    result = Image.alpha_composite(image, overlay)
    
    if orig_mode != "RGBA":
        result = result.convert(orig_mode)
    
    return result


def add_image_watermark(
    image: Image.Image,
    watermark_image: Image.Image,
    position: str = WatermarkPosition.BOTTOM_RIGHT,
    opacity: float = 0.5,
    scale: float = 0.2,
    margin: int = 20,
) -> Image.Image:
    if scale <= 0:
        raise ImageProcessingError("Scale must be a positive number")
    
    _validate_opacity(opacity)
    _validate_margin(margin)
    
    orig_mode = image.mode
    if orig_mode != "RGBA":
        image = image.convert("RGBA")
    
    orig_width, orig_height = image.size
    
    wm_width = int(orig_width * scale)
    wm_height = int(watermark_image.height * (wm_width / watermark_image.width))
    
    max_scale = 0.8
    if wm_width > orig_width * max_scale or wm_height > orig_height * max_scale:
        max_dim = min(orig_width * max_scale, orig_height * max_scale)
        if wm_width > wm_height:
            wm_width = int(max_dim)
            wm_height = int(watermark_image.height * (wm_width / watermark_image.width))
        else:
            wm_height = int(max_dim)
            wm_width = int(watermark_image.width * (wm_height / watermark_image.height))
    
    resized_watermark = watermark_image.resize(
        (wm_width, wm_height),
        Image.Resampling.LANCZOS,
    )
    
    if resized_watermark.mode != "RGBA":
        resized_watermark = resized_watermark.convert("RGBA")
    
    x, y = _calculate_position(image.size, (wm_width, wm_height), position, margin)
    
    if opacity < 1.0:
        alpha = resized_watermark.split()[3]
        alpha = alpha.point(lambda p: int(p * opacity))
        resized_watermark.putalpha(alpha)
    
    overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
    overlay.paste(resized_watermark, (x, y), mask=resized_watermark)
    
    result = Image.alpha_composite(image, overlay)
    
    if orig_mode != "RGBA":
        result = result.convert(orig_mode)
    
    return result
