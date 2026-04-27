class ImageProcessingError(Exception):
    pass


class InvalidImageFormatError(ImageProcessingError):
    pass


class ImageTooLargeError(ImageProcessingError):
    pass


class DownloadError(ImageProcessingError):
    pass
