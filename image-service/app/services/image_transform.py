from typing import Optional, Tuple

from PIL import Image

from app.core.exceptions import ImageProcessingError
from app.models.schemas import ResizeMethod


def _get_resample(method: str) -> int:
    method_map = {
        ResizeMethod.LANCZOS: Image.Resampling.LANCZOS,
        ResizeMethod.BICUBIC: Image.Resampling.BICUBIC,
        ResizeMethod.BILINEAR: Image.Resampling.BILINEAR,
        ResizeMethod.NEAREST: Image.Resampling.NEAREST,
    }
    return method_map.get(method, Image.Resampling.LANCZOS)


def _calculate_crop_box(
    orig_width: int, orig_height: int, target_width: int, target_height: int
) -> Tuple[int, int, int, int]:
    orig_ratio = orig_width / orig_height
    target_ratio = target_width / target_height

    if orig_ratio > target_ratio:
        new_width = int(orig_height * target_ratio)
        new_height = orig_height
        x = (orig_width - new_width) // 2
        y = 0
    else:
        new_width = orig_width
        new_height = int(orig_width / target_ratio)
        x = 0
        y = (orig_height - new_height) // 2

    return (x, y, x + new_width, y + new_height)


def _validate_positive_int(value: Optional[int], name: str) -> None:
    if value is not None and value <= 0:
        raise ImageProcessingError(f"{name} must be a positive integer")


def _validate_positive_float(value: float, name: str) -> None:
    if value <= 0:
        raise ImageProcessingError(f"{name} must be a positive number")


def crop(
    image: Image.Image, x: int, y: int, width: int, height: int
) -> Image.Image:
    _validate_positive_int(width, "width")
    _validate_positive_int(height, "height")

    if x < 0 or y < 0:
        raise ImageProcessingError("x and y coordinates cannot be negative")

    orig_width, orig_height = image.size

    if x + width > orig_width:
        raise ImageProcessingError(
            f"Crop width exceeds image bounds: x={x} + width={width} > {orig_width}"
        )
    if y + height > orig_height:
        raise ImageProcessingError(
            f"Crop height exceeds image bounds: y={y} + height={height} > {orig_height}"
        )

    return image.crop((x, y, x + width, y + height))


def crop_by_ratio(image: Image.Image, ratio: float) -> Image.Image:
    _validate_positive_float(ratio, "ratio")

    orig_width, orig_height = image.size
    target_width = orig_width
    target_height = int(orig_width / ratio)

    if target_height > orig_height:
        target_height = orig_height
        target_width = int(orig_height * ratio)

    return smart_crop(image, target_width, target_height)


def smart_crop(
    image: Image.Image, target_width: int, target_height: int
) -> Image.Image:
    _validate_positive_int(target_width, "target_width")
    _validate_positive_int(target_height, "target_height")

    orig_width, orig_height = image.size

    if target_width > orig_width or target_height > orig_height:
        raise ImageProcessingError(
            f"Target size ({target_width}x{target_height}) exceeds original size ({orig_width}x{orig_height})"
        )

    box = _calculate_crop_box(orig_width, orig_height, target_width, target_height)
    return image.crop(box)


def resize(
    image: Image.Image,
    width: Optional[int] = None,
    height: Optional[int] = None,
    keep_aspect_ratio: bool = True,
    method: str = ResizeMethod.LANCZOS,
) -> Image.Image:
    if width is None and height is None:
        return image

    _validate_positive_int(width, "width")
    _validate_positive_int(height, "height")

    orig_width, orig_height = image.size
    resample = _get_resample(method)

    if keep_aspect_ratio:
        if width and height:
            ratio = min(width / orig_width, height / orig_height)
            new_width = int(orig_width * ratio)
            new_height = int(orig_height * ratio)
        elif width:
            ratio = width / orig_width
            new_width = width
            new_height = int(orig_height * ratio)
        else:
            ratio = height / orig_height
            new_width = int(orig_width * ratio)
            new_height = height
    else:
        new_width = width if width else orig_width
        new_height = height if height else orig_height

    if new_width == orig_width and new_height == orig_height:
        return image

    return image.resize((new_width, new_height), resample=resample)


def resize_by_scale(
    image: Image.Image, scale: float, method: str = ResizeMethod.LANCZOS
) -> Image.Image:
    _validate_positive_float(scale, "scale")

    if scale == 1.0:
        return image

    orig_width, orig_height = image.size
    new_width = int(orig_width * scale)
    new_height = int(orig_height * scale)

    return resize(
        image,
        width=new_width,
        height=new_height,
        keep_aspect_ratio=False,
        method=method,
    )


