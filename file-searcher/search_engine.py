import os
import re
import threading
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Callable
from queue import Queue

from indexer import Indexer
from config import ConfigManager
from constants import (
    SEARCH_MODE_FILENAME, SEARCH_MODE_CONTENT, SEARCH_MODE_BOTH,
    MATCH_MODE_FUZZY, MATCH_MODE_EXACT, PREVIEW_FRAGMENT_LENGTH,
    DEFAULT_FILE_TYPES, TEXT_EXTENSIONS, DOCUMENT_EXTENSIONS
)
from utils import (
    get_file_info, get_context_snippet, highlight_text, 
    should_exclude, walk_directory, format_timestamp, get_file_size_str
)
from file_parser import FileContentParser


class SearchEngine:
    def __init__(self):
        self.config = ConfigManager()
        self.indexer = Indexer()
        self._search_thread = None
        self._stop_event = threading.Event()
        self._result_queue = Queue()
    
    def search(self, 
               query: str,
               search_mode: str = None,
               match_mode: str = None,
               case_sensitive: bool = None,
               file_type_category: str = None,
               custom_extensions: List[str] = None,
               min_size: str = None,
               max_size: str = None,
               modified_after: str = None,
               modified_before: str = None,
               created_after: str = None,
               created_before: str = None,
               search_paths: List[str] = None,
               exclude_paths: List[str] = None,
               use_index: bool = True,
               realtime_search: bool = False,
               callback: Callable = None) -> List[Dict[str, Any]]:
        
        if not query or not query.strip():
            return []
        
        query = query.strip()
        
        if search_mode is None:
            search_mode = self.config.get("search.search_mode", SEARCH_MODE_BOTH)
        if match_mode is None:
            match_mode = self.config.get("search.match_mode", MATCH_MODE_FUZZY)
        if case_sensitive is None:
            case_sensitive = self.config.get("search.case_sensitive", False)
        
        file_extensions = self._get_file_extensions(file_type_category, custom_extensions)
        
        min_size_bytes = self._parse_size(min_size)
        max_size_bytes = self._parse_size(max_size)
        
        modified_after_ts = self._parse_time_filter(modified_after)
        modified_before_ts = self._parse_time_filter(modified_before, is_before=True)
        created_after_ts = self._parse_time_filter(created_after)
        created_before_ts = self._parse_time_filter(created_before, is_before=True)
        
        exclude_dirs = self.config.get("index.excluded_dirs", [])
        
        if realtime_search:
            return self._realtime_search(
                query, search_mode, match_mode, case_sensitive,
                file_extensions, min_size_bytes, max_size_bytes,
                modified_after_ts, modified_before_ts,
                created_after_ts, created_before_ts,
                search_paths, exclude_paths,
                callback
            )
        
        if use_index:
            results = self.indexer.search(
                query=query,
                search_mode=search_mode,
                match_mode=match_mode,
                case_sensitive=case_sensitive,
                file_types=file_extensions,
                min_size=min_size_bytes,
                max_size=max_size_bytes,
                modified_after=modified_after_ts,
                modified_before=modified_before_ts,
                created_after=created_after_ts,
                created_before=created_before_ts,
                search_paths=search_paths,
                exclude_paths=exclude_paths,
                limit=self.config.get("search.max_results", 1000)
            )
            
            results = self._enrich_results(results, query, case_sensitive)
            
            if callback:
                for i, result in enumerate(results):
                    callback({
                        "type": "result",
                        "result": result,
                        "index": i,
                        "total": len(results)
                    })
            
            return results
        
        return []
    
    def _realtime_search(self,
                          query: str,
                          search_mode: str,
                          match_mode: str,
                          case_sensitive: bool,
                          file_extensions: List[str],
                          min_size: int,
                          max_size: int,
                          modified_after: float,
                          modified_before: float,
                          created_after: float,
                          created_before: float,
                          search_paths: List[str],
                          exclude_paths: List[str],
                          callback: Callable = None) -> List[Dict[str, Any]]:
        
        if not search_paths:
            return []
        
        exclude_dirs = self.config.get("index.excluded_dirs", [])
        max_results = self.config.get("search.max_results", 1000)
        
        results = []
        total_files = 0
        matched_files = 0
        
        search_dirs = []
        for path in search_paths:
            if os.path.isfile(path):
                search_dirs.append((os.path.dirname(path), [os.path.basename(path)]))
            elif os.path.isdir(path):
                search_dirs.append((path, None))
        
        for base_dir, specific_files in search_dirs:
            if specific_files:
                files_to_check = [os.path.join(base_dir, f) for f in specific_files]
            else:
                files_to_check = list(walk_directory(base_dir, exclude_dirs, skip_hidden=True))
            
            for file_path in files_to_check:
                total_files += 1
                
                if self._stop_event.is_set():
                    break
                
                ext = os.path.splitext(file_path)[1].lower()
                
                if file_extensions and ext not in file_extensions:
                    continue
                
                try:
                    file_info = get_file_info(file_path)
                    if not file_info:
                        continue
                    
                    if min_size is not None and file_info["size"] < min_size:
                        continue
                    if max_size is not None and file_info["size"] > max_size:
                        continue
                    
                    if modified_after is not None and file_info["modified"] < modified_after:
                        continue
                    if modified_before is not None and file_info["modified"] > modified_before:
                        continue
                    
                    if created_after is not None and file_info["created"] < created_after:
                        continue
                    if created_before is not None and file_info["created"] > created_before:
                        continue
                    
                    filename_match = self._matches_filename(file_info["name"], query, match_mode, case_sensitive)
                    content_match = False
                    
                    if search_mode in (SEARCH_MODE_CONTENT, SEARCH_MODE_BOTH) and not filename_match:
                        content_match = self._matches_content(file_path, query, match_mode, case_sensitive)
                    
                    if filename_match or content_match:
                        matched_files += 1
                        
                        result = {
                            "id": None,
                            "path": file_path,
                            "name": file_info["name"],
                            "extension": file_info["extension"],
                            "size": file_info["size"],
                            "created": file_info["created"],
                            "modified": file_info["modified"],
                            "accessed": file_info["accessed"],
                            "has_content_index": False,
                            "match_mode": "filename" if filename_match else "content"
                        }
                        
                        result = self._enrich_result(result, query, case_sensitive)
                        results.append(result)
                        
                        if callback:
                            callback({
                                "type": "result",
                                "result": result,
                                "index": matched_files,
                                "total": -1
                            })
                        
                        if len(results) >= max_results:
                            break
                
                except Exception:
                    continue
            
            if self._stop_event.is_set() or len(results) >= max_results:
                break
        
        if callback:
            callback({
                "type": "complete",
                "total_results": len(results),
                "total_files_scanned": total_files
            })
        
        return results
    
    def _matches_filename(self, name: str, query: str, match_mode: str, case_sensitive: bool) -> bool:
        if match_mode == MATCH_MODE_EXACT:
            if case_sensitive:
                return name == query
            else:
                return name.lower() == query.lower()
        else:
            if case_sensitive:
                return query in name
            else:
                return query.lower() in name.lower()
    
    def _matches_content(self, file_path: str, query: str, match_mode: str, case_sensitive: bool) -> bool:
        content = FileContentParser.parse(file_path)
        if not content:
            return False
        
        if match_mode == MATCH_MODE_EXACT:
            if case_sensitive:
                return query in content
            else:
                return query.lower() in content.lower()
        else:
            terms = query.split()
            flags = 0 if case_sensitive else re.IGNORECASE
            
            for term in terms:
                pattern = re.compile(re.escape(term), flags)
                if not pattern.search(content):
                    return False
            
            return True
    
    def _enrich_results(self, results: List[Dict], query: str, case_sensitive: bool) -> List[Dict]:
        for result in results:
            result = self._enrich_result(result, query, case_sensitive)
        return results
    
    def _enrich_result(self, result: Dict, query: str, case_sensitive: bool) -> Dict:
        result["size_str"] = get_file_size_str(result["size"])
        result["modified_str"] = format_timestamp(result["modified"])
        result["created_str"] = format_timestamp(result["created"])
        
        result["name_highlighted"] = highlight_text(result["name"], query, case_sensitive)
        result["path_highlighted"] = highlight_text(result["path"], query, case_sensitive)
        
        if result["match_mode"] == "content" and result.get("has_content_index", False) and result.get("id"):
            content = self.indexer.get_file_content(result["id"])
            if content:
                result["content_snippet"] = get_context_snippet(
                    content, query, PREVIEW_FRAGMENT_LENGTH, case_sensitive
                )
                result["content_snippet_highlighted"] = highlight_text(
                    result["content_snippet"], query, case_sensitive
                )
        
        return result
    
    def _get_file_extensions(self, category: str, custom_exts: List[str]) -> List[str]:
        if category and category in DEFAULT_FILE_TYPES:
            return DEFAULT_FILE_TYPES[category]["extensions"]
        
        if custom_exts:
            exts = []
            for ext in custom_exts:
                if not ext.startswith("."):
                    ext = "." + ext
                exts.append(ext.lower())
            return exts
        
        return []
    
    def _parse_size(self, size_str: str) -> Optional[int]:
        if not size_str:
            return None
        
        size_str = size_str.strip().upper()
        multipliers = {
            "KB": 1024,
            "MB": 1024 * 1024,
            "GB": 1024 * 1024 * 1024
        }
        
        for unit, multiplier in multipliers.items():
            if size_str.endswith(unit):
                try:
                    value = float(size_str[:-len(unit)].strip())
                    return int(value * multiplier)
                except ValueError:
                    return None
        
        try:
            return int(float(size_str))
        except ValueError:
            return None
    
    def _parse_time_filter(self, time_str: str, is_before: bool = False) -> Optional[float]:
        if not time_str:
            return None
        
        time_str = time_str.strip().lower()
        
        now = datetime.now()
        
        patterns = {
            "today": 0,
            "yesterday": 1,
            "week": 7,
            "month": 30,
            "year": 365
        }
        
        for pattern, days in patterns.items():
            if pattern in time_str:
                if is_before:
                    if days == 0:
                        start_of_day = datetime(now.year, now.month, now.day)
                        return start_of_day.timestamp()
                    else:
                        delta = timedelta(days=days)
                        cutoff_date = now - delta
                        return cutoff_date.timestamp()
                else:
                    if days == 0:
                        start_of_day = datetime(now.year, now.month, now.day)
                        return start_of_day.timestamp()
                    else:
                        delta = timedelta(days=days)
                        cutoff_date = now - delta
                        return cutoff_date.timestamp()
        
        try:
            dt = datetime.strptime(time_str, "%Y-%m-%d")
            if is_before:
                return (dt + timedelta(days=1)).timestamp()
            else:
                return dt.timestamp()
        except ValueError:
            try:
                dt = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")
                return dt.timestamp()
            except ValueError:
                return None
    
    def stop_search(self):
        self._stop_event.set()
        if self._search_thread and self._search_thread.is_alive():
            self._search_thread.join(timeout=5.0)
    
    def get_index_stats(self) -> Dict[str, Any]:
        return self.indexer.get_index_stats()
    
    def start_indexing(self, paths: List[str], callback: Callable = None) -> threading.Thread:
        def index_worker():
            total_stats = {"indexed": 0, "updated": 0, "skipped": 0, "errors": 0, "total": 0}
            
            for path in paths:
                if self._stop_event.is_set():
                    break
                
                stats = self.indexer.index_path(path, recursive=True, callback=callback)
                for key in total_stats:
                    if key in stats:
                        total_stats[key] += stats[key]
            
            if callback:
                callback({
                    "type": "complete",
                    "stats": total_stats
                })
            
            return total_stats
        
        self._stop_event.clear()
        self._search_thread = threading.Thread(target=index_worker, daemon=True)
        self._search_thread.start()
        
        return self._search_thread
    
    def stop_indexing(self):
        self.indexer.stop()
        self._stop_event.set()
    
    def is_indexing(self) -> bool:
        return self.indexer.is_running()
    
    def clear_index(self):
        self.indexer.clear_index()
