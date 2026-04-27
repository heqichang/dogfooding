from dataclasses import dataclass
from typing import Optional, Tuple, Dict, Any
from PIL import Image
import hashlib

from app.core.exceptions import ImageProcessingError
from app.models.schemas import (
    ImageFormat,
    FitMode,
    ResizeMethod,
    WatermarkPosition,
    FlipDirection,
)
from app.services import (
    image_transform,
    watermark as watermark_service,
    face_detector,
)
from app.services.image_saver import save_to_bytes, detect_format, get_format_mimetype


@dataclass
class ProcessingParams:
    width: Optional[int] = None
    height: Optional[int] = None
    fit: str = FitMode.COVER.value
    method: str = ResizeMethod.LANCZOS.value
    quality: int = 80
    format: Optional[str] = None
    rotate: float = 0.0
    flip: Optional[str] = None
    smart_crop: bool = False
    face_aware: bool = False
    
    watermark_text: Optional[str] = None
    watermark_position: str = WatermarkPosition.BOTTOM_RIGHT.value
    watermark_font_size: int = 36
    watermark_color: Tuple[int, int, int] = (255, 255, 255)
    watermark_opacity: float = 0.8
    watermark_margin: int = 20
    
    lqip: bool = False
    lqip_max_dim: int = 20
    lqip_quality: int = 10
    progressive: bool = False
    interlace: bool = False
    lossless: bool = False
    optimize: bool = True
    compress_level: int = 6


def _parse_color(color_str: str) -> Tuple[int, int, int]:
    if color_str.startswith("#"):
        color_str = color_str[1:]
    
    if len(color_str) == 6:
        return (
            int(color_str[0:2], 16),
            int(color_str[2:4], 16),
            int(color_str[4:6], 16),
        )
    
    if "," in color_str:
        parts = color_str.split(",")
        if len(parts) >= 3:
            return (
                int(parts[0].strip()),
                int(parts[1].strip()),
                int(parts[2].strip()),
            )
    
    return (255, 255, 255)


def params_from_query(query_params: Dict[str, Any]) -> ProcessingParams:
    params = ProcessingParams()
    
    if "w" in query_params and query_params["w"]:
        params.width = int(query_params["w"])
    if "h" in query_params and query_params["h"]:
        params.height = int(query_params["h"])
    
    if "fit" in query_params:
        params.fit = query_params["fit"].lower()
    if "method" in query_params:
        params.method = query_params["method"].lower()
    
    if "q" in query_params:
        params.quality = int(query_params["q"])
        if not (0 <= params.quality <= 100):
            raise ImageProcessingError("Quality must be between 0 and 100")
    
    if "f" in query_params:
        params.format = query_params["f"].lower()
    
    if "rotate" in query_params and query_params["rotate"]:
        params.rotate = float(query_params["rotate"])
    
    if "flip" in query_params:
        params.flip = query_params["flip"].lower()
    
    if "smart_crop" in query_params:
        params.smart_crop = str(query_params["smart_crop"]).lower() in ("true", "1", "yes")
    if "face_aware" in query_params:
        params.face_aware = str(query_params["face_aware"]).lower() in ("true", "1", "yes")
    
    if "watermark" in query_params:
        params.watermark_text = query_params["watermark"]
    if "watermark_pos" in query_params:
        params.watermark_position = query_params["watermark_pos"].lower()
    if "watermark_size" in query_params:
        params.watermark_font_size = int(query_params["watermark_size"])
    if "watermark_color" in query_params:
        params.watermark_color = _parse_color(query_params["watermark_color"])
    if "watermark_opacity" in query_params:
        params.watermark_opacity = float(query_params["watermark_opacity"])
    if "watermark_margin" in query_params:
        params.watermark_margin = int(query_params["watermark_margin"])
    
    if "lqip" in query_params:
        params.lqip = str(query_params["lqip"]).lower() in ("true", "1", "yes")
    if "lqip_dim" in query_params:
        params.lqip_max_dim = int(query_params["lqip_dim"])
    if "lqip_q" in query_params:
        params.lqip_quality = int(query_params["lqip_q"])
    
    if "progressive" in query_params:
        params.progressive = str(query_params["progressive"]).lower() in ("true", "1", "yes")
    if "interlace" in query_params:
        params.interlace = str(query_params["interlace"]).lower() in ("true", "1", "yes")
    if "lossless" in query_params:
        params.lossless = str(query_params["lossless"]).lower() in ("true", "1", "yes")
    if "optimize" in query_params:
        params.optimize = str(query_params["optimize"]).lower() in ("true", "1", "yes")
    if "compress_level" in query_params:
        params.compress_level = int(query_params["compress_level"])
    
    return params


