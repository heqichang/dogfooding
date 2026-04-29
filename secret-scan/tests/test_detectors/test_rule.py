import re
from pathlib import Path
from typing import List
from unittest.mock import patch

import pytest

from secret_scan.detectors.rule import RuleDetector
from secret_scan.models import Severity


class TestRuleDetectorBasic:
    def test_detector_initialization(self):
        detector = RuleDetector()
        assert detector.get_id() == "rule-detector"
        assert detector.get_name() == "Rule-based Secret Detector"

    def test_get_rules_returns_list(self):
        detector = RuleDetector()
        rules = detector.get_rules()
        assert isinstance(rules, list)
        assert len(rules) > 0

    def test_builtin_rules_loaded(self):
        detector = RuleDetector()
        rules = detector.get_rules()
        rule_ids = [r.id for r in rules]

        assert "aws-access-key-id" in rule_ids
        assert "github-pat-classic" in rule_ids
        assert "private-key-header" in rule_ids


class TestRuleDetection:
    def test_aws_access_key_detection(self):
        detector = RuleDetector()
        content = """
        AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
        AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        """
        findings = detector.detect(content, file_path="config.py")

        aws_findings = [f for f in findings if f.rule_id == "aws-access-key-id"]
        assert len(aws_findings) >= 1
        assert "AKIAIOSFODNN7EXAMPLE" in aws_findings[0].match_content

    def test_github_token_detection(self):
        detector = RuleDetector()
        content = 'GITHUB_TOKEN = "ghp_abcdefghijklmnopqrstuvwxyz0123456789"'
        findings = detector.detect(content, file_path="secrets.py")

        github_findings = [f for f in findings if f.rule_id.startswith("github")]
        assert len(github_findings) >= 1

    def test_private_key_header_detection(self):
        detector = RuleDetector()
        content = """
        -----BEGIN RSA PRIVATE KEY-----
        MIIEowIBAAKCAQEA
        -----END RSA PRIVATE KEY-----
        """
        findings = detector.detect(content, file_path="id_rsa")

        key_findings = [f for f in findings if "private" in f.rule_id.lower() or "key" in f.rule_id.lower()]
        assert len(key_findings) >= 1

    def test_line_number_calculation(self):
        detector = RuleDetector()
        lines = [
            "line 1",
            "line 2 with secret: AKIAIOSFODNN7EXAMPLE",
            "line 3",
            "line 4: ghp_abcdefghijklmnopqrstuvwxyz0123456789",
        ]
        content = "\n".join(lines)
        findings = detector.detect(content, file_path="test.py")

        aws_findings = [f for f in findings if f.rule_id == "aws-access-key-id"]
        assert len(aws_findings) == 1
        assert aws_findings[0].line_number == 2

        github_findings = [f for f in findings if f.rule_id.startswith("github")]
        assert len(github_findings) == 1
        assert github_findings[0].line_number == 4

    def test_snippet_context(self):
        detector = RuleDetector()
        lines = [
            "import os",
            "import boto3",
            "",
            "AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE'",
            "AWS_SECRET = 'secret'",
            "",
            "client = boto3.client('s3')",
        ]
        content = "\n".join(lines)
        findings = detector.detect(content, file_path="aws.py")

        aws_findings = [f for f in findings if f.rule_id == "aws-access-key-id"]
        assert len(aws_findings) == 1
        assert aws_findings[0].snippet is not None

    def test_file_path_in_finding(self):
        detector = RuleDetector()
        content = 'API_KEY = "AKIAIOSFODNN7EXAMPLE"'
        findings = detector.detect(content, file_path="src/config.py")

        assert len(findings) >= 1
        assert findings[0].file_path == "src/config.py"


class TestRuleSeverity:
    def test_rule_severity_parsing(self):
        detector = RuleDetector()
        rules = detector.get_rules()

        for rule in rules:
            assert isinstance(rule.severity, Severity)
            assert rule.severity in [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL]

    def test_critical_severity_rules_exist(self):
        detector = RuleDetector()
        rules = detector.get_rules()
        critical_rules = [r for r in rules if r.severity == Severity.CRITICAL]

        assert len(critical_rules) > 0

    def test_high_severity_rules_exist(self):
        detector = RuleDetector()
        rules = detector.get_rules()
        high_rules = [r for r in rules if r.severity == Severity.HIGH]

        assert len(high_rules) > 0


