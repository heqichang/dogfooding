import math
import secrets
import string
from typing import List

import pytest

from secret_scan.detectors.entropy import (
    EntropyDetector,
    calculate_entropy,
    extract_candidate_strings,
    is_base64_string,
    is_hex_string,
)
from secret_scan.models import Severity


class TestCalculateEntropy:
    def test_entropy_empty_string(self):
        assert calculate_entropy("") == 0.0

    def test_entropy_single_char_low(self):
        entropy = calculate_entropy("aaaaaaaaaaaaaaaa")
        assert entropy < 1.0

    def test_entropy_repeated_pattern(self):
        entropy = calculate_entropy("abababababababab")
        assert entropy < 2.0

    def test_entropy_random_base64(self):
        random_data = secrets.token_urlsafe(32)
        entropy = calculate_entropy(random_data)
        assert entropy > 3.0

    def test_entropy_max_theoretical_maximum(self):
        all_chars = string.printable
        entropy = calculate_entropy(all_chars)
        max_possible = math.log2(len(set(all_chars)))
        assert entropy > 0

    def test_low_entropy_less_than_2(self):
        assert calculate_entropy("aaaaaaaaaaaaaaa") < 2.0
        assert calculate_entropy("0000000000000000") < 2.0

    def test_high_entropy_greater_than_3(self):
        high_entropy = secrets.token_hex(32)
        assert calculate_entropy(high_entropy) > 3.0


class TestIsBase64String:
    def test_valid_base64(self):
        assert is_base64_string("SGVsbG8=")
        assert is_base64_string("SGVsbG8gV29ybGQ=")
        assert is_base64_string("aGVsbG8=")

    def test_valid_base64_urlsafe(self):
        assert is_base64_string("SGVsbG8")
        assert is_base64_string("aGVsbG8td29ybGQ")

    def test_invalid_base64(self):
        assert not is_base64_string("not!@#$")
        assert not is_base64_string("hello world")
        assert not is_base64_string("ghp_abcdefghijklmnop")

    def test_base64_with_padding(self):
        assert is_base64_string("YWJjZA==")
        assert is_base64_string("YWJjZGU=")
        assert is_base64_string("YWJjZGVm")


class TestIsHexString:
    def test_valid_hex(self):
        assert is_hex_string("0123456789abcdef")
        assert is_hex_string("ABCDEF1234567890")
        assert is_hex_string("a1b2c3d4e5f6")

    def test_invalid_hex(self):
        assert not is_hex_string("ghijklmnop")
        assert not is_hex_string("hello world")
        assert not is_hex_string("12345g")


class TestExtractCandidateStrings:
    def test_extract_quoted_strings(self):
        content = 'API_KEY = "abcdefghijklmnopqrstuvwxyz012345"'
        candidates = extract_candidate_strings(content, min_length=10)
        assert len(candidates) >= 1
        assert any("abcdefghijklmnopqrstuvwxyz012345" in c for c, _ in candidates)

    def test_extract_long_strings_single_quotes(self):
        content = "TOKEN = 'abcdefghijklmnopqrstuvwxyz'"
        candidates = extract_candidate_strings(content, min_length=10)
        assert len(candidates) >= 1

    def test_extract_long_alphanumeric(self):
        content = "Here is a long string: abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        candidates = extract_candidate_strings(content, min_length=20)
        assert len(candidates) >= 1

    def test_min_length_filter(self):
        content = 'short = "abcd"; long = "abcdefghijklmnopqrst"'
        candidates = extract_candidate_strings(content, min_length=15)
        short_candidates = [c for c, _ in candidates if len(c) < 15]
        assert len(short_candidates) == 0


