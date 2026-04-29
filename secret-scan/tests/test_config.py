import json
import os
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest
import yaml

from secret_scan.config import (
    Config,
    EntropyConfig,
    OutputConfig,
    RulesConfig,
    ScanConfig,
    WhitelistConfig,
    deep_merge,
    get_default_config,
    load_config,
)


class TestConfigDataclasses:
    def test_entropy_config_defaults(self):
        config = EntropyConfig()
        assert config.enabled is True
        assert config.base64_threshold == 4.0
        assert config.hex_threshold == 3.5
        assert config.min_length_base64 == 20
        assert config.min_length_hex == 40

    def test_rules_config_defaults(self):
        config = RulesConfig()
        assert config.enabled is True
        assert config.custom_rules == []
        assert config.disabled_builtins == []

    def test_whitelist_config_defaults(self):
        config = WhitelistConfig()
        assert config.paths == []
        assert config.contents == []
        assert config.rules == []

    def test_output_config_defaults(self):
        config = OutputConfig()
        assert config.verbose is False
        assert config.show_ignored is False

    def test_scan_config_defaults(self):
        config = ScanConfig()
        assert config.skip_gitignore is True
        assert ".git" in config.skip_dirs
        assert ".pyc" in config.skip_extensions
        assert config.max_file_size_mb == 1

    def test_config_defaults(self):
        config = Config()
        assert isinstance(config.entropy, EntropyConfig)
        assert isinstance(config.rules, RulesConfig)
        assert isinstance(config.whitelist, WhitelistConfig)
        assert isinstance(config.output, OutputConfig)
        assert isinstance(config.scan, ScanConfig)


class TestConfigFromDict:
    def test_from_dict_empty(self):
        config = Config.from_dict({})
        assert config.entropy.enabled is True
        assert config.rules.enabled is True

    def test_from_dict_partial(self):
        data = {
            "entropy": {
                "enabled": False,
                "base64_threshold": 3.8,
            },
            "whitelist": {
                "paths": ["tests/**"],
            },
        }
        config = Config.from_dict(data)
        assert config.entropy.enabled is False
        assert config.entropy.base64_threshold == 3.8
        assert config.entropy.hex_threshold == 3.5
        assert config.whitelist.paths == ["tests/**"]

    def test_from_dict_custom_rules(self):
        data = {
            "rules": {
                "custom_rules": [
                    {
                        "id": "custom-test",
                        "name": "Test Rule",
                        "pattern": "test_[a-z]+",
                        "severity": "medium",
                        "description": "Test rule",
                        "tags": ["test"],
                    }
                ],
                "disabled_builtins": ["generic-api-key"],
            }
        }
        config = Config.from_dict(data)
        assert len(config.rules.custom_rules) == 1
        assert config.rules.custom_rules[0]["id"] == "custom-test"
        assert config.rules.disabled_builtins == ["generic-api-key"]


class TestConfigToDict:
    def test_to_dict(self):
        config = Config()
        result = config.to_dict()
        assert isinstance(result, dict)
        assert "entropy" in result
        assert "rules" in result
        assert "whitelist" in result
        assert "output" in result
        assert "scan" in result

    def test_to_dict_is_json_serializable(self):
        config = Config.from_dict(
            {
                "whitelist": {
                    "paths": ["tests/**", "docs/**"],
                    "contents": ["test-credential"],
                }
            }
        )
        result = config.to_dict()
        assert json.dumps(result) is not None


class TestDeepMerge:
    def test_deep_merge_simple(self):
        base = {"a": 1, "b": 2}
        override = {"b": 3, "c": 4}
        result = deep_merge(base, override)
        assert result == {"a": 1, "b": 3, "c": 4}

    def test_deep_merge_nested(self):
        base = {"level1": {"a": 1, "b": 2}, "c": 3}
        override = {"level1": {"b": 20, "d": 4}}
        result = deep_merge(base, override)
        assert result == {"level1": {"a": 1, "b": 20, "d": 4}, "c": 3}

    def test_deep_merge_lists_replace(self):
        base = {"list_key": [1, 2, 3]}
        override = {"list_key": [4, 5]}
        result = deep_merge(base, override)
        assert result["list_key"] == [4, 5]


class TestLoadConfig:
    def test_load_config_no_files_returns_default(self):
        with patch("secret_scan.config.Path.home") as mock_home:
            with tempfile.TemporaryDirectory() as tmpdir:
                mock_home.return_value = Path(tmpdir)
                os.chdir(tmpdir)
                
                config = load_config()
                assert config.entropy.enabled is True
                assert config.rules.enabled is True

    def test_load_config_invalid_yaml_raises(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_file = Path(tmpdir) / ".secret-scan.yml"
            config_file.write_text("invalid: yaml: [this: is: not: valid")
            
            with pytest.raises(ValueError, match="Invalid YAML"):
                load_config(str(config_file))

    def test_load_config_project_overrides_default(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_file = Path(tmpdir) / ".secret-scan.yml"
            config_data = {
                "entropy": {"enabled": False},
                "whitelist": {"paths": ["tests/**"]},
            }
            config_file.write_text(yaml.safe_dump(config_data))
            
            config = load_config(str(config_file))
            assert config.entropy.enabled is False
            assert config.whitelist.paths == ["tests/**"]

    def test_get_default_config(self):
        config = get_default_config()
        assert isinstance(config, Config)
        assert config.entropy.enabled is True
        assert config.rules.enabled is True


class TestConfigIntegration:
    def test_full_config_roundtrip(self):
        original_data = {
            "entropy": {
                "enabled": True,
                "base64_threshold": 4.2,
                "hex_threshold": 3.6,
                "min_length_base64": 25,
                "min_length_hex": 50,
            },
            "rules": {
                "enabled": True,
                "custom_rules": [
                    {
                        "id": "my-custom-token",
                        "name": "My Custom Token",
                        "pattern": "mytok_[A-Za-z0-9]{32}",
                        "severity": "high",
                        "description": "My service tokens",
                        "tags": ["api", "token"],
                    }
                ],
                "disabled_builtins": ["generic-api-key"],
            },
            "whitelist": {
                "paths": ["tests/**", "examples/**"],
                "contents": ["test-credential", "example-key"],
                "rules": ["low-severity-rule"],
            },
            "output": {
                "verbose": True,
                "show_ignored": True,
            },
            "scan": {
                "skip_gitignore": True,
                "skip_dirs": [".git", "__pycache__", "node_modules"],
                "skip_extensions": [".pyc", ".class"],
                "max_file_size_mb": 2,
            },
        }

        config = Config.from_dict(original_data)
        result = config.to_dict()

        assert result["entropy"]["base64_threshold"] == 4.2
        assert result["entropy"]["min_length_hex"] == 50
        assert len(result["rules"]["custom_rules"]) == 1
        assert result["rules"]["custom_rules"][0]["id"] == "my-custom-token"
        assert result["rules"]["disabled_builtins"] == ["generic-api-key"]
        assert result["whitelist"]["paths"] == ["tests/**", "examples/**"]
        assert result["output"]["verbose"] is True
        assert result["scan"]["max_file_size_mb"] == 2