def _generate_param_hash(params: ProcessingParams, image_hash: str) -> str:
    param_str = (
        f"w:{params.width},h:{params.height},fit:{params.fit},method:{params.method},"
        f"q:{params.quality},f:{params.format},rotate:{params.rotate},flip:{params.flip},"
        f"smart_crop:{params.smart_crop},face_aware:{params.face_aware},"
        f"watermark:{params.watermark_text},watermark_pos:{params.watermark_position},"
        f"progressive:{params.progressive},interlace:{params.interlace},lossless:{params.lossless}"
    )
    combined = f"{image_hash}:{param_str}"
    return hashlib.md5(combined.encode()).hexdigest()


def _apply_resize(
    image: Image.Image,
    params: ProcessingParams,
) -> Image.Image:
    result = image
    width = params.width
    height = params.height
    fit = params.fit
    method = params.method
    
    if width is None and height is None:
        return result
    
    if width is None or height is None:
        return image_transform.resize(
            result,
            width=width,
            height=height,
            keep_aspect_ratio=True,
            method=method,
        )
    
    if fit == FitMode.COVER.value:
        result = image_transform.resize_to_fill(result, width, height, method)
    
    elif fit == FitMode.CONTAIN.value:
        result = image_transform.resize_to_contain(result, width, height, method)
    
    elif fit == FitMode.FILL.value:
        result = image_transform.resize(
            result,
            width=width,
            height=height,
            keep_aspect_ratio=False,
            method=method,
        )
    
    elif fit == FitMode.INSIDE.value:
        result = image_transform.resize_to_fit(result, width, height, method)
    
    elif fit == FitMode.OUTSIDE.value:
        result = image_transform.resize_to_outside(result, width, height, method)
    
    else:
        result = image_transform.resize(
            result,
            width=width,
            height=height,
            keep_aspect_ratio=True,
            method=method,
        )
    
    return result


def process_image(
    image: Image.Image,
    params: ProcessingParams,
    original_image_hash: Optional[str] = None,
) -> Tuple[bytes, str, str]:
    result = image
    
    if params.face_aware and params.width and params.height:
        result = face_detector.face_aware_crop(result, params.width, params.height)
    elif params.smart_crop and params.width and params.height:
        result = image_transform.smart_crop(result, params.width, params.height)
    
    if params.width or params.height:
        result = _apply_resize(result, params)
    
    if params.rotate != 0:
        result = image_transform.rotate(result, params.rotate)
    
    if params.flip:
        if params.flip == FlipDirection.HORIZONTAL.value:
            result = image_transform.flip_horizontal(result)
        elif params.flip == FlipDirection.VERTICAL.value:
            result = image_transform.flip_vertical(result)
    
    if params.watermark_text:
        result = watermark_service.add_text_watermark(
            result,
            text=params.watermark_text,
            position=params.watermark_position,
            font_size=params.watermark_font_size,
            color=params.watermark_color,
            opacity=params.watermark_opacity,
            margin=params.watermark_margin,
        )
    
    if params.lqip:
        from app.services import lazy_load
        output_bytes = lazy_load.generate_lqip(
            result,
            max_dimension=params.lqip_max_dim,
            quality=params.lqip_quality,
        )
        etag = hashlib.md5(output_bytes).hexdigest()
        return output_bytes, "image/jpeg", etag
    
    output_format = params.format or detect_format(result)
    
    save_kwargs = {}
    
    if output_format == ImageFormat.JPEG.value:
        save_kwargs["progressive"] = params.progressive
        if params.progressive:
            from app.services import lazy_load
            output_bytes = lazy_load.generate_progressive_jpeg(result, params.quality)
            etag = _generate_param_hash(params, original_image_hash or "unknown")
            return output_bytes, "image/jpeg", etag
    
    elif output_format == ImageFormat.PNG.value:
        save_kwargs["optimize"] = params.optimize
        save_kwargs["compress_level"] = params.compress_level
        save_kwargs["interlace"] = params.interlace
        if params.interlace:
            from app.services import lazy_load
            output_bytes = lazy_load.generate_interlaced_png(result, params.compress_level)
            etag = _generate_param_hash(params, original_image_hash or "unknown")
            return output_bytes, "image/png", etag
    
    elif output_format == ImageFormat.WEBP.value:
        save_kwargs["lossless"] = params.lossless
    
    output_bytes = save_to_bytes(
        result,
        format=output_format,
        quality=params.quality,
        **save_kwargs,
    )
    
    mime_type = get_format_mimetype(output_format)
    etag = _generate_param_hash(params, original_image_hash or "unknown")
    
    return output_bytes, mime_type, etag