class TestEntropyDetector:
    def test_detector_initialization(self):
        detector = EntropyDetector()
        assert detector.get_id() == "entropy-detector"
        assert detector.get_name() == "Entropy-based Secret Detector"

    def test_disabled_detector_returns_empty(self):
        from secret_scan.config import Config, EntropyConfig

        config = Config(
            entropy=EntropyConfig(enabled=False)
        )
        detector = EntropyDetector(config=config)

        high_entropy = secrets.token_urlsafe(32)
        content = f'KEY = "{high_entropy}"'
        findings = detector.detect(content)

        assert len(findings) == 0

    def test_detect_high_entropy_base64(self):
        detector = EntropyDetector()
        high_entropy = secrets.token_urlsafe(32)
        content = f'API_KEY = "{high_entropy}"'
        findings = detector.detect(content)

        assert len(findings) >= 1
        base64_findings = [f for f in findings if f.rule_id == EntropyDetector.RULE_ID_BASE64]
        assert len(base64_findings) >= 1

    def test_detect_high_entropy_hex(self):
        detector = EntropyDetector()
        high_entropy = secrets.token_hex(32)
        content = f'SECRET = "{high_entropy}"'
        findings = detector.detect(content)

        assert len(findings) >= 1
        hex_findings = [f for f in findings if f.rule_id in [EntropyDetector.RULE_ID_HEX, EntropyDetector.RULE_ID_GENERIC]]
        assert len(hex_findings) >= 1

    def test_low_entropy_not_detected(self):
        detector = EntropyDetector()
        content = 'API_KEY = "aaaaaaaaaaaaaaaaaaaaaaaaaaaa"'
        findings = detector.detect(content)

        high_findings = [f for f in findings if f.rule_id in [EntropyDetector.RULE_ID_BASE64, EntropyDetector.RULE_ID_HEX, EntropyDetector.RULE_ID_GENERIC]]
        assert len(high_findings) == 0

    def test_finding_contains_correct_metadata(self):
        detector = EntropyDetector()
        high_entropy = secrets.token_urlsafe(32)
        lines = [
            "import os",
            "",
            f'KEY = "{high_entropy}"',
            "",
            "print(key)",
        ]
        content = "\n".join(lines)
        findings = detector.detect(content, file_path="config.py")

        assert len(findings) >= 1
        finding = findings[0]

        assert finding.file_path == "config.py"
        assert finding.line_number == 3
        assert finding.severity in [Severity.LOW, Severity.MEDIUM]
        assert high_entropy in finding.match_content
        assert finding.snippet is not None

    def test_custom_threshold_config(self):
        from secret_scan.config import Config, EntropyConfig

        config = Config(
            entropy=EntropyConfig(
                enabled=True,
                base64_threshold=5.0,
                hex_threshold=5.0,
            )
        )
        detector = EntropyDetector(config=config)

        high_entropy = secrets.token_urlsafe(32)
        content = f'KEY = "{high_entropy}"'
        findings = detector.detect(content)

        base64_findings = [f for f in findings if f.rule_id == EntropyDetector.RULE_ID_BASE64]
        assert len(base64_findings) == 0

    def test_min_length_config(self):
        from secret_scan.config import Config, EntropyConfig

        config = Config(
            entropy=EntropyConfig(
                enabled=True,
                min_length_base64=100,
                min_length_hex=100,
            )
        )
        detector = EntropyDetector(config=config)

        high_entropy = secrets.token_urlsafe(32)
        content = f'KEY = "{high_entropy}"'
        findings = detector.detect(content)

        assert len(findings) == 0


class TestEntropyDetectorIntegration:
    def test_multiple_high_entropy_strings(self):
        detector = EntropyDetector()
        key1 = secrets.token_urlsafe(32)
        key2 = secrets.token_hex(32)
        content = f"""
        KEY1 = "{key1}"
        KEY2 = "{key2}"
        """
        findings = detector.detect(content)

        assert len(findings) >= 2

    def test_mixed_high_and_low_entropy(self):
        detector = EntropyDetector()
        high = secrets.token_urlsafe(32)
        low = "aaaaaaaaaaaaaaaaaaaaa"
        content = f"""
        HIGH = "{high}"
        LOW = "{low}"
        """
        findings = detector.detect(content)

        high_findings = [f for f in findings if high in f.match_content]
        low_findings = [f for f in findings if low in f.match_content]

        assert len(high_findings) >= 1
        assert len(low_findings) == 0


class TestRealWorldExamples:
    def test_typical_api_key_patterns(self):
        detector = EntropyDetector()
        patterns = [
            secrets.token_urlsafe(32),
            secrets.token_hex(32),
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/==",
        ]
        for pattern in patterns:
            content = f'KEY = "{pattern}"'
            findings = detector.detect(content)
            assert len(findings) >= 1, f"Pattern not detected: {pattern[:20]}..."

    def test_password_like_strings(self):
        detector = EntropyDetector()
        low_entropy_passwords = [
            "password123",
            "iloveyou",
            "12345678",
            "qwertyui",
        ]
        for pwd in low_entropy_passwords:
            content = f'PWD = "{pwd}"'
            findings = detector.detect(content)
            relevant = [f for f in findings if pwd in f.match_content]
            assert len(relevant) == 0, f"False positive on: {pwd}"


class TestFindingSeverity:
    def test_base64_severity(self):
        detector = EntropyDetector()
        high_entropy = secrets.token_urlsafe(32)
        content = f'KEY = "{high_entropy}"'
        findings = detector.detect(content)

        base64_findings = [f for f in findings if f.rule_id == EntropyDetector.RULE_ID_BASE64]
        if base64_findings:
            assert base64_findings[0].severity == Severity.MEDIUM

    def test_hex_severity(self):
        detector = EntropyDetector()
        high_entropy = secrets.token_hex(32)
        content = f'KEY = "{high_entropy}"'
        findings = detector.detect(content)

        hex_findings = [f for f in findings if f.rule_id == EntropyDetector.RULE_ID_HEX]
        if hex_findings:
            assert hex_findings[0].severity == Severity.MEDIUM

    def test_generic_severity(self):
        detector = EntropyDetector()
        mixed = "aB3!@#$%^&*()_+-=[]{}|;:,.<>?"
        content = f'KEY = "{mixed * 5}"'
        findings = detector.detect(content)

        generic_findings = [f for f in findings if f.rule_id == EntropyDetector.RULE_ID_GENERIC]
        if generic_findings:
            assert generic_findings[0].severity == Severity.LOW
