import math
import re
from typing import List, Optional, Set, Tuple

from secret_scan.config import Config, get_default_config
from secret_scan.detectors.base import BaseDetector
from secret_scan.models import Finding, Severity


def calculate_entropy(data: str) -> float:
    """
    Calculate Shannon entropy for a string.

    Higher entropy = more random.
    - Random Base64: ~4.0-4.5
    - Random Hex: ~3.5-4.0
    - English text: ~1.0-2.0
    - Repeated characters: ~0.0-1.0

    Args:
        data: Input string to measure.

    Returns:
        Shannon entropy value (0 = minimum, log2(alphabet_size) = maximum).
    """
    if not data:
        return 0.0

    data_len = len(data)
    frequency: dict = {}

    for char in data:
        frequency[char] = frequency.get(char, 0) + 1

    entropy = 0.0
    for count in frequency.values():
        probability = count / data_len
        entropy -= probability * math.log2(probability)

    return entropy


def is_base64_string(s: str) -> bool:
    """
    Check if a string is likely Base64 encoded.

    Args:
        s: Input string.

    Returns:
        True if string matches Base64 patterns.
    """
    base64_pattern = re.compile(
        r"^[A-Za-z0-9+/]*={0,2}$|^[A-Za-z0-9_-]*={0,2}$"
    )
    if not base64_pattern.match(s):
        return False

    if len(s) % 4 != 0 and not (len(s) % 4 == 3 and s.endswith("=")) and not (len(s) % 4 == 2 and s.endswith("==")):
        return False

    return True


def is_hex_string(s: str) -> bool:
    """
    Check if a string is likely hexadecimal.

    Args:
        s: Input string.

    Returns:
        True if string contains only hex characters.
    """
    hex_pattern = re.compile(r"^[0-9a-fA-F]+$")
    return bool(hex_pattern.match(s))


def extract_candidate_strings(content: str, min_length: int = 10) -> List[Tuple[str, int]]:
    """
    Extract potential secret candidates from content.

    Looks for:
    - Quoted strings (single/double quotes)
    - Long alphanumeric strings with special chars (Base64/Hex-like)

    Args:
        content: The content to extract from.
        min_length: Minimum length to consider.

    Returns:
        List of (candidate_string, start_position) tuples.
    """
    candidates: List[Tuple[str, int]] = []
    seen: Set[str] = set()

    single_quote_pattern = rf"'([^']{{{min_length},}})'"
    double_quote_pattern = rf'"([^"]{{{min_length},}})"'

    quoted_patterns = [
        re.compile(single_quote_pattern),
        re.compile(double_quote_pattern),
    ]

    for pattern in quoted_patterns:
        for match in pattern.finditer(content):
            candidate = match.group(1)
            if len(candidate) >= min_length:
                pos = match.start(1)
                if candidate not in seen:
                    seen.add(candidate)
                    candidates.append((candidate, pos))

    long_string_pattern = re.compile(
        rf"(?<![A-Za-z0-9])([A-Za-z0-9+/=_-]{{{min_length},}})(?![A-Za-z0-9])"
    )

    for match in long_string_pattern.finditer(content):
        candidate = match.group(1)
        if len(candidate) >= min_length:
            if candidate not in seen:
                seen.add(candidate)
                candidates.append((candidate, match.start(1)))

    return candidates


