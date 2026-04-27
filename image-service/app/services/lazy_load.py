import io
from typing import Tuple, Optional

from PIL import Image

from app.core.exceptions import ImageProcessingError
from app.services import image_transform
from app.services.image_saver import save_to_bytes


def generate_lqip(
    image: Image.Image,
    max_dimension: int = 20,
    quality: int = 10,
) -> bytes:
    if max_dimension <= 0:
        raise ImageProcessingError("Max dimension must be a positive integer")
    
    if not (0 <= quality <= 100):
        raise ImageProcessingError("Quality must be between 0 and 100")
    
    orig_width, orig_height = image.size
    
    if orig_width > orig_height:
        new_width = max_dimension
        new_height = int(orig_height * (max_dimension / orig_width))
    else:
        new_height = max_dimension
        new_width = int(orig_width * (max_dimension / orig_height))
    
    new_width = max(1, new_width)
    new_height = max(1, new_height)
    
    resized = image.resize(
        (new_width, new_height),
        Image.Resampling.LANCZOS,
    )
    
    return save_to_bytes(resized, format="jpeg", quality=quality)


def generate_svg_placeholder(
    image: Image.Image,
    max_dimension: int = 20,
) -> str:
    if max_dimension <= 0:
        raise ImageProcessingError("Max dimension must be a positive integer")
    
    orig_width, orig_height = image.size
    
    if orig_width > orig_height:
        new_width = max_dimension
        new_height = int(orig_height * (max_dimension / orig_width))
    else:
        new_height = max_dimension
        new_width = int(orig_width * (max_dimension / orig_height))
    
    new_width = max(1, new_width)
    new_height = max(1, new_height)
    
    resized = image.resize(
        (new_width, new_height),
        Image.Resampling.LANCZOS,
    )
    
    if resized.mode != "RGB":
        resized = resized.convert("RGB")
    
    pixels = list(resized.getdata())
    
    colors = []
    for i in range(new_height):
        row_colors = []
        for j in range(new_width):
            r, g, b = pixels[i * new_width + j]
            row_colors.append(f"#{r:02x}{g:02x}{b:02x}")
        colors.append(row_colors)
    
    pixel_width = orig_width / new_width
    pixel_height = orig_height / new_height
    
    svg_parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {orig_width} {orig_height}" '
        f'preserveAspectRatio="none">'
    ]
    
    for y, row in enumerate(colors):
        for x, color in enumerate(row):
            svg_parts.append(
                f'<rect x="{x * pixel_width}" '
                f'y="{y * pixel_height}" '
                f'width="{pixel_width}" '
                f'height="{pixel_height}" '
                f'fill="{color}"/>'
            )
    
    svg_parts.append("</svg>")
    
    return "".join(svg_parts)


def generate_progressive_jpeg(
    image: Image.Image,
    quality: int = 80,
) -> bytes:
    if not (0 <= quality <= 100):
        raise ImageProcessingError("Quality must be between 0 and 100")
    
    return save_to_bytes(image, format="jpeg", quality=quality, progressive=True)


def generate_interlaced_png(
    image: Image.Image,
    compress_level: int = 6,
) -> bytes:
    if not (0 <= compress_level <= 9):
        raise ImageProcessingError("Compress level must be between 0 and 9")
    
    return save_to_bytes(image, format="png", compress_level=compress_level, interlace=True)


def get_lqip_base64(
    image: Image.Image,
    max_dimension: int = 20,
    quality: int = 10,
) -> str:
    import base64
    
    lqip_bytes = generate_lqip(image, max_dimension, quality)
    base64_data = base64.b64encode(lqip_bytes).decode("ascii")
    return f"data:image/jpeg;base64,{base64_data}"


def get_blurhash_placeholder(
    image: Image.Image,
    components_x: int = 4,
    components_y: int = 3,
) -> str:
    try:
        import blurhash
    except ImportError:
        raise ImageProcessingError(
            "blurhash library is not installed. "
            "Install it with: pip install blurhash"
        )
    
    try:
        import numpy as np
    except ImportError:
        raise ImageProcessingError(
            "numpy is not installed but required for blurhash."
        )
    
    if components_x < 1 or components_x > 9:
        raise ImageProcessingError("components_x must be between 1 and 9")
    
    if components_y < 1 or components_y > 9:
        raise ImageProcessingError("components_y must be between 1 and 9")
    
    if image.mode != "RGB":
        image = image.convert("RGB")
    
    image_array = np.array(image)
    
    return blurhash.encode(image_array, components_x, components_y)
