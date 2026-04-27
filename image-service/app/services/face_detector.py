from typing import List, Dict, Any, Tuple, Optional

from PIL import Image

from app.core.exceptions import ImageProcessingError
from app.services import image_transform


HAS_CV2 = False
HAS_NUMPY = False
np = None
cv2 = None


try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    pass


try:
    if HAS_NUMPY:
        import cv2
        HAS_CV2 = True
except ImportError:
    pass


def _pil_to_cv2(image: Image.Image) -> Any:
    if not HAS_CV2 or not HAS_NUMPY:
        raise ImageProcessingError("OpenCV or NumPy is not available")
    
    if image.mode == "RGBA":
        image = image.convert("RGB")
    elif image.mode == "L":
        image = image.convert("RGB")
    
    img_array = np.array(image)
    return cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)


def detect_faces(image: Image.Image) -> List[Dict[str, Any]]:
    if not HAS_CV2 or not HAS_NUMPY:
        raise ImageProcessingError("OpenCV is not installed. Face detection is unavailable.")
    
    cv2_image = _pil_to_cv2(image)
    gray = cv2.cvtColor(cv2_image, cv2.COLOR_BGR2GRAY)
    
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
        flags=cv2.CASCADE_SCALE_IMAGE
    )
    
    result = []
    for (x, y, w, h) in faces:
        result.append({
            "x": int(x),
            "y": int(y),
            "width": int(w),
            "height": int(h),
            "confidence": 1.0
        })
    
    return result


def _get_face_bounding_box(
    faces: List[Dict[str, Any]],
    image_width: int,
    image_height: int,
    margin_ratio: float = 0.3,
) -> Tuple[int, int, int, int]:
    if not faces:
        return (0, 0, image_width, image_height)
    
    min_x = min(face["x"] for face in faces)
    min_y = min(face["y"] for face in faces)
    max_x = max(face["x"] + face["width"] for face in faces)
    max_y = max(face["y"] + face["height"] for face in faces)
    
    box_width = max_x - min_x
    box_height = max_y - min_y
    
    margin_w = int(box_width * margin_ratio)
    margin_h = int(box_height * margin_ratio)
    
    min_x = max(0, min_x - margin_w)
    min_y = max(0, min_y - margin_h)
    max_x = min(image_width, max_x + margin_w)
    max_y = min(image_height, max_y + margin_h)
    
    return (min_x, min_y, max_x, max_y)


def _calculate_face_aware_crop_region(
    face_box: Tuple[int, int, int, int],
    image_size: Tuple[int, int],
    target_size: Tuple[int, int],
) -> Tuple[int, int, int, int]:
    image_width, image_height = image_size
    target_width, target_height = target_size
    fx, fy, fx2, fy2 = face_box
    
    face_center_x = (fx + fx2) // 2
    face_center_y = (fy + fy2) // 2
    
    target_ratio = target_width / target_height
    image_ratio = image_width / image_height
    
    if image_ratio > target_ratio:
        crop_height = image_height
        crop_width = int(crop_height * target_ratio)
    else:
        crop_width = image_width
        crop_height = int(crop_width / target_ratio)
    
    if crop_width > target_width:
        scale = target_width / crop_width
        crop_width = target_width
        crop_height = int(crop_height * scale)
    
    crop_x = face_center_x - crop_width // 2
    crop_y = face_center_y - crop_height // 2
    
    crop_x = max(0, min(crop_x, image_width - crop_width))
    crop_y = max(0, min(crop_y, image_height - crop_height))
    
    return (crop_x, crop_y, crop_x + crop_width, crop_y + crop_height)


def face_aware_crop(
    image: Image.Image,
    target_width: int,
    target_height: int,
) -> Image.Image:
    if target_width <= 0 or target_height <= 0:
        raise ImageProcessingError("Target width and height must be positive integers")
    
    orig_width, orig_height = image.size
    
    if target_width == orig_width and target_height == orig_height:
        return image
    
    if target_width > orig_width or target_height > orig_height:
        return image_transform.resize_to_fill(image, target_width, target_height)
    
    if not HAS_CV2 or not HAS_NUMPY:
        return image_transform.smart_crop(image, target_width, target_height)
    
    try:
        faces = detect_faces(image)
    except Exception:
        return image_transform.smart_crop(image, target_width, target_height)
    
    if not faces:
        return image_transform.smart_crop(image, target_width, target_height)
    
    face_box = _get_face_bounding_box(faces, orig_width, orig_height)
    
    crop_box = _calculate_face_aware_crop_region(
        face_box,
        (orig_width, orig_height),
        (target_width, target_height)
    )
    
    cropped = image.crop(crop_box)
    
    if cropped.size != (target_width, target_height):
        cropped = cropped.resize(
            (target_width, target_height),
            Image.Resampling.LANCZOS
        )
    
    return cropped


def face_aware_resize(
    image: Image.Image,
    target_width: int,
    target_height: int,
    keep_aspect_ratio: bool = True,
) -> Image.Image:
    if keep_aspect_ratio:
        return face_aware_crop(image, target_width, target_height)
    else:
        return image.resize((target_width, target_height), Image.Resampling.LANCZOS)
