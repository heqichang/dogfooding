import io
from typing import Set
from pathlib import Path

import httpx
from PIL import Image, UnidentifiedImageError
import pillow_avif
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import (
    ImageProcessingError,
    InvalidImageFormatError,
    ImageTooLargeError,
    DownloadError,
)
from app.models.schemas import ImageFormat

SUPPORTED_FORMATS: Set[str] = {
    ImageFormat.JPEG.value,
    ImageFormat.PNG.value,
    ImageFormat.WEBP.value,
    ImageFormat.AVIF.value,
}

SUPPORTED_EXTENSIONS: Set[str] = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".avif",
}


def _validate_size(data: bytes) -> None:
    if len(data) > settings.MAX_IMAGE_SIZE:
        raise ImageTooLargeError(
            f"Image size exceeds maximum allowed size of {settings.MAX_IMAGE_SIZE} bytes"
        )


def _validate_resolution(image: Image.Image) -> None:
    max_width, max_height = settings.MAX_RESOLUTION
    if image.width > max_width or image.height > max_height:
        raise ImageTooLargeError(
            f"Image resolution ({image.width}x{image.height}) exceeds maximum allowed ({max_width}x{max_height})"
        )


def _validate_format(image: Image.Image) -> None:
    format_lower = (image.format or "").lower()
    if format_lower not in SUPPORTED_FORMATS:
        raise InvalidImageFormatError(
            f"Unsupported image format: {image.format}. Supported formats: {', '.join(SUPPORTED_FORMATS)}"
        )


def _open_image(data: bytes) -> Image.Image:
    try:
        image = Image.open(io.BytesIO(data))
        image.load()
        return image
    except UnidentifiedImageError as e:
        raise InvalidImageFormatError("Cannot identify image format") from e
    except Exception as e:
        raise ImageProcessingError(f"Failed to open image: {str(e)}") from e


async def load_from_url(url: str) -> Image.Image:
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            response = await client.get(
                url,
                headers={"User-Agent": "image-service/1.0.0"},
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise DownloadError(f"Failed to download image: HTTP {e.response.status_code}") from e
        except httpx.RequestError as e:
            raise DownloadError(f"Failed to download image: {str(e)}") from e

    data = response.content
    _validate_size(data)

    image = _open_image(data)
    _validate_resolution(image)
    _validate_format(image)

    return image


async def load_from_bytes(data: bytes) -> Image.Image:
    _validate_size(data)

    image = _open_image(data)
    _validate_resolution(image)
    _validate_format(image)

    return image


async def load_from_upload_file(file: UploadFile) -> Image.Image:
    filename = file.filename or ""
    file_ext = Path(filename).suffix.lower()

    if file_ext and file_ext not in SUPPORTED_EXTENSIONS:
        raise InvalidImageFormatError(
            f"Unsupported file extension: {file_ext}. Supported extensions: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    data = await file.read()
    _validate_size(data)

    image = _open_image(data)
    _validate_resolution(image)
    _validate_format(image)

    return image
