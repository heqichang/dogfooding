import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


DEFAULT_CONFIG = {
    "entropy": {
        "enabled": True,
        "base64_threshold": 4.0,
        "hex_threshold": 3.5,
        "min_length_base64": 20,
        "min_length_hex": 40,
    },
    "rules": {
        "enabled": True,
        "custom_rules": [],
        "disabled_builtins": [],
    },
    "whitelist": {
        "paths": [],
        "contents": [],
        "rules": [],
    },
    "output": {
        "verbose": False,
        "show_ignored": False,
    },
    "scan": {
        "skip_gitignore": True,
        "skip_dirs": [".git", "__pycache__", "node_modules", ".venv", "venv"],
        "skip_extensions": [".pyc", ".class", ".o", ".so", ".dll", ".exe", ".bin", ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip", ".tar", ".gz"],
        "max_file_size_mb": 1,
    },
}


@dataclass
class EntropyConfig:
    enabled: bool = True
    base64_threshold: float = 4.0
    hex_threshold: float = 3.5
    min_length_base64: int = 20
    min_length_hex: int = 40


@dataclass
class RulesConfig:
    enabled: bool = True
    custom_rules: List[Dict[str, Any]] = field(default_factory=list)
    disabled_builtins: List[str] = field(default_factory=list)


@dataclass
class WhitelistConfig:
    paths: List[str] = field(default_factory=list)
    contents: List[str] = field(default_factory=list)
    rules: List[str] = field(default_factory=list)


@dataclass
class OutputConfig:
    verbose: bool = False
    show_ignored: bool = False


@dataclass
class ScanConfig:
    skip_gitignore: bool = True
    skip_dirs: List[str] = field(default_factory=list)
    skip_extensions: List[str] = field(default_factory=list)
    max_file_size_mb: int = 1


@dataclass
class Config:
    entropy: EntropyConfig = field(default_factory=EntropyConfig)
    rules: RulesConfig = field(default_factory=RulesConfig)
    whitelist: WhitelistConfig = field(default_factory=WhitelistConfig)
    output: OutputConfig = field(default_factory=OutputConfig)
    scan: ScanConfig = field(default_factory=ScanConfig)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Config":
        entropy_data = data.get("entropy", {})
        rules_data = data.get("rules", {})
        whitelist_data = data.get("whitelist", {})
        output_data = data.get("output", {})
        scan_data = data.get("scan", {})

        return cls(
            entropy=EntropyConfig(
                enabled=entropy_data.get("enabled", True),
                base64_threshold=entropy_data.get("base64_threshold", 4.0),
                hex_threshold=entropy_data.get("hex_threshold", 3.5),
                min_length_base64=entropy_data.get("min_length_base64", 20),
                min_length_hex=entropy_data.get("min_length_hex", 40),
            ),
            rules=RulesConfig(
                enabled=rules_data.get("enabled", True),
                custom_rules=rules_data.get("custom_rules", []),
                disabled_builtins=rules_data.get("disabled_builtins", []),
            ),
            whitelist=WhitelistConfig(
                paths=whitelist_data.get("paths", []),
                contents=whitelist_data.get("contents", []),
                rules=whitelist_data.get("rules", []),
            ),
            output=OutputConfig(
                verbose=output_data.get("verbose", False),
                show_ignored=output_data.get("show_ignored", False),
            ),
            scan=ScanConfig(
                skip_gitignore=scan_data.get("skip_gitignore", True),
                skip_dirs=scan_data.get("skip_dirs", [".git", "__pycache__", "node_modules", ".venv", "venv"]),
                skip_extensions=scan_data.get("skip_extensions", [".pyc", ".class", ".o", ".so", ".dll", ".exe", ".bin", ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip", ".tar", ".gz"]),
                max_file_size_mb=scan_data.get("max_file_size_mb", 1),
            ),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entropy": {
                "enabled": self.entropy.enabled,
                "base64_threshold": self.entropy.base64_threshold,
                "hex_threshold": self.entropy.hex_threshold,
                "min_length_base64": self.entropy.min_length_base64,
                "min_length_hex": self.entropy.min_length_hex,
            },
            "rules": {
                "enabled": self.rules.enabled,
                "custom_rules": self.rules.custom_rules,
                "disabled_builtins": self.rules.disabled_builtins,
            },
            "whitelist": {
                "paths": self.whitelist.paths,
                "contents": self.whitelist.contents,
                "rules": self.whitelist.rules,
            },
            "output": {
                "verbose": self.output.verbose,
                "show_ignored": self.output.show_ignored,
            },
            "scan": {
                "skip_gitignore": self.scan.skip_gitignore,
                "skip_dirs": self.scan.skip_dirs,
                "skip_extensions": self.scan.skip_extensions,
                "max_file_size_mb": self.scan.max_file_size_mb,
            },
        }


def deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    result = dict(base)
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        elif key in result and isinstance(result[key], list) and isinstance(value, list):
            result[key] = value
        else:
            result[key] = value
    return result


def load_config(config_path: Optional[str] = None) -> Config:
    config_data = dict(DEFAULT_CONFIG)

    user_config_path = Path.home() / ".secret-scan.yml"
    if user_config_path.exists():
        try:
            with open(user_config_path, "r", encoding="utf-8") as f:
                user_data = yaml.safe_load(f) or {}
            config_data = deep_merge(config_data, user_data)
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in user config {user_config_path}: {e}")

    project_config_path = None
    if config_path:
        project_config_path = Path(config_path)
    else:
        cwd_config = Path.cwd() / ".secret-scan.yml"
        if cwd_config.exists():
            project_config_path = cwd_config

    if project_config_path and project_config_path.exists():
        try:
            with open(project_config_path, "r", encoding="utf-8") as f:
                project_data = yaml.safe_load(f) or {}
            config_data = deep_merge(config_data, project_data)
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in config {project_config_path}: {e}")

    return Config.from_dict(config_data)


def get_default_config() -> Config:
    return Config.from_dict(DEFAULT_CONFIG)
