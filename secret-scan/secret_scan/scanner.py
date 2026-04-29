import os
from dataclasses import replace
from datetime import datetime
from fnmatch import fnmatch
from pathlib import Path
from typing import List, Optional, Set

from secret_scan.config import Config, get_default_config
from secret_scan.detectors import EntropyDetector, RuleDetector
from secret_scan.git import ChangedFile, GitDiff, GitDiffError, get_changed_files
from secret_scan.models import Finding, ScanResult, Severity
from secret_scan.whitelist import Whitelist


DEFAULT_SKIP_DIRS = {
    ".git",
    "__pycache__",
    "node_modules",
    ".venv",
    "venv",
    "dist",
    "build",
    ".pytest_cache",
    ".mypy_cache",
    ".tox",
    ".eggs",
    "*.egg-info",
}

DEFAULT_SKIP_EXTENSIONS = {
    ".pyc",
    ".pyo",
    ".pyd",
    ".class",
    ".jar",
    ".war",
    ".ear",
    ".o",
    ".so",
    ".dll",
    ".exe",
    ".bin",
    ".obj",
    ".lib",
    ".a",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".ico",
    ".svg",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".zip",
    ".tar",
    ".gz",
    ".bz2",
    ".xz",
    ".rar",
    ".7z",
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".wav",
    ".ogg",
    ".mkv",
}


