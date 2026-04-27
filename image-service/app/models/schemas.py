from enum import Enum
from typing import Optional
from pydantic import BaseModel


class ImageFormat(str, Enum):
    JPEG = "jpeg"
    PNG = "png"
    WEBP = "webp"
    AVIF = "avif"


class FitMode(str, Enum):
    CONTAIN = "contain"
    COVER = "cover"
    FILL = "fill"
    INSIDE = "inside"
    OUTSIDE = "outside"


class ResizeMethod(str, Enum):
    LANCZOS = "lanczos"
    BICUBIC = "bicubic"
    BILINEAR = "bilinear"
    NEAREST = "nearest"


class WatermarkPosition(str, Enum):
    TOP_LEFT = "top_left"
    TOP_RIGHT = "top_right"
    BOTTOM_LEFT = "bottom_left"
    BOTTOM_RIGHT = "bottom_right"
    CENTER = "center"


class FlipDirection(str, Enum):
    HORIZONTAL = "horizontal"
    VERTICAL = "vertical"


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


class ImageProcessingParams(BaseModel):
    format: Optional[ImageFormat] = None
    quality: Optional[int] = None
    progressive: Optional[bool] = None
    optimize: Optional[bool] = None
    compress_level: Optional[int] = None
    interlace: Optional[bool] = None
    lossless: Optional[bool] = None
