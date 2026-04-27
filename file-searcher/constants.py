import os

APP_NAME = "QuickFileSearch"
APP_VERSION = "1.0.0"

# 默认文件类型组
DEFAULT_FILE_TYPES = {
    "documents": {
        "name": "文档文件",
        "extensions": [".txt", ".doc", ".docx", ".pdf", ".xls", ".xlsx", ".ppt", ".pptx", ".odt", ".rtf"]
    },
    "code": {
        "name": "代码文件",
        "extensions": [".py", ".js", ".ts", ".java", ".cpp", ".c", ".h", ".cs", ".php", ".go", ".rs", ".swift", 
                       ".kt", ".rb", ".sh", ".bat", ".ps1", ".html", ".css", ".scss", ".xml", ".json", ".yaml", 
                       ".yml", ".md", ".rst"]
    },
    "images": {
        "name": "图片文件",
        "extensions": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".svg", ".webp"]
    },
    "videos": {
        "name": "视频文件",
        "extensions": [".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm"]
    },
    "audio": {
        "name": "音频文件",
        "extensions": [".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma"]
    },
    "archives": {
        "name": "压缩文件",
        "extensions": [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"]
    }
}

# 支持全文检索的文件类型
TEXT_EXTENSIONS = [
    ".txt", ".py", ".js", ".ts", ".java", ".cpp", ".c", ".h", ".cs", ".php", ".go", ".rs", 
    ".swift", ".kt", ".rb", ".sh", ".bat", ".ps1", ".html", ".css", ".scss", ".xml", ".json", 
    ".yaml", ".yml", ".md", ".rst", ".csv", ".ini", ".cfg", ".conf", ".log"
]

# 二进制文档类型（需要特殊解析器）
DOCUMENT_EXTENSIONS = [".doc", ".docx", ".pdf", ".xls", ".xlsx", ".ppt", ".pptx", ".odt", ".rtf"]

# 默认排除目录
DEFAULT_EXCLUDE_DIRS = [
    "$RECYCLE.BIN",
    "System Volume Information",
    "node_modules",
    "__pycache__",
    ".git",
    ".svn",
    ".hg",
    "venv",
    "env",
    "Lib",
    "Scripts",
    "site-packages",
    "dist",
    "build",
    ".idea",
    ".vscode",
    "__MACOSX"
]

# 搜索模式
SEARCH_MODE_FILENAME = "filename"
SEARCH_MODE_CONTENT = "content"
SEARCH_MODE_BOTH = "both"

# 匹配模式
MATCH_MODE_FUZZY = "fuzzy"
MATCH_MODE_EXACT = "exact"

# 预览片段长度
PREVIEW_FRAGMENT_LENGTH = 300
