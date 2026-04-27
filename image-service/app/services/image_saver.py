import io
from typing import Dict, Optional

from PIL import Image

from app.core.exceptions import (
    ImageProcessingError,
    InvalidImageFormatError,
)
from app.models.schemas import ImageFormat

FORMAT_MIMETYPES: Dict[str, str] = {
    ImageFormat.JPEG.value: "image/jpeg",
    ImageFormat.PNG.value: "image/png",
    ImageFormat.WEBP.value: "image/webp",
    ImageFormat.AVIF.value: "image/avif",
}

FORMAT_ALIASES: Dict[str, str] = {
    "jpg": "jpeg",
}


def get_format_mimetype(format: str) -> str:
    format_lower = format.lower()
    format_lower = FORMAT_ALIASES.get(format_lower, format_lower)

    mimetype = FORMAT_MIMETYPES.get(format_lower)
    if mimetype is None:
        raise InvalidImageFormatError(
            f"Unsupported format: {format}. Supported formats: {', '.join(FORMAT_MIMETYPES.keys())}"
        )
    return mimetype


def detect_format(image: Image.Image) -> str:
    format_lower = (image.format or "").lower()
    format_lower = FORMAT_ALIASES.get(format_lower, format_lower)

    if format_lower and format_lower in FORMAT_MIMETYPES:
        return format_lower

    if image.mode == "RGBA" or image.mode == "LA":
        return ImageFormat.PNG.value

    return ImageFormat.JPEG.value


def _prepare_image_for_jpeg(image: Image.Image) -> Image.Image:
    if image.mode in ("RGBA", "LA"):
        background = Image.new("RGB", image.size, (255, 255, 255))
        if image.mode == "RGBA":
            background.paste(image, mask=image.split()[3])
        else:
            background.paste(image, mask=image.split()[1])
        return background
    elif image.mode != "RGB":
        return image.convert("RGB")
    return image


def _save_jpeg(
    image: Image.Image,
    buffer: io.BytesIO,
    quality: int = 80,
    progressive: bool = False,
    **kwargs,
) -> None:
    prepared = _prepare_image_for_jpeg(image)
    prepared.save(
        buffer,
        format="JPEG",
        quality=quality,
        progressive=progressive,
        **kwargs,
    )


def _save_png(
    image: Image.Image,
    buffer: io.BytesIO,
    optimize: bool = True,
    compress_level: int = 6,
    interlace: bool = False,
    **kwargs,
) -> None:
    image.save(
        buffer,
        format="PNG",
        optimize=optimize,
        compress_level=compress_level,
        interlace=interlace,
        **kwargs,
    )


def _save_webp(
    image: Image.Image,
    buffer: io.BytesIO,
    quality: int = 80,
    lossless: bool = False,
    **kwargs,
) -> None:
    image.save(
        buffer,
        format="WebP",
        quality=quality,
        lossless=lossless,
        **kwargs,
    )


def _save_avif(
    image: Image.Image,
    buffer: io.BytesIO,
    quality: int = 80,
    **kwargs,
) -> None:
    image.save(
        buffer,
        format="AVIF",
        quality=quality,
        **kwargs,
    )


SAVE_FUNCTIONS: Dict[str, callable] = {
    ImageFormat.JPEG.value: _save_jpeg,
    ImageFormat.PNG.value: _save_png,
    ImageFormat.WEBP.value: _save_webp,
    ImageFormat.AVIF.value: _save_avif,
}


def save_to_bytes(
    image: Image.Image,
    format: str,
    quality: int = 80,
    **kwargs,
) -> bytes:
    format_lower = format.lower()
    format_lower = FORMAT_ALIASES.get(format_lower, format_lower)

    save_func = SAVE_FUNCTIONS.get(format_lower)
    if save_func is None:
        raise InvalidImageFormatError(
            f"Unsupported format: {format}. Supported formats: {', '.join(SAVE_FUNCTIONS.keys())}"
        )

    buffer = io.BytesIO()
    try:
        save_func(image, buffer, quality=quality, **kwargs)
    except Exception as e:
        raise ImageProcessingError(f"Failed to save image: {str(e)}") from e

    buffer.seek(0)
    return buffer.getvalue()
