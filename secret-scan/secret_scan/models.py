from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class Severity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(frozen=True)
class Rule:
    id: str
    name: str
    pattern: str
    severity: Severity
    description: str
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "pattern": self.pattern,
            "severity": self.severity.value,
            "description": self.description,
            "tags": self.tags.copy() if callable(self.tags) else self.tags,
        }


@dataclass(frozen=True)
class Finding:
    file_path: str
    line_number: int
    rule_id: str
    severity: Severity
    match_content: str
    column: Optional[int] = None
    snippet: Optional[str] = None
    is_whitelisted: bool = False

    def to_dict(self) -> dict:
        return {
            "file_path": self.file_path,
            "line_number": self.line_number,
            "column": self.column,
            "rule_id": self.rule_id,
            "severity": self.severity.value,
            "snippet": self.snippet,
            "match_content": self.match_content,
            "is_whitelisted": self.is_whitelisted,
        }


@dataclass(frozen=True)
class ScanResult:
    scan_time: datetime
    target_path: str
    scan_mode: str
    total_findings: int
    findings: List[Finding] = field(default_factory=list)
    by_severity: Dict[Severity, int] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "scan_time": self.scan_time.isoformat(),
            "target_path": self.target_path,
            "scan_mode": self.scan_mode,
            "total_findings": self.total_findings,
            "findings": [f.to_dict() for f in self.findings],
            "by_severity": {k.value: v for k, v in self.by_severity.items()},
        }