class TestCustomRules:
    def test_custom_rule_loading(self):
        custom_rules = [
            {
                "id": "custom-my-token",
                "name": "My Custom Token",
                "pattern": "mytok_[A-Za-z0-9]{16}",
                "severity": "high",
                "description": "Detects my custom tokens",
                "tags": ["custom"],
            }
        ]
        detector = RuleDetector(custom_rules=custom_rules)
        rules = detector.get_rules()

        custom_rule = next((r for r in rules if r.id == "custom-my-token"), None)
        assert custom_rule is not None
        assert custom_rule.name == "My Custom Token"
        assert custom_rule.severity == Severity.HIGH

    def test_custom_rule_detection(self):
        custom_rules = [
            {
                "id": "custom-test",
                "name": "Test Pattern",
                "pattern": "test_secret_[a-z]+",
                "severity": "medium",
                "description": "Test",
            }
        ]
        detector = RuleDetector(custom_rules=custom_rules)
        content = 'TOKEN = "test_secret_abcdef"'
        findings = detector.detect(content)

        custom_findings = [f for f in findings if f.rule_id == "custom-test"]
        assert len(custom_findings) == 1


class TestDisabledRules:
    def test_disabled_builtin_rule_not_loaded(self):
        from secret_scan.config import Config, RulesConfig

        config = Config(
            rules=RulesConfig(
                disabled_builtins=["aws-access-key-id", "private-key-header"]
            )
        )
        detector = RuleDetector(config=config)
        rules = detector.get_rules()
        rule_ids = [r.id for r in rules]

        assert "aws-access-key-id" not in rule_ids
        assert "private-key-header" not in rule_ids

    def test_disabled_rule_not_detected(self):
        from secret_scan.config import Config, RulesConfig

        config = Config(
            rules=RulesConfig(
                disabled_builtins=["aws-access-key-id"]
            )
        )
        detector = RuleDetector(config=config)
        content = 'AWS_KEY = "AKIAIOSFODNN7EXAMPLE"'
        findings = detector.detect(content)

        aws_findings = [f for f in findings if f.rule_id == "aws-access-key-id"]
        assert len(aws_findings) == 0