def resize_to_fit(
    image: Image.Image,
    max_width: int,
    max_height: int,
    method: str = ResizeMethod.LANCZOS,
) -> Image.Image:
    _validate_positive_int(max_width, "max_width")
    _validate_positive_int(max_height, "max_height")

    orig_width, orig_height = image.size

    if orig_width <= max_width and orig_height <= max_height:
        return image

    return resize(
        image,
        width=max_width,
        height=max_height,
        keep_aspect_ratio=True,
        method=method,
    )


def resize_to_fill(
    image: Image.Image,
    width: int,
    height: int,
    method: str = ResizeMethod.LANCZOS,
) -> Image.Image:
    _validate_positive_int(width, "width")
    _validate_positive_int(height, "height")

    orig_width, orig_height = image.size
    orig_ratio = orig_width / orig_height
    target_ratio = width / height

    import math
    
    if orig_ratio > target_ratio:
        scale_height = height
        scale_width = math.ceil(height * orig_ratio)
    else:
        scale_width = width
        scale_height = math.ceil(width / orig_ratio)

    resized = resize(
        image,
        width=scale_width,
        height=scale_height,
        keep_aspect_ratio=True,
        method=method,
    )

    return smart_crop(resized, width, height)


def resize_to_contain(
    image: Image.Image,
    width: int,
    height: int,
    method: str = ResizeMethod.LANCZOS,
) -> Image.Image:
    _validate_positive_int(width, "width")
    _validate_positive_int(height, "height")

    return resize(
        image,
        width=width,
        height=height,
        keep_aspect_ratio=True,
        method=method,
    )


def resize_to_outside(
    image: Image.Image,
    width: int,
    height: int,
    method: str = ResizeMethod.LANCZOS,
) -> Image.Image:
    _validate_positive_int(width, "width")
    _validate_positive_int(height, "height")

    orig_width, orig_height = image.size
    orig_ratio = orig_width / orig_height
    target_ratio = width / height

    import math
    
    if orig_ratio > target_ratio:
        scale_height = height
        scale_width = math.ceil(height * orig_ratio)
    else:
        scale_width = width
        scale_height = math.ceil(width / orig_ratio)

    return resize(
        image,
        width=scale_width,
        height=scale_height,
        keep_aspect_ratio=True,
        method=method,
    )


def rotate(
    image: Image.Image,
    angle: float,
    expand: bool = True,
    fill_color: Tuple[int, ...] = (255, 255, 255),
) -> Image.Image:
    if angle % 360 == 0:
        return image

    mode = image.mode
    has_alpha = mode in ("RGBA", "LA", "P")

    if has_alpha:
        if len(fill_color) == 3:
            fill_color = fill_color + (0,)
        elif len(fill_color) != 4:
            fill_color = (255, 255, 255, 0)

    return image.rotate(
        angle,
        expand=expand,
        resample=Image.Resampling.BILINEAR,
        fillcolor=fill_color,
    )


def flip_horizontal(image: Image.Image) -> Image.Image:
    return image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)


def flip_vertical(image: Image.Image) -> Image.Image:
    return image.transpose(Image.Transpose.FLIP_TOP_BOTTOM)


def pad(
    image: Image.Image,
    target_width: int,
    target_height: int,
    fill_color: Tuple[int, ...] = (255, 255, 255),
) -> Image.Image:
    _validate_positive_int(target_width, "target_width")
    _validate_positive_int(target_height, "target_height")

    orig_width, orig_height = image.size

    if orig_width == target_width and orig_height == target_height:
        return image

    if orig_width > target_width or orig_height > target_height:
        raise ImageProcessingError(
            f"Original image ({orig_width}x{orig_height}) is larger than target size ({target_width}x{target_height})"
        )

    mode = image.mode
    has_alpha = mode in ("RGBA", "LA")

    if has_alpha:
        if len(fill_color) == 3:
            fill_color = fill_color + (0,)
        pad_mode = "RGBA" if mode == "RGBA" else mode
    else:
        pad_mode = "RGB" if len(fill_color) == 3 else "RGBA"

    new_image = Image.new(pad_mode, (target_width, target_height), fill_color)

    x = (target_width - orig_width) // 2
    y = (target_height - orig_height) // 2

    if has_alpha:
        new_image.paste(image, (x, y), mask=image if image.mode == "RGBA" else None)
    else:
        new_image.paste(image, (x, y))

    return new_image
