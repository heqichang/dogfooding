import os
import re
import hashlib
import platform
from datetime import datetime
from pathlib import Path
from typing import List, Tuple, Optional


def get_file_size_str(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"


def get_file_hash(file_path: str, algorithm: str = "md5") -> Optional[str]:
    try:
        if hashlib.algorithms_available and algorithm not in hashlib.algorithms_available:
            algorithm = "md5"
        
        hash_obj = hashlib.new(algorithm)
        with open(file_path, "rb") as f:
            while chunk := f.read(8192):
                hash_obj.update(chunk)
        return hash_obj.hexdigest()
    except (IOError, OSError, ValueError):
        return None


def get_drives() -> List[Tuple[str, str]]:
    system = platform.system()
    drives = []
    
    if system == "Windows":
        import string
        from ctypes import windll
        
        bitmask = windll.kernel32.GetLogicalDrives()
        for letter in string.ascii_uppercase:
            if bitmask & 1:
                drive_letter = f"{letter}:\\"
                try:
                    free_bytes = os.path.getsize(drive_letter) if os.path.exists(drive_letter) else 0
                    drives.append((drive_letter, drive_letter))
                except OSError:
                    pass
            bitmask >>= 1
    else:
        drives.append(("/", "Root"))
    
    return drives


def is_hidden(path: str) -> bool:
    system = platform.system()
    if system == "Windows":
        try:
            import ctypes
            attrs = ctypes.windll.kernel32.GetFileAttributesW(path)
            if attrs == -1:
                return False
            return bool(attrs & 2)
        except:
            pass
    
    name = os.path.basename(path)
    return name.startswith(".")


def should_exclude(path: str, exclude_patterns: List[str]) -> bool:
    name = os.path.basename(path)
    
    for pattern in exclude_patterns:
        if pattern in name:
            return True
        
        try:
            if re.match(pattern, name):
                return True
        except re.error:
            pass
    
    return False


def format_timestamp(timestamp: float) -> str:
    if timestamp is None or timestamp <= 0:
        return "Unknown"
    try:
        dt = datetime.fromtimestamp(timestamp)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except (ValueError, OSError):
        return "Invalid"


def get_file_info(file_path: str) -> dict:
    try:
        stat = os.stat(file_path)
        return {
            "path": file_path,
            "name": os.path.basename(file_path),
            "size": stat.st_size,
            "created": stat.st_ctime,
            "modified": stat.st_mtime,
            "accessed": stat.st_atime,
            "extension": os.path.splitext(file_path)[1].lower()
        }
    except (IOError, OSError):
        return {}


def highlight_text(text: str, keyword: str, case_sensitive: bool = False) -> str:
    if not keyword or not text:
        return text
    
    flags = 0 if case_sensitive else re.IGNORECASE
    pattern = re.compile(re.escape(keyword), flags)
    
    return pattern.sub(lambda m: f"<mark>{m.group()}</mark>", text)


def get_context_snippet(text: str, keyword: str, snippet_length: int = 300, case_sensitive: bool = False) -> str:
    if not keyword or not text:
        return text[:snippet_length] if len(text) > snippet_length else text
    
    flags = 0 if case_sensitive else re.IGNORECASE
    pattern = re.compile(re.escape(keyword), flags)
    
    match = pattern.search(text)
    if not match:
        return text[:snippet_length]
    
    start = max(0, match.start() - snippet_length // 2)
    end = min(len(text), match.end() + snippet_length // 2)
    
    snippet = text[start:end]
    
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."
    
    return snippet


def walk_directory(directory: str, exclude_patterns: List[str] = None, skip_hidden: bool = True):
    if exclude_patterns is None:
        exclude_patterns = []
    
    try:
        for root, dirs, files in os.walk(directory):
            dirs_to_remove = []
            for d in dirs:
                dir_path = os.path.join(root, d)
                if skip_hidden and is_hidden(dir_path):
                    dirs_to_remove.append(d)
                elif should_exclude(dir_path, exclude_patterns):
                    dirs_to_remove.append(d)
            
            for d in dirs_to_remove:
                dirs.remove(d)
            
            for file in files:
                file_path = os.path.join(root, file)
                if skip_hidden and is_hidden(file_path):
                    continue
                if should_exclude(file_path, exclude_patterns):
                    continue
                
                yield file_path
    except (PermissionError, OSError):
        pass


def is_binary_file(file_path: str, chunk_size: int = 8192) -> bool:
    try:
        with open(file_path, "rb") as f:
            chunk = f.read(chunk_size)
            if b"\0" in chunk:
                return True
            
            text_characters = bytearray({7, 8, 9, 10, 12, 13, 27} | set(range(0x20, 0x100)) - {0x7f})
            return bool(chunk.translate(None, text_characters))
    except (IOError, OSError):
        return True


def read_text_file(file_path: str, max_size: int = 10 * 1024 * 1024) -> Optional[str]:
    try:
        if os.path.getsize(file_path) > max_size:
            return None
        
        encodings = ["utf-8", "gbk", "gb2312", "gb18030", "latin-1"]
        for encoding in encodings:
            try:
                with open(file_path, "r", encoding=encoding) as f:
                    return f.read()
            except (UnicodeDecodeError, UnicodeError):
                continue
        
        return None
    except (IOError, OSError):
        return None