class TestRulePatterns:
    @pytest.mark.parametrize(
        "token_value,rule_id_fragment",
        [
            # GitHub
            ("ghp_abcdefghijklmnopqrstuvwxyz0123456789", "github"),
            ("gho_abcdefghijklmnopqrstuvwxyz0123456789", "github"),
            ("ghu_abcdefghijklmnopqrstuvwxyz0123456789", "github"),
            ("ghs_abcdefghijklmnopqrstuvwxyz0123456789", "github"),
            ("ghr_abcdefghijklmnopqrstuvwxyz0123456789", "github"),
            # GitLab
            ("glpat-abcdefghijklmnopqrst", "gitlab"),
            # Slack
            ("xoxb-1234567890-abcdefghijklmnopqrstuvwxyz", "slack"),
            ("xoxp-1234567890-abcdefghijklmnopqrstuvwxyz", "slack"),
            # Stripe
            ("sk_live_abcdefghijklmnopqrstuvwx", "stripe"),
            ("pk_test_abcdefghijklmnopqrstuvwx", "stripe"),
        ],
    )
    def test_various_token_patterns(self, token_value: str, rule_id_fragment: str):
        detector = RuleDetector()
        content = f'TOKEN = "{token_value}"'
        findings = detector.detect(content)

        matching_findings = [f for f in findings if rule_id_fragment in f.rule_id.lower()]
        assert len(matching_findings) >= 1, f"No {rule_id_fragment} rule matched token: {token_value}"

    def test_connection_string_detection(self):
        detector = RuleDetector()
        content = 'DATABASE_URL = "postgresql://user:password@localhost:5432/db"'
        findings = detector.detect(content)

        connection_findings = [f for f in findings if "connection" in f.rule_id.lower()]
        assert len(connection_findings) >= 1

    def test_jwt_token_detection(self):
        detector = RuleDetector()
        content = 'JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"'
        findings = detector.detect(content)

        jwt_findings = [f for f in findings if "jwt" in f.rule_id.lower()]
        assert len(jwt_findings) >= 1

    def test_bearer_token_detection(self):
        detector = RuleDetector()
        content = 'headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
        findings = detector.detect(content)

        bearer_findings = [f for f in findings if "bearer" in f.rule_id.lower()]
        assert len(bearer_findings) >= 1

    def test_generic_api_key_detection(self):
        detector = RuleDetector()
        patterns = [
            'API_KEY = "abcdefghijklmnopqrstuvwxyz012345"',
            'api_key: "abcdefghijklmnopqrstuvwxyz012345"',
            'SECRET_KEY = "abcdefghijklmnopqrstuvwxyz012345"',
            'ACCESS_TOKEN = "abcdefghijklmnopqrstuvwxyz012345"',
        ]
        for pattern in patterns:
            findings = detector.detect(pattern)
            generic_findings = [f for f in findings if "generic" in f.rule_id.lower()]
            assert len(generic_findings) >= 1, f"Pattern not detected: {pattern}"

    def test_password_literal_detection(self):
        detector = RuleDetector()
        patterns = [
            'password = "mysecretpassword"',
            'PASSWORD: "supersecret123"',
            'passwd = "abc123"',
            'pwd = "secret"',
        ]
        for pattern in patterns:
            findings = detector.detect(pattern)
            password_findings = [f for f in findings if "password" in f.rule_id.lower()]
            assert len(password_findings) >= 1, f"Pattern not detected: {pattern}"


class TestOpenAIApiKey:
    def test_openai_api_key_detection(self):
        detector = RuleDetector()
        patterns = [
            'OPENAI_API_KEY = "sk-abcdefghijklmnopqrstT3BlbkFJabcdefghijklmnopqrst"',
            'api_key = "sk-proj-abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmno"',
        ]
        for pattern in patterns:
            findings = detector.detect(pattern)
            openai_findings = [f for f in findings if "openai" in f.rule_id.lower()]
            assert len(openai_findings) >= 1, f"OpenAI key not detected: {pattern}"


class TestDiscordBotToken:
    def test_discord_bot_token_detection(self):
        detector = RuleDetector()
        content = 'DISCORD_TOKEN = "MTA1OTM5MzUxNzM5NTU1MzU1OQ.Gv3X7T.abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN"'
        findings = detector.detect(content)

        discord_findings = [f for f in findings if "discord" in f.rule_id.lower()]
        assert len(discord_findings) >= 1


class TestNotionToken:
    def test_notion_token_detection(self):
        detector = RuleDetector()
        content = 'NOTION_TOKEN = "secret_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG"'
        findings = detector.detect(content)

        notion_findings = [f for f in findings if "notion" in f.rule_id.lower()]
        assert len(notion_findings) >= 1


class TestMultipleFindings:
    def test_multiple_secrets_in_same_file(self):
        detector = RuleDetector()
        content = """
        AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
        GITHUB_TOKEN = "ghp_abcdefghijklmnopqrstuvwxyz0123456789"
        API_KEY = "sk_live_abcdefghijklmnopqrstuvwx"
        """
        findings = detector.detect(content, file_path="secrets.py")

        aws = [f for f in findings if f.rule_id == "aws-access-key-id"]
        github = [f for f in findings if f.rule_id.startswith("github")]
        stripe = [f for f in findings if f.rule_id.startswith("stripe")]

        assert len(aws) >= 1
        assert len(github) >= 1
        assert len(stripe) >= 1

    def test_same_secret_multiple_times(self):
        detector = RuleDetector()
        content = """
        KEY1 = "AKIAIOSFODNN7EXAMPLE"
        KEY2 = "AKIAIOSFODNN7EXAMPLE"
        """
        findings = detector.detect(content)
        aws = [f for f in findings if f.rule_id == "aws-access-key-id"]

        assert len(aws) == 2
