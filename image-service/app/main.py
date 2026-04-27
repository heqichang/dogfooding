from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import RequestValidationError

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.routers import image

__version__ = "1.0.0"

setup_logging()
logger = get_logger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=__version__,
    debug=settings.DEBUG,
    description="A high-performance image processing service with support for cropping, resizing, rotation, format conversion, watermarking, and face-aware cropping.",
)

app.include_router(image.router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    logger.warning(f"HTTP error {exc.status_code}: {exc.detail}")
    detail = exc.detail if isinstance(exc.detail, dict) else {"error": "unknown", "message": str(exc.detail)}
    return JSONResponse(
        status_code=exc.status_code,
        content=detail,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": "Invalid request parameters",
            "details": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "An unexpected error occurred",
        },
    )


@app.get("/health")
async def health_check() -> dict:
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": __version__
    }


@app.get("/")
async def root() -> dict:
    return {
        "name": settings.APP_NAME,
        "version": __version__,
        "docs": "/docs",
        "health": "/health",
        "api": "/api/v1/image",
    }


@app.on_event("startup")
async def startup_event() -> None:
    logger.info(f"Starting {settings.APP_NAME} v{__version__}")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    logger.info(f"Shutting down {settings.APP_NAME}")
