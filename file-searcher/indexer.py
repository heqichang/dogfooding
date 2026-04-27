import os
import sqlite3
import threading
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from queue import Queue
import re

from config import ConfigManager
from constants import TEXT_EXTENSIONS, DOCUMENT_EXTENSIONS, SEARCH_MODE_FILENAME, SEARCH_MODE_CONTENT, SEARCH_MODE_BOTH, MATCH_MODE_FUZZY, MATCH_MODE_EXACT
from utils import get_file_info, should_exclude, walk_directory, get_file_hash
from file_parser import FileContentParser


class Indexer:
    def __init__(self, db_path: str = None):
        self.config = ConfigManager()
        self.db_path = db_path or self.config.db_file
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._running = False
        
        self._init_database()
    
    def _init_database(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS files (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    path TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    extension TEXT,
                    size INTEGER,
                    created REAL,
                    modified REAL,
                    accessed REAL,
                    file_hash TEXT,
                    has_content_index INTEGER DEFAULT 0,
                    indexed_at REAL,
                    directory TEXT
                )
            ''')
            
            cursor.execute('''
                CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
                    name,
                    path,
                    content
                )
            ''')
            
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_files_extension ON files(extension)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_files_modified ON files(modified)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_files_created ON files(created)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_files_size ON files(size)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_files_directory ON files(directory)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_files_name ON files(name)')
            
            conn.commit()
    
    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn
    
    def is_running(self) -> bool:
        return self._running
    
    def stop(self):
        self._stop_event.set()
    
    def index_path(self, path: str, recursive: bool = True, callback: callable = None) -> Dict[str, int]:
        self._running = True
        self._stop_event.clear()
        
        indexed = 0
        updated = 0
        skipped = 0
        errors = 0
        
        exclude_dirs = self.config.get("index.excluded_dirs", [])
        exclude_exts = self.config.get("index.excluded_extensions", [])
        max_file_size = self.config.get("index.max_file_size_mb", 100) * 1024 * 1024
        
        with self._get_connection() as conn:
            if os.path.isfile(path):
                files_to_index = [path]
            else:
                files_to_index = list(walk_directory(path, exclude_dirs, skip_hidden=True))
            
            total_files = len(files_to_index)
            
            for i, file_path in enumerate(files_to_index):
                if self._stop_event.is_set():
                    break
                
                ext = os.path.splitext(file_path)[1].lower()
                
                if ext.lower() in [e.lower() for e in exclude_exts]:
                    skipped += 1
                    continue
                
                try:
                    file_info = get_file_info(file_path)
                    if not file_info:
                        errors += 1
                        continue
                    
                    if file_info["size"] > max_file_size:
                        skipped += 1
                        continue
                    
                    cursor = conn.cursor()
                    
                    cursor.execute('SELECT id, file_hash, modified FROM files WHERE path = ?', (file_path,))
                    existing = cursor.fetchone()
                    
                    if existing:
                        if existing["file_hash"] == get_file_hash(file_path) and existing["modified"] == file_info["modified"]:
                            skipped += 1
                            continue
                        
                        file_hash = get_file_hash(file_path)
                        has_content = self._should_index_content(file_path)
                        content = self._get_content_for_index(file_path) if has_content else ""
                        
                        cursor.execute('''
                            UPDATE files 
                            SET name=?, extension=?, size=?, created=?, modified=?, 
                                accessed=?, file_hash=?, has_content_index=?, indexed_at=?, directory=?
                            WHERE path=?
                        ''', (
                            file_info["name"], file_info["extension"], file_info["size"],
                            file_info["created"], file_info["modified"], file_info["accessed"],
                            file_hash, 1 if has_content and content else 0,
                            datetime.now().timestamp(), os.path.dirname(file_path),
                            file_path
                        ))
                        
                        if has_content and content:
                            cursor.execute('''
                                INSERT OR REPLACE INTO files_fts(rowid, name, path, content)
                                VALUES (?, ?, ?, ?)
                            ''', (existing["id"], file_info["name"], file_path, content))
                        
                        updated += 1
                    else:
                        file_hash = get_file_hash(file_path)
                        has_content = self._should_index_content(file_path)
                        content = self._get_content_for_index(file_path) if has_content else ""
                        
                        cursor.execute('''
                            INSERT INTO files 
                            (path, name, extension, size, created, modified, accessed, 
                             file_hash, has_content_index, indexed_at, directory)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            file_path, file_info["name"], file_info["extension"], file_info["size"],
                            file_info["created"], file_info["modified"], file_info["accessed"],
                            file_hash, 1 if has_content and content else 0,
                            datetime.now().timestamp(), os.path.dirname(file_path)
                        ))
                        
                        file_id = cursor.lastrowid
                        
                        if has_content and content:
                            cursor.execute('''
                                INSERT INTO files_fts(rowid, name, path, content)
                                VALUES (?, ?, ?, ?)
                            ''', (file_id, file_info["name"], file_path, content))
                        
                        indexed += 1
                    
                    if (i + 1) % 100 == 0:
                        conn.commit()
                    
                    if callback and (i + 1) % 10 == 0:
                        callback({
                            "current": i + 1,
                            "total": total_files,
                            "indexed": indexed,
                            "updated": updated,
                            "skipped": skipped,
                            "path": file_path
                        })
                
                except Exception as e:
                    errors += 1
                    continue
            
            conn.commit()
        
        self._running = False
        
        return {
            "indexed": indexed,
            "updated": updated,
            "skipped": skipped,
            "errors": errors,
            "total": total_files
        }
    
    def _should_index_content(self, file_path: str) -> bool:
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext in TEXT_EXTENSIONS:
            return True
        
        if ext in DOCUMENT_EXTENSIONS:
            return self.config.get("search.search_content_in_binary", True)
        
        return False
    
    def _get_content_for_index(self, file_path: str) -> str:
        content = FileContentParser.parse(file_path)
        return content if content else ""
    
    def search(self, 
               query: str, 
               search_mode: str = SEARCH_MODE_BOTH,
               match_mode: str = MATCH_MODE_FUZZY,
               case_sensitive: bool = False,
               file_types: List[str] = None,
               min_size: int = None,
               max_size: int = None,
               modified_after: float = None,
               modified_before: float = None,
               created_after: float = None,
               created_before: float = None,
               search_paths: List[str] = None,
               exclude_paths: List[str] = None,
               limit: int = 1000) -> List[Dict[str, Any]]:
        
        if not query:
            return []
        
        with self._get_connection() as conn:
            conn.create_function("REGEXP", 2, self._regexp)
            
            cursor = conn.cursor()
            params = []
            conditions = []
            
            if search_mode == SEARCH_MODE_FILENAME:
                name_conditions, name_params = self._build_filename_conditions(query, match_mode, case_sensitive)
                conditions.append(name_conditions)
                params.extend(name_params)
            elif search_mode == SEARCH_MODE_CONTENT:
                content_conditions, content_params = self._build_content_conditions(query, match_mode)
                conditions.append(content_conditions)
                params.extend(content_params)
            else:
                name_conditions, name_params = self._build_filename_conditions(query, match_mode, case_sensitive)
                content_conditions, content_params = self._build_content_conditions(query, match_mode)
                conditions.append(f"({name_conditions} OR {content_conditions})")
                params.extend(name_params)
                params.extend(content_params)
            
            if file_types:
                ext_conditions = []
                for ext in file_types:
                    if not ext.startswith("."):
                        ext = "." + ext
                    ext_conditions.append("extension = ?")
                    params.append(ext.lower())
                if ext_conditions:
                    conditions.append(f"({' OR '.join(ext_conditions)})")
            
            if min_size is not None:
                conditions.append("size >= ?")
                params.append(min_size)
            if max_size is not None:
                conditions.append("size <= ?")
                params.append(max_size)
            
            if modified_after is not None:
                conditions.append("modified >= ?")
                params.append(modified_after)
            if modified_before is not None:
                conditions.append("modified <= ?")
                params.append(modified_before)
            
            if created_after is not None:
                conditions.append("created >= ?")
                params.append(created_after)
            if created_before is not None:
                conditions.append("created <= ?")
                params.append(created_before)
            
            if search_paths:
                path_conditions = []
                for path in search_paths:
                    normalized_path = os.path.normpath(path)
                    path_conditions.append("(directory LIKE ? OR path = ?)")
                    params.append(normalized_path + "%")
                    params.append(normalized_path)
                if path_conditions:
                    conditions.append(f"({' OR '.join(path_conditions)})")
            
            if exclude_paths:
                for path in exclude_paths:
                    normalized_path = os.path.normpath(path)
                    conditions.append("(directory NOT LIKE ? AND path != ?)")
                    params.append(normalized_path + "%")
                    params.append(normalized_path)
            
            where_clause = " AND ".join(conditions) if conditions else "1=1"
            
            sql = f'''
                SELECT id, path, name, extension, size, created, modified, 
                       accessed, file_hash, has_content_index, indexed_at, directory
                FROM files 
                WHERE {where_clause}
                ORDER BY modified DESC
                LIMIT ?
            '''
            params.append(limit)
            
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            
            results = []
            for row in rows:
                results.append({
                    "id": row["id"],
                    "path": row["path"],
                    "name": row["name"],
                    "extension": row["extension"],
                    "size": row["size"],
                    "created": row["created"],
                    "modified": row["modified"],
                    "accessed": row["accessed"],
                    "has_content_index": bool(row["has_content_index"]),
                    "match_mode": "filename" if self._matches_filename(row["name"], query, case_sensitive) else "content"
                })
            
            return results
    
    def _build_filename_conditions(self, query: str, match_mode: str, case_sensitive: bool) -> Tuple[str, List]:
        if match_mode == MATCH_MODE_EXACT:
            if case_sensitive:
                return "name = ?", [query]
            else:
                return "name LIKE ?", [query]
        else:
            if case_sensitive:
                return "name REGEXP ?", [re.escape(query)]
            else:
                return "name LIKE ?", [f"%{query}%"]
    
    def _build_content_conditions(self, query: str, match_mode: str) -> Tuple[str, List]:
        if match_mode == MATCH_MODE_EXACT:
            return '''
                id IN (SELECT rowid FROM files_fts WHERE files_fts MATCH ?)
            ''', [f'"{query}"']
        else:
            terms = query.split()
            fts_query = " ".join(terms)
            return '''
                id IN (SELECT rowid FROM files_fts WHERE files_fts MATCH ?)
            ''', [fts_query]
    
    def _regexp(self, pattern: str, text: str) -> bool:
        if text is None:
            return False
        return bool(re.search(pattern, text))
    
    def _matches_filename(self, name: str, query: str, case_sensitive: bool) -> bool:
        if case_sensitive:
            return query in name
        else:
            return query.lower() in name.lower()
    
    def get_file_content(self, file_id: int) -> Optional[str]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute('SELECT content FROM files_fts WHERE rowid = ?', (file_id,))
            row = cursor.fetchone()
            
            if row and row["content"]:
                return row["content"]
            
            cursor.execute('SELECT path FROM files WHERE id = ?', (file_id,))
            row = cursor.fetchone()
            
            if row:
                return FileContentParser.parse(row["path"])
            
            return None
    
    def clear_index(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM files')
            cursor.execute('DELETE FROM files_fts')
            conn.commit()
    
    def get_index_stats(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) as count FROM files')
            total_files = cursor.fetchone()["count"]
            
            cursor.execute('SELECT COUNT(*) as count FROM files WHERE has_content_index = 1')
            indexed_content = cursor.fetchone()["count"]
            
            cursor.execute('SELECT SUM(size) as total_size FROM files')
            result = cursor.fetchone()
            total_size = result["total_size"] if result["total_size"] else 0
            
            return {
                "total_files": total_files,
                "indexed_content": indexed_content,
                "total_size": total_size
            }
    
    def get_all_extensions(self) -> List[str]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT DISTINCT extension FROM files WHERE extension IS NOT NULL ORDER BY extension')
            return [row["extension"] for row in cursor.fetchall() if row["extension"]]