class EntropyDetector(BaseDetector):
    """
    Detector that uses Shannon entropy to find high-randomness strings,
    which are likely to be secrets or API keys.
    """

    RULE_ID_BASE64 = "entropy-high-base64"
    RULE_ID_HEX = "entropy-high-hex"
    RULE_ID_GENERIC = "entropy-high-generic"

    def __init__(self, config: Optional[Config] = None):
        self._config = config or get_default_config()
        self._base64_threshold = self._config.entropy.base64_threshold
        self._hex_threshold = self._config.entropy.hex_threshold
        self._min_length_base64 = self._config.entropy.min_length_base64
        self._min_length_hex = self._config.entropy.min_length_hex
        self._enabled = self._config.entropy.enabled

    def detect(self, content: str, file_path: Optional[str] = None) -> List[Finding]:
        """
        Detect high-entropy strings in content.

        Args:
            content: The content to scan.
            file_path: Optional file path for context.

        Returns:
            List of detected Findings.
        """
        if not self._enabled:
            return []

        findings: List[Finding] = []
        lines = content.split("\n")

        min_candidate_length = min(self._min_length_base64, self._min_length_hex)
        candidates = extract_candidate_strings(content, min_length=min_candidate_length)

        for candidate, start_pos in candidates:
            finding = self._check_candidate(candidate, start_pos, lines, file_path)
            if finding:
                findings.append(finding)

        return findings

    def _check_candidate(
        self, candidate: str, start_pos: int, lines: List[str], file_path: Optional[str]
    ) -> Optional[Finding]:
        """
        Check a single candidate string for high entropy.

        Args:
            candidate: The string to check.
            start_pos: Starting position in original content.
            lines: Content split into lines.
            file_path: Optional file path.

        Returns:
            Finding if high entropy detected, None otherwise.
        """
        line_number = self._get_line_number_from_pos(lines, start_pos)
        column = self._get_column_from_pos(lines, start_pos)
        snippet = self._get_snippet(lines, line_number - 1) if line_number > 0 else None

        candidate_len = len(candidate)

        if candidate_len >= self._min_length_base64 and is_base64_string(candidate):
            entropy = calculate_entropy(candidate)
            if entropy >= self._base64_threshold:
                return Finding(
                    file_path=file_path or "",
                    line_number=line_number,
                    column=column,
                    rule_id=self.RULE_ID_BASE64,
                    severity=Severity.MEDIUM,
                    match_content=candidate,
                    snippet=snippet,
                    is_whitelisted=False,
                )

        if candidate_len >= self._min_length_hex and is_hex_string(candidate):
            entropy = calculate_entropy(candidate)
            if entropy >= self._hex_threshold:
                return Finding(
                    file_path=file_path or "",
                    line_number=line_number,
                    column=column,
                    rule_id=self.RULE_ID_HEX,
                    severity=Severity.MEDIUM,
                    match_content=candidate,
                    snippet=snippet,
                    is_whitelisted=False,
                )

        if candidate_len >= max(self._min_length_base64, self._min_length_hex):
            entropy = calculate_entropy(candidate)
            generic_threshold = min(self._base64_threshold, self._hex_threshold)
            if entropy >= generic_threshold:
                return Finding(
                    file_path=file_path or "",
                    line_number=line_number,
                    column=column,
                    rule_id=self.RULE_ID_GENERIC,
                    severity=Severity.LOW,
                    match_content=candidate,
                    snippet=snippet,
                    is_whitelisted=False,
                )

        return None

    @staticmethod
    def _get_line_number_from_pos(lines: List[str], pos: int) -> int:
        """Calculate line number from a character position."""
        current_pos = 0
        for line_num, line in enumerate(lines, 1):
            line_len = len(line) + 1
            if current_pos <= pos < current_pos + line_len:
                return line_num
            current_pos += line_len
        return len(lines) if lines else 1

    @staticmethod
    def _get_column_from_pos(lines: List[str], pos: int) -> int:
        """Calculate column number from a character position."""
        current_pos = 0
        for line in lines:
            line_len = len(line) + 1
            if current_pos <= pos < current_pos + line_len:
                return pos - current_pos + 1
            current_pos += line_len
        return 1

    @staticmethod
    def _get_snippet(lines: List[str], index: int, context: int = 2) -> str:
        """Get a snippet of lines around the specified index."""
        if index < 0 or index >= len(lines):
            return ""
        start = max(0, index - context)
        end = min(len(lines), index + context + 1)
        return "\n".join(lines[start:end])

    def get_id(self) -> str:
        return "entropy-detector"

    def get_name(self) -> str:
        return "Entropy-based Secret Detector"
