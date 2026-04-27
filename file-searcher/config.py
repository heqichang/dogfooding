import os
import json
import platform
from pathlib import Path
from typing import List, Dict, Any, Optional
from constants import DEFAULT_EXCLUDE_DIRS, DEFAULT_FILE_TYPES


class ConfigManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._initialized = True
        self.config_dir = self._get_config_dir()
        self.config_file = os.path.join(self.config_dir, "config.json")
        self.index_dir = os.path.join(self.config_dir, "index")
        self.db_file = os.path.join(self.config_dir, "file_index.db")
        
        self.config = self._load_default_config()
        self._load_config()
        
        os.makedirs(self.config_dir, exist_ok=True)
        os.makedirs(self.index_dir, exist_ok=True)
    
    def _get_config_dir(self) -> str:
        system = platform.system()
        if system == "Windows":
            app_data = os.environ.get("APPDATA", "")
            if app_data:
                return os.path.join(app_data, "QuickFileSearch")
            return os.path.join(str(Path.home()), "QuickFileSearch")
        elif system == "Darwin":
            return os.path.join(str(Path.home()), "Library", "Application Support", "QuickFileSearch")
        else:
            config_home = os.environ.get("XDG_CONFIG_HOME", "")
            if config_home:
                return os.path.join(config_home, "QuickFileSearch")
            return os.path.join(str(Path.home()), ".config", "QuickFileSearch")
    
    def _load_default_config(self) -> Dict[str, Any]:
        return {
            "search": {
                "case_sensitive": False,
                "match_mode": "fuzzy",
                "search_mode": "both",
                "max_results": 1000,
                "search_content_in_binary": True
            },
            "index": {
                "auto_index": True,
                "index_on_startup": False,
                "excluded_dirs": DEFAULT_EXCLUDE_DIRS.copy(),
                "excluded_extensions": [".tmp", ".temp", ".log", ".pyc", ".pyo"],
                "max_file_size_mb": 100
            },
            "paths": {
                "search_locations": [],
                "excluded_paths": []
            },
            "ui": {
                "theme": "light",
                "language": "zh_CN",
                "window_width": 1200,
                "window_height": 800,
                "show_preview": True
            },
            "history": {
                "search_history": [],
                "max_history_items": 50
            }
        }
    
    def _load_config(self):
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, "r", encoding="utf-8") as f:
                    loaded_config = json.load(f)
                    self._merge_config(self.config, loaded_config)
            except (json.JSONDecodeError, IOError):
                pass
    
    def _merge_config(self, default: Dict, loaded: Dict):
        for key, value in loaded.items():
            if key in default:
                if isinstance(value, dict) and isinstance(default[key], dict):
                    self._merge_config(default[key], value)
                else:
                    default[key] = value
    
    def save(self):
        try:
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(self.config, f, ensure_ascii=False, indent=2)
        except IOError:
            pass
    
    def get(self, key: str, default: Any = None) -> Any:
        keys = key.split(".")
        value = self.config
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value
    
    def set(self, key: str, value: Any):
        keys = key.split(".")
        config = self.config
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        config[keys[-1]] = value
    
    def add_search_history(self, query: str):
        history = self.config["history"]["search_history"]
        if query in history:
            history.remove(query)
        history.insert(0, query)
        
        max_items = self.config["history"]["max_history_items"]
        if len(history) > max_items:
            history = history[:max_items]
            self.config["history"]["search_history"] = history
    
    def get_search_history(self) -> List[str]:
        return self.config["history"]["search_history"]
    
    def clear_search_history(self):
        self.config["history"]["search_history"] = []
