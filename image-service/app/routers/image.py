from typing import Optional
from fastapi import (
    APIRouter,
    Query,
    UploadFile,
    File,
    HTTPException,
    Request,
    Response,
)
from fastapi.responses import StreamingResponse
import io
import hashlib
from datetime import datetime, timezone

from app.core.config import settings
from app.core.exceptions import (
    ImageProcessingError,
    InvalidImageFormatError,
    ImageTooLargeError,
    DownloadError,
)
from app.core.logging import get_logger
from app.models.schemas import ErrorResponse
from app.services import image_loader
from app.services.processor import (
    ProcessingParams,
    params_from_query,
    process_image,
)

router = APIRouter(prefix="/api/v1", tags=["image"])
logger = get_logger(__name__)


def _get_cache_headers(etag: str) -> dict:
    return {
        "Cache-Control": f"public, max-age={settings.CACHE_MAX_AGE}, s-maxage={settings.CACHE_MAX_AGE * 2}",
        "ETag": f'"{etag}"',
        "Last-Modified": datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT"),
        "Vary": "Accept, Accept-Encoding",
    }


def _handle_processing_error(e: Exception) -> HTTPException:
    logger.error(f"Image processing error: {str(e)}", exc_info=True)
    
    if isinstance(e, InvalidImageFormatError):
        return HTTPException(
            status_code=400,
            detail={"error": "invalid_format", "message": str(e)},
        )
    elif isinstance(e, ImageTooLargeError):
        return HTTPException(
            status_code=400,
            detail={"error": "image_too_large", "message": str(e)},
        )
    elif isinstance(e, DownloadError):
        return HTTPException(
            status_code=400,
            detail={"error": "download_failed", "message": str(e)},
        )
    elif isinstance(e, ImageProcessingError):
        return HTTPException(
            status_code=400,
            detail={"error": "processing_error", "message": str(e)},
        )
    else:
        return HTTPException(
            status_code=500,
            detail={"error": "internal_error", "message": "An unexpected error occurred"},
        )


def _check_etag_match(request: Request, etag: str) -> bool:
    if_none_match = request.headers.get("if-none-match")
    if if_none_match:
        if_none_match = if_none_match.strip()
        if if_none_match.startswith("W/"):
            if_none_match = if_none_match[2:]
        if if_none_match.startswith('"') and if_none_match.endswith('"'):
            if_none_match = if_none_match[1:-1]
        if if_none_match == etag:
            return True
        if if_none_match == "*":
            return True
    return False


@router.get(
    "/image",
    responses={
        200: {"content": {"image/*": {}}},
        304: {"description": "Not Modified"},
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="Process image from URL",
    description="Process an image from a URL with various transformations.",
)
async def process_image_from_url(
    request: Request,
    url: str = Query(..., description="Source image URL"),
    w: Optional[int] = Query(None, description="Target width in pixels", ge=1),
    h: Optional[int] = Query(None, description="Target height in pixels", ge=1),
    fit: str = Query("cover", description="Fit mode: cover, contain, fill, inside, outside"),
    method: str = Query("lanczos", description="Resize method: lanczos, bicubic, bilinear, nearest"),
    q: int = Query(80, description="Quality (0-100)", ge=0, le=100),
    f: Optional[str] = Query(None, description="Output format: jpeg, png, webp, avif"),
    rotate: float = Query(0.0, description="Rotation angle in degrees"),
    flip: Optional[str] = Query(None, description="Flip direction: horizontal, vertical"),
    smart_crop: bool = Query(False, description="Enable smart center cropping"),
    face_aware: bool = Query(False, description="Enable face-aware cropping"),
    watermark: Optional[str] = Query(None, description="Text watermark content"),
    watermark_pos: str = Query("bottom_right", description="Watermark position: top_left, top_right, bottom_left, bottom_right, center"),
    watermark_size: int = Query(36, description="Watermark font size", ge=1),
    watermark_color: str = Query("ffffff", description="Watermark color (hex or rgb)"),
    watermark_opacity: float = Query(0.8, description="Watermark opacity (0-1)", ge=0, le=1),
    watermark_margin: int = Query(20, description="Watermark margin in pixels", ge=0),
    lqip: bool = Query(False, description="Generate low-quality image placeholder"),
    lqip_dim: int = Query(20, description="LQIP max dimension", ge=1),
    lqip_q: int = Query(10, description="LQIP quality", ge=0, le=100),
    progressive: bool = Query(False, description="Generate progressive JPEG"),
    interlace: bool = Query(False, description="Generate interlaced PNG"),
    lossless: bool = Query(False, description="Use lossless compression (WebP only)"),
):
    query_params = dict(request.query_params)
    
    try:
        params = params_from_query(query_params)
        
        image = await image_loader.load_from_url(url)
        
        original_image_hash = hashlib.md5(url.encode()).hexdigest()
        
        output_bytes, mime_type, etag = process_image(image, params, original_image_hash)
        
        if _check_etag_match(request, etag):
            return Response(status_code=304)
        
        return StreamingResponse(
            io.BytesIO(output_bytes),
            media_type=mime_type,
            headers=_get_cache_headers(etag),
        )
    
    except Exception as e:
        raise _handle_processing_error(e)


@router.post(
    "/image",
    responses={
        200: {"content": {"image/*": {}}},
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="Process uploaded image",
    description="Process an uploaded image file with various transformations.",
)
async def process_uploaded_image(
    request: Request,
    file: UploadFile = File(..., description="Image file to process"),
    w: Optional[int] = Query(None, description="Target width in pixels", ge=1),
    h: Optional[int] = Query(None, description="Target height in pixels", ge=1),
    fit: str = Query("cover", description="Fit mode: cover, contain, fill, inside, outside"),
    method: str = Query("lanczos", description="Resize method: lanczos, bicubic, bilinear, nearest"),
    q: int = Query(80, description="Quality (0-100)", ge=0, le=100),
    f: Optional[str] = Query(None, description="Output format: jpeg, png, webp, avif"),
    rotate: float = Query(0.0, description="Rotation angle in degrees"),
    flip: Optional[str] = Query(None, description="Flip direction: horizontal, vertical"),
    smart_crop: bool = Query(False, description="Enable smart center cropping"),
    face_aware: bool = Query(False, description="Enable face-aware cropping"),
    watermark: Optional[str] = Query(None, description="Text watermark content"),
    watermark_pos: str = Query("bottom_right", description="Watermark position"),
    watermark_size: int = Query(36, description="Watermark font size"),
    watermark_color: str = Query("ffffff", description="Watermark color"),
    watermark_opacity: float = Query(0.8, description="Watermark opacity"),
    watermark_margin: int = Query(20, description="Watermark margin"),
    lqip: bool = Query(False, description="Generate LQIP"),
    lqip_dim: int = Query(20, description="LQIP max dimension"),
    lqip_q: int = Query(10, description="LQIP quality"),
    progressive: bool = Query(False, description="Progressive JPEG"),
    interlace: bool = Query(False, description="Interlaced PNG"),
    lossless: bool = Query(False, description="Lossless WebP"),
):
    query_params = dict(request.query_params)
    
    try:
        params = params_from_query(query_params)
        
        image = await image_loader.load_from_upload_file(file)
        
        output_bytes, mime_type, etag = process_image(image, params, None)
        
        if _check_etag_match(request, etag):
            return Response(status_code=304)
        
        return StreamingResponse(
            io.BytesIO(output_bytes),
            media_type=mime_type,
            headers=_get_cache_headers(etag),
        )
    
    except Exception as e:
        raise _handle_processing_error(e)
