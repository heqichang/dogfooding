import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Pattern

import yaml

from secret_scan.config import Config, get_default_config
from secret_scan.detectors.base import BaseDetector
from secret_scan.models import Finding, Rule, Severity


class RuleDetector(BaseDetector):
    """
    Detector that uses regular expression rules to find secrets.
    """

    def __init__(self, config: Optional[Config] = None, custom_rules: Optional[List[Dict[str, Any]]] = None):
        self._config = config or get_default_config()
        self._rules: List[Rule] = []
        self._disabled_builtins: set = set(self._config.rules.disabled_builtins)
        self._load_builtin_rules()
        self._load_custom_rules(custom_rules or self._config.rules.custom_rules)

    def _load_builtin_rules(self) -> None:
        """Load built-in rules from the YAML file."""
        builtin_path = Path(__file__).parent.parent / "builtin_rules.yml"
        if not builtin_path.exists():
            return

        with open(builtin_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}

        rules_data = data.get("rules", [])
        for rule_data in rules_data:
            rule_id = rule_data.get("id", "")
            if rule_id in self._disabled_builtins:
                continue

            try:
                rule = Rule(
                    id=rule_id,
                    name=rule_data.get("name", "Unknown Rule"),
                    pattern=rule_data.get("pattern", ""),
                    severity=self._parse_severity(rule_data.get("severity", "medium")),
                    description=rule_data.get("description", ""),
                    tags=rule_data.get("tags", []),
                )
                self._rules.append(rule)
            except (KeyError, ValueError):
                continue

    def _load_custom_rules(self, custom_rules: List[Dict[str, Any]]) -> None:
        """Load custom rules from configuration."""
        for rule_data in custom_rules:
            try:
                rule = Rule(
                    id=rule_data.get("id", f"custom-{len(self._rules)}"),
                    name=rule_data.get("name", "Custom Rule"),
                    pattern=rule_data.get("pattern", ""),
                    severity=self._parse_severity(rule_data.get("severity", "medium")),
                    description=rule_data.get("description", ""),
                    tags=rule_data.get("tags", ["custom"]),
                )
                self._rules.append(rule)
            except (KeyError, ValueError):
                continue

    @staticmethod
    def _parse_severity(value: str) -> Severity:
        """Parse severity string to Severity enum."""
        mapping = {
            "low": Severity.LOW,
            "medium": Severity.MEDIUM,
            "high": Severity.HIGH,
            "critical": Severity.CRITICAL,
        }
        return mapping.get(value.lower(), Severity.MEDIUM)

    def detect(self, content: str, file_path: Optional[str] = None) -> List[Finding]:
        """
        Scan content using all enabled rules.

        Args:
            content: The content to scan.
            file_path: Optional file path for context.

        Returns:
            List of detected Findings.
        """
        findings: List[Finding] = []
        lines = content.split("\n")

        for rule in self._rules:
            try:
                pattern = re.compile(rule.pattern, re.MULTILINE)
            except re.error:
                continue

            for match in pattern.finditer(content):
                line_number = self._get_line_number(content, match.start())
                column = match.start() - content.rfind("\n", 0, match.start())
                snippet = self._get_snippet(lines, line_number - 1) if line_number > 0 else None

                finding = Finding(
                    file_path=file_path or "",
                    line_number=line_number,
                    column=column,
                    rule_id=rule.id,
                    severity=rule.severity,
                    match_content=match.group(0),
                    snippet=snippet,
                    is_whitelisted=False,
                )
                findings.append(finding)

        return findings

    @staticmethod
    def _get_line_number(content: str, position: int) -> int:
        """Calculate line number from a position in content."""
        if position < 0 or position >= len(content):
            return 1
        return content[:position].count("\n") + 1

    @staticmethod
    def _get_snippet(lines: List[str], index: int, context: int = 2) -> str:
        """Get a snippet of lines around the specified index."""
        start = max(0, index - context)
        end = min(len(lines), index + context + 1)
        return "\n".join(lines[start:end])

    def get_rules(self) -> List[Rule]:
        """Return all loaded rules."""
        return list(self._rules)

    def get_id(self) -> str:
        return "rule-detector"

    def get_name(self) -> str:
        return "Rule-based Secret Detector"
