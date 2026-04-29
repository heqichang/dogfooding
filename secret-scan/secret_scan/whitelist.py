import fnmatch
import re
from pathlib import Path
from typing import List, Optional, Pattern

from secret_scan.config import Config, get_default_config
from secret_scan.models import Finding


NOSECRET_PATTERNS = [
    re.compile(r"#\s*nosecret(?:\s|$)", re.IGNORECASE),
    re.compile(r"//\s*nosecret(?:\s|$)", re.IGNORECASE),
    re.compile(r"--\s*nosecret(?:\s|$)", re.IGNORECASE),
    re.compile(r"/\*\s*nosecret(?:\s|\*/)", re.IGNORECASE),
    re.compile(r"<!--\s*nosecret(?:\s|-->)", re.IGNORECASE),
]


class Whitelist:
    """
    Handles whitelist logic for excluding findings based on:
    - Path patterns (glob)
    - Content strings/regex
    - Inline comments (nosecret)
    - Rule ID whitelist
    """

    def __init__(self, config: Optional[Config] = None):
        self._config = config or get_default_config()
        self._path_patterns: List[str] = self._config.whitelist.paths
        self._content_patterns: List[str] = self._config.whitelist.contents
        self._rule_whitelist: List[str] = self._config.whitelist.rules
        self._content_regex_patterns: List[Pattern] = []
        self._compile_content_patterns()

    def _compile_content_patterns(self) -> None:
        """Compile content patterns for regex matching."""
        for pattern in self._content_patterns:
            try:
                self._content_regex_patterns.append(re.compile(pattern))
            except re.error:
                self._content_regex_patterns.append(re.compile(re.escape(pattern)))

    def is_whitelisted(
        self,
        finding: Finding,
        file_content: Optional[str] = None,
        file_lines: Optional[List[str]] = None,
    ) -> bool:
        """
        Check if a finding should be whitelisted.

        Args:
            finding: The finding to check.
            file_content: Optional full file content for inline comment check.
            file_lines: Optional file lines for inline comment check.

        Returns:
            True if whitelisted, False otherwise.
        """
        if self._is_rule_whitelisted(finding):
            return True

        if self._is_path_whitelisted(finding):
            return True

        if self._is_content_whitelisted(finding):
            return True

        if file_content or file_lines:
            if self._has_inline_nosecret_comment(finding, file_content, file_lines):
                return True

        return False

    def _is_rule_whitelisted(self, finding: Finding) -> bool:
        """Check if finding's rule is whitelisted."""
        return finding.rule_id in self._rule_whitelist

    def _is_path_whitelisted(self, finding: Finding) -> bool:
        """Check if finding's file path matches any whitelist pattern."""
        if not finding.file_path:
            return False

        file_path = Path(finding.file_path)
        file_path_str = str(file_path)
        file_path_posix = file_path.as_posix()

        for pattern in self._path_patterns:
            if fnmatch.fnmatch(file_path_str, pattern):
                return True
            if fnmatch.fnmatch(file_path_posix, pattern):
                return True

            if "**" in pattern:
                if self._match_glob_recursive(file_path_str, pattern):
                    return True
                if self._match_glob_recursive(file_path_posix, pattern):
                    return True

        return False

    @staticmethod
    def _match_glob_recursive(path: str, pattern: str) -> bool:
        """Match paths with ** patterns."""
        if "**" not in pattern:
            return fnmatch.fnmatch(path, pattern)

        parts = pattern.split("**")
        if len(parts) == 2:
            prefix, suffix = parts
            if prefix and not path.startswith(prefix.rstrip("/").rstrip("\\")):
                return False
            if suffix and not path.endswith(suffix.lstrip("/").lstrip("\\")):
                return False
            return True

        return fnmatch.fnmatch(path, pattern)

    def _is_content_whitelisted(self, finding: Finding) -> bool:
        """Check if finding's content matches any whitelist pattern."""
        match_content = finding.match_content

        for pattern_str in self._content_patterns:
            if pattern_str in match_content:
                return True

        for pattern_re in self._content_regex_patterns:
            if pattern_re.search(match_content):
                return True

        return False

    def _has_inline_nosecret_comment(
        self,
        finding: Finding,
        file_content: Optional[str],
        file_lines: Optional[List[str]],
    ) -> bool:
        """Check if the finding's line has a nosecret comment."""
        line_content: Optional[str] = None

        if file_lines and 0 < finding.line_number <= len(file_lines):
            line_content = file_lines[finding.line_number - 1]
        elif file_content:
            lines = file_content.split("\n")
            if 0 < finding.line_number <= len(lines):
                line_content = lines[finding.line_number - 1]

        if line_content is None:
            return False

        for pattern in NOSECRET_PATTERNS:
            if pattern.search(line_content):
                return True

        if "nosecret" in line_content.lower() or "nosecretscan" in line_content.lower():
            return True

        return False

    def is_path_whitelisted_str(self, file_path: str) -> bool:
        """
        Check if a file path is whitelisted (for early filtering).

        Args:
            file_path: The file path to check.

        Returns:
            True if path is whitelisted.
        """
        finding = Finding(
            file_path=file_path,
            line_number=1,
            rule_id="dummy",
            severity=__import__('secret_scan.models', fromlist=['Severity']).Severity.LOW,
            match_content="",
        )
        return self._is_path_whitelisted(finding)

    def get_path_patterns(self) -> List[str]:
        return list(self._path_patterns)

    def get_content_patterns(self) -> List[str]:
        return list(self._content_patterns)

    def get_rule_whitelist(self) -> List[str]:
        return list(self._rule_whitelist)