class Scanner:
    """
    Main scanning engine that orchestrates detectors, whitelist, and file traversal.
    """

    def __init__(self, config: Optional[Config] = None):
        self._config = config or get_default_config()
        self._rule_detector: Optional[RuleDetector] = None
        self._entropy_detector: Optional[EntropyDetector] = None
        self._whitelist: Optional[Whitelist] = None
        self._skip_dirs: Set[str] = set(self._config.scan.skip_dirs) | DEFAULT_SKIP_DIRS
        self._skip_extensions: Set[str] = set(self._config.scan.skip_extensions) | DEFAULT_SKIP_EXTENSIONS
        self._max_file_size_bytes = self._config.scan.max_file_size_mb * 1024 * 1024

    def _get_rule_detector(self) -> RuleDetector:
        if self._rule_detector is None:
            self._rule_detector = RuleDetector(config=self._config)
        return self._rule_detector

    def _get_entropy_detector(self) -> EntropyDetector:
        if self._entropy_detector is None:
            self._entropy_detector = EntropyDetector(config=self._config)
        return self._entropy_detector

    def _get_whitelist(self) -> Whitelist:
        if self._whitelist is None:
            self._whitelist = Whitelist(config=self._config)
        return self._whitelist

    def _should_skip_file(self, file_path: Path) -> bool:
        """Check if a file should be skipped."""
        for part in file_path.parts:
            for skip_dir in self._skip_dirs:
                if "*" in skip_dir:
                    from fnmatch import fnmatch
                    if fnmatch(part, skip_dir):
                        return True
                elif part == skip_dir:
                    return True

        if file_path.suffix.lower() in self._skip_extensions:
            return True

        try:
            if file_path.stat().st_size > self._max_file_size_bytes:
                return True
        except (OSError, PermissionError):
            return True

        whitelist = self._get_whitelist()
        if whitelist.is_path_whitelisted_str(str(file_path)):
            return True

        return False

    def _scan_content(self, content: str, file_path: str) -> List[Finding]:
        """Scan file content for secrets."""
        findings: List[Finding] = []

        if self._config.rules.enabled:
            rule_detector = self._get_rule_detector()
            rule_findings = rule_detector.detect(content, file_path)
            findings.extend(rule_findings)

        if self._config.entropy.enabled:
            entropy_detector = self._get_entropy_detector()
            entropy_findings = entropy_detector.detect(content, file_path)
            findings.extend(entropy_findings)

        return findings

    def _apply_whitelist(self, findings: List[Finding], file_content: str) -> List[Finding]:
        """Apply whitelist to findings."""
        whitelist = self._get_whitelist()
        file_lines = file_content.split("\n") if file_content else []

        filtered: List[Finding] = []
        for finding in findings:
            if whitelist.is_whitelisted(finding, file_content, file_lines):
                filtered_finding = replace(finding, is_whitelisted=True)
                filtered.append(filtered_finding)
            else:
                filtered.append(finding)

        return filtered

    def _scan_file(self, file_path: Path) -> List[Finding]:
        """Scan a single file."""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except (OSError, PermissionError, UnicodeDecodeError):
            return []

        findings = self._scan_content(content, str(file_path))
        return self._apply_whitelist(findings, content)

    def _scan_files(self, target_path: Path) -> List[Finding]:
        """Scan all files in a directory recursively."""
        findings: List[Finding] = []

        if target_path.is_file():
            if not self._should_skip_file(target_path):
                findings.extend(self._scan_file(target_path))
            return findings

        for root, dirs, files in os.walk(target_path):
            dirs_to_remove = []
            for d in dirs:
                for skip_dir in self._skip_dirs:
                    if "*" in skip_dir:
                        if fnmatch(d, skip_dir):
                            dirs_to_remove.append(d)
                            break
                    elif d == skip_dir:
                        dirs_to_remove.append(d)
                        break

            for d in dirs_to_remove:
                if d in dirs:
                    dirs.remove(d)

            root_path = Path(root)
            for filename in files:
                file_path = root_path / filename
                if not self._should_skip_file(file_path):
                    findings.extend(self._scan_file(file_path))

        return findings

    def _scan_diff_files(self, changed_files: List[ChangedFile]) -> List[Finding]:
        """Scan only changed lines from diff."""
        findings: List[Finding] = []
        whitelist = self._get_whitelist()

        for changed_file in changed_files:
            if changed_file.is_deleted:
                continue
            if changed_file.binary:
                continue

            file_path = changed_file.path
            if not file_path:
                continue

            if whitelist.is_path_whitelisted_str(file_path):
                continue

            all_added_lines = changed_file.get_all_added_lines()
            if not all_added_lines:
                continue

            line_contents = [content for _, content in all_added_lines]
            content_with_line_numbers = "\n".join(line_contents)

            raw_findings = self._scan_content(content_with_line_numbers, file_path)

            for finding in raw_findings:
                if finding.line_number > 0 and finding.line_number <= len(all_added_lines):
                    actual_line_number, line_content = all_added_lines[finding.line_number - 1]
                    from dataclasses import replace
                    updated_finding = replace(finding, line_number=actual_line_number)
                    if whitelist.is_whitelisted(updated_finding, line_content, [line_content]):
                        updated_finding = replace(updated_finding, is_whitelisted=True)
                    findings.append(updated_finding)
                else:
                    if whitelist.is_whitelisted(finding):
                        from dataclasses import replace
                        finding = replace(finding, is_whitelisted=True)
                    findings.append(finding)

        return findings

    def _build_scan_result(self, findings: List[Finding], target_path: str, scan_mode: str) -> ScanResult:
        """Build a ScanResult from findings."""
        active_findings = [f for f in findings if not f.is_whitelisted]
        by_severity: dict = {}

        for finding in active_findings:
            sev = finding.severity
            by_severity[sev] = by_severity.get(sev, 0) + 1

        return ScanResult(
            scan_time=datetime.now(),
            target_path=target_path,
            scan_mode=scan_mode,
            total_findings=len(active_findings),
            findings=findings,
            by_severity=by_severity,
        )

    def scan_full(self, target_path: Optional[Path] = None) -> ScanResult:
        """
        Perform a full scan of all files in the target directory.

        Args:
            target_path: Directory or file to scan. Defaults to current directory.

        Returns:
            ScanResult containing all findings.
        """
        target = target_path or Path.cwd()
        findings = self._scan_files(target)
        return self._build_scan_result(findings, str(target), "full")

    def scan_staged(self, repo_path: Optional[Path] = None) -> ScanResult:
        """
        Scan only staged changes in a git repository.

        Args:
            repo_path: Path to git repository. Defaults to current directory.

        Returns:
            ScanResult containing findings from staged changes.
        """
        try:
            changed_files = get_changed_files(repo_path, staged=True, unstaged=False)
        except GitDiffError:
            return self.scan_full(repo_path)

        findings = self._scan_diff_files(changed_files)
        repo = repo_path or Path.cwd()
        return self._build_scan_result(findings, str(repo), "staged")

    def scan_unstaged(self, repo_path: Optional[Path] = None) -> ScanResult:
        """
        Scan only unstaged changes in a git repository.

        Args:
            repo_path: Path to git repository. Defaults to current directory.

        Returns:
            ScanResult containing findings from unstaged changes.
        """
        try:
            changed_files = get_changed_files(repo_path, staged=False, unstaged=True)
        except GitDiffError:
            return self.scan_full(repo_path)

        findings = self._scan_diff_files(changed_files)
        repo = repo_path or Path.cwd()
        return self._build_scan_result(findings, str(repo), "unstaged")

    def scan_all_changes(self, repo_path: Optional[Path] = None) -> ScanResult:
        """
        Scan both staged and unstaged changes.

        Args:
            repo_path: Path to git repository. Defaults to current directory.

        Returns:
            ScanResult containing all findings from changes.
        """
        try:
            changed_files = get_changed_files(repo_path, staged=True, unstaged=True)
        except GitDiffError:
            return self.scan_full(repo_path)

        findings = self._scan_diff_files(changed_files)
        repo = repo_path or Path.cwd()
        return self._build_scan_result(findings, str(repo), "all-changes")

    def scan_diff(self, commit_range: str, repo_path: Optional[Path] = None) -> ScanResult:
        """
        Scan changes between commits.

        Args:
            commit_range: Commit range (e.g., "HEAD~1..HEAD").
            repo_path: Path to git repository. Defaults to current directory.

        Returns:
            ScanResult containing findings from the diff.
        """
        try:
            changed_files = get_changed_files(repo_path, commit_range=commit_range)
        except GitDiffError:
            return self.scan_full(repo_path)

        findings = self._scan_diff_files(changed_files)
        repo = repo_path or Path.cwd()
        return self._build_scan_result(findings, str(repo), f"diff:{commit_range}")
