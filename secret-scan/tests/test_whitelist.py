from typing import List

import pytest

from secret_scan.config import Config, WhitelistConfig
from secret_scan.models import Finding, Severity
from secret_scan.whitelist import NOSECRET_PATTERNS, Whitelist


class TestWhitelistBasic:
    def test_whitelist_initialization(self):
        whitelist = Whitelist()
        assert whitelist.get_path_patterns() == []
        assert whitelist.get_content_patterns() == []
        assert whitelist.get_rule_whitelist() == []

    def test_whitelist_with_config(self):
        config = Config(
            whitelist=WhitelistConfig(
                paths=["tests/**", "examples/**"],
                contents=["test-credential", "example-key"],
                rules=["generic-api-key"],
            )
        )
        whitelist = Whitelist(config=config)

        assert "tests/**" in whitelist.get_path_patterns()
        assert "test-credential" in whitelist.get_content_patterns()
        assert "generic-api-key" in whitelist.get_rule_whitelist()


class TestPathWhitelist:
    def test_path_whitelist_exact_match(self):
        config = Config(
            whitelist=WhitelistConfig(
                paths=["tests/test_api.py"]
            )
        )
        whitelist = Whitelist(config=config)

        finding = Finding(
            file_path="tests/test_api.py",
            line_number=10,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        assert whitelist.is_whitelisted(finding) is True

    def test_path_whitelist_glob_match(self):
        config = Config(
            whitelist=WhitelistConfig(
                paths=["tests/**"]
            )
        )
        whitelist = Whitelist(config=config)

        test_paths = [
            "tests/test_api.py",
            "tests/unit/test_models.py",
            "tests/integration/test_auth.py",
        ]

        for path in test_paths:
            finding = Finding(
                file_path=path,
                line_number=10,
                rule_id="aws-access-key-id",
                severity=Severity.HIGH,
                match_content="AKIAIOSFODNN7EXAMPLE",
            )
            assert whitelist.is_whitelisted(finding) is True, f"Path {path} not whitelisted"

    def test_path_whitelist_non_match(self):
        config = Config(
            whitelist=WhitelistConfig(
                paths=["tests/**"]
            )
        )
        whitelist = Whitelist(config=config)

        finding = Finding(
            file_path="src/api.py",
            line_number=10,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        assert whitelist.is_whitelisted(finding) is False

    def test_path_whitelist_wildcard_extension(self):
        config = Config(
            whitelist=WhitelistConfig(
                paths=["*.sample.py", "**/*.test.py"]
            )
        )
        whitelist = Whitelist(config=config)

        finding1 = Finding(
            file_path="config.sample.py",
            line_number=5,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        finding2 = Finding(
            file_path="tests/auth.test.py",
            line_number=5,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        assert whitelist.is_whitelisted(finding1) is True
        assert whitelist.is_whitelisted(finding2) is True

    def test_is_path_whitelisted_str_method(self):
        config = Config(
            whitelist=WhitelistConfig(
                paths=["tests/**"]
            )
        )
        whitelist = Whitelist(config=config)

        assert whitelist.is_path_whitelisted_str("tests/test_api.py") is True
        assert whitelist.is_path_whitelisted_str("src/api.py") is False


class TestContentWhitelist:
    def test_content_whitelist_exact_match(self):
        config = Config(
            whitelist=WhitelistConfig(
                contents=["test-credential-123"]
            )
        )
        whitelist = Whitelist(config=config)

        finding = Finding(
            file_path="config.py",
            line_number=10,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="test-credential-123-abc",
        )

        assert whitelist.is_whitelisted(finding) is True

    def test_content_whitelist_partial_match(self):
        config = Config(
            whitelist=WhitelistConfig(
                contents=["example"]
            )
        )
        whitelist = Whitelist(config=config)

        finding = Finding(
            file_path="config.py",
            line_number=10,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIA-example-key-1234567890",
        )

        assert whitelist.is_whitelisted(finding) is True

    def test_content_whitelist_regex_match(self):
        config = Config(
            whitelist=WhitelistConfig(
                contents=["test-\\d+", "placeholder-.*"]
            )
        )
        whitelist = Whitelist(config=config)

        finding1 = Finding(
            file_path="config.py",
            line_number=10,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="test-12345-key",
        )

        finding2 = Finding(
            file_path="config.py",
            line_number=10,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="placeholder-abc123",
        )

        assert whitelist.is_whitelisted(finding1) is True
        assert whitelist.is_whitelisted(finding2) is True

    def test_content_whitelist_non_match(self):
        config = Config(
            whitelist=WhitelistConfig(
                contents=["test-credential"]
            )
        )
        whitelist = Whitelist(config=config)

        finding = Finding(
            file_path="config.py",
            line_number=10,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="real-secret-key-123",
        )

        assert whitelist.is_whitelisted(finding) is False


class TestRuleWhitelist:
    def test_rule_whitelist_exact_match(self):
        config = Config(
            whitelist=WhitelistConfig(
                rules=["generic-api-key", "password-in-code"]
            )
        )
        whitelist = Whitelist(config=config)

        finding = Finding(
            file_path="config.py",
            line_number=10,
            rule_id="generic-api-key",
            severity=Severity.MEDIUM,
            match_content="api_key = 'abc123def456'",
        )

        assert whitelist.is_whitelisted(finding) is True

    def test_rule_whitelist_non_match(self):
        config = Config(
            whitelist=WhitelistConfig(
                rules=["generic-api-key"]
            )
        )
        whitelist = Whitelist(config=config)

        finding = Finding(
            file_path="config.py",
            line_number=10,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        assert whitelist.is_whitelisted(finding) is False


class TestInlineNosecretComment:
    def test_nosecret_hash_comment(self):
        whitelist = Whitelist()

        finding = Finding(
            file_path="config.py",
            line_number=3,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        lines = [
            "import os",
            "",
            "AWS_KEY = 'AKIAIOSFODNN7EXAMPLE'  # nosecret",
            "",
            "print('hello')",
        ]

        assert whitelist.is_whitelisted(finding, file_lines=lines) is True

    def test_nosecret_double_slash_comment(self):
        whitelist = Whitelist()

        finding = Finding(
            file_path="config.js",
            line_number=3,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        lines = [
            "import os",
            "",
            'const AWS_KEY = "AKIAIOSFODNN7EXAMPLE"; // nosecret',
            "",
            "console.log('hello');",
        ]

        assert whitelist.is_whitelisted(finding, file_lines=lines) is True

    def test_nosecret_sql_comment(self):
        whitelist = Whitelist()

        finding = Finding(
            file_path="query.sql",
            line_number=3,
            rule_id="password-in-code",
            severity=Severity.MEDIUM,
            match_content="password = 'secret123'",
        )

        lines = [
            "SELECT * FROM users",
            "WHERE 1=1",
            "  AND password = 'secret123' -- nosecret",
        ]

        assert whitelist.is_whitelisted(finding, file_lines=lines) is True

    def test_nosecret_html_comment(self):
        whitelist = Whitelist()

        finding = Finding(
            file_path="config.html",
            line_number=3,
            rule_id="generic-api-key",
            severity=Severity.MEDIUM,
            match_content="api_key = 'abc123def456'",
        )

        lines = [
            "<div>",
            "  <script>",
            "    var api_key = 'abc123def456'; <!-- nosecret -->",
            "  </script>",
            "</div>",
        ]

        assert whitelist.is_whitelisted(finding, file_lines=lines) is True

    def test_nosecret_plain_text(self):
        whitelist = Whitelist()

        finding = Finding(
            file_path="config.py",
            line_number=3,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        lines = [
            "import os",
            "",
            "AWS_KEY = 'AKIAIOSFODNN7EXAMPLE'  nosecret",
            "",
            "print('hello')",
        ]

        assert whitelist.is_whitelisted(finding, file_lines=lines) is True

    def test_nosecret_with_content(self):
        whitelist = Whitelist()

        finding = Finding(
            file_path="config.py",
            line_number=3,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        content = """import os

AWS_KEY = 'AKIAIOSFODNN7EXAMPLE'  # nosecret

print('hello')
"""

        assert whitelist.is_whitelisted(finding, file_content=content) is True

    def test_no_nosecret_comment(self):
        whitelist = Whitelist()

        finding = Finding(
            file_path="config.py",
            line_number=3,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        lines = [
            "import os",
            "",
            "AWS_KEY = 'AKIAIOSFODNN7EXAMPLE'",
            "",
            "print('hello')",
        ]

        assert whitelist.is_whitelisted(finding, file_lines=lines) is False


class TestCombinedWhitelist:
    def test_multiple_whitelist_types(self):
        config = Config(
            whitelist=WhitelistConfig(
                paths=["tests/**"],
                contents=["example"],
                rules=["generic-api-key"],
            )
        )
        whitelist = Whitelist(config=config)

        finding_path = Finding(
            file_path="tests/test_api.py",
            line_number=10,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        finding_content = Finding(
            file_path="src/config.py",
            line_number=10,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="example-key-12345",
        )

        finding_rule = Finding(
            file_path="src/api.py",
            line_number=10,
            rule_id="generic-api-key",
            severity=Severity.MEDIUM,
            match_content="api_key = 'abc123def456'",
        )

        finding_none = Finding(
            file_path="src/real_config.py",
            line_number=10,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAREALSECRETHERE",
        )

        assert whitelist.is_whitelisted(finding_path) is True
        assert whitelist.is_whitelisted(finding_content) is True
        assert whitelist.is_whitelisted(finding_rule) is True
        assert whitelist.is_whitelisted(finding_none) is False


class TestNosecretPatterns:
    def test_nosecret_patterns_compile(self):
        for pattern in NOSECRET_PATTERNS:
            assert pattern is not None

    def test_nosecret_variations(self):
        test_cases = [
            ("# nosecret", True),
            ("# NOSECRET", True),
            ("# NoSecret", True),
            ("# nosecret here", True),
            ("// nosecret", True),
            ("// NOSECRET", True),
            ("-- nosecret", True),
            ("/* nosecret */", True),
            ("<!-- nosecret -->", True),
        ]

        for test_str, expected in test_cases:
            matched = any(p.search(test_str) for p in NOSECRET_PATTERNS)
            assert matched == expected, f"Pattern mismatch for: {test_str}"


class TestEdgeCases:
    def test_empty_finding(self):
        whitelist = Whitelist()

        finding = Finding(
            file_path="",
            line_number=0,
            rule_id="",
            severity=Severity.LOW,
            match_content="",
        )

        assert whitelist.is_whitelisted(finding) is False

    def test_none_file_content(self):
        whitelist = Whitelist()

        finding = Finding(
            file_path="config.py",
            line_number=1,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        assert whitelist.is_whitelisted(finding, file_content=None) is False

    def test_line_number_out_of_bounds(self):
        whitelist = Whitelist()

        finding = Finding(
            file_path="config.py",
            line_number=100,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        lines = ["line1", "line2"]

        assert whitelist.is_whitelisted(finding, file_lines=lines) is False

    def test_line_number_zero(self):
        whitelist = Whitelist()

        finding = Finding(
            file_path="config.py",
            line_number=0,
            rule_id="aws-access-key-id",
            severity=Severity.HIGH,
            match_content="AKIAIOSFODNN7EXAMPLE",
        )

        lines = ["line1", "line2"]

        assert whitelist.is_whitelisted(finding, file_lines=lines) is False
