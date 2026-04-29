import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Tuple


@dataclass
class DiffHunk:
    """Represents a single hunk in a git diff."""
    old_start: int
    old_count: int
    new_start: int
    new_count: int
    lines: List[Tuple[str, str]] = field(default_factory=list)

    def get_added_lines(self) -> List[Tuple[int, str]]:
        """Get all added lines with their new line numbers."""
        result: List[Tuple[int, str]] = []
        current_new_line = self.new_start

        for line_type, content in self.lines:
            if line_type == "+":
                result.append((current_new_line, content))
                current_new_line += 1
            elif line_type == " ":
                current_new_line += 1
            elif line_type == "-":
                pass

        return result

    def get_modified_lines(self) -> List[Tuple[int, str]]:
        """Get all added/modified lines (context + added)."""
        return self.get_added_lines()


@dataclass
class ChangedFile:
    """Represents a changed file in a git diff."""
    old_path: Optional[str]
    new_path: Optional[str]
    is_new: bool = False
    is_deleted: bool = False
    is_renamed: bool = False
    hunks: List[DiffHunk] = field(default_factory=list)
    binary: bool = False

    @property
    def path(self) -> Optional[str]:
        """Get the effective path (new if available, else old)."""
        return self.new_path or self.old_path

    def get_all_added_lines(self) -> List[Tuple[int, str]]:
        """Get all added lines across all hunks."""
        result: List[Tuple[int, str]] = []
        for hunk in self.hunks:
            result.extend(hunk.get_added_lines())
        return result


class GitDiffError(Exception):
    """Exception raised for git diff errors."""
    pass


class GitDiff:
    """
    Parser for git diff output.
    
    Uses subprocess to call git diff and parses the unified diff format.
    """

    DIFF_HEADER_PATTERN = re.compile(r"^diff --git a/(.*) b/(.*)$")
    NEW_FILE_PATTERN = re.compile(r"^new file mode \d+$")
    DELETED_FILE_PATTERN = re.compile(r"^deleted file mode \d+$")
    RENAME_FROM_PATTERN = re.compile(r"^rename from (.*)$")
    RENAME_TO_PATTERN = re.compile(r"^rename to (.*)$")
    BINARY_PATTERN = re.compile(r"^Binary files (.*) and (.*) differ$")
    HUNK_HEADER_PATTERN = re.compile(r"^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@")
    INDEX_PATTERN = re.compile(r"^index [0-9a-f]+(\.\.[0-9a-f]+)?( \d+)?$")
    FILE_MODE_PATTERN = re.compile(r"^(?:old|new) mode \d+$")

    def __init__(self, repo_path: Optional[Path] = None):
        self._repo_path = repo_path or Path.cwd()

    def _run_git_diff(self, args: List[str]) -> str:
        """Run git diff command and return output."""
        cmd = ["git", "diff"] + args
        try:
            result = subprocess.run(
                cmd,
                cwd=str(self._repo_path),
                capture_output=True,
                text=True,
                check=False,
            )
            if result.returncode != 0 and "fatal:" in result.stderr:
                raise GitDiffError(f"Git diff failed: {result.stderr.strip()}")
            return result.stdout
        except FileNotFoundError:
            raise GitDiffError("Git command not found. Please install Git.")

    def is_git_repo(self) -> bool:
        """Check if the current directory is a git repository."""
        try:
            result = subprocess.run(
                ["git", "rev-parse", "--is-inside-work-tree"],
                cwd=str(self._repo_path),
                capture_output=True,
                text=True,
                check=False,
            )
            return result.returncode == 0 and result.stdout.strip() == "true"
        except FileNotFoundError:
            return False

    def get_staged_changes(self) -> List[ChangedFile]:
        """Get staged changes (git diff --cached)."""
        output = self._run_git_diff(["--cached", "--no-color", "-U0"])
        return self.parse_diff(output)

    def get_unstaged_changes(self) -> List[ChangedFile]:
        """Get unstaged changes (git diff)."""
        output = self._run_git_diff(["--no-color", "-U0"])
        return self.parse_diff(output)

    def get_all_changes(self) -> List[ChangedFile]:
        """Get both staged and unstaged changes."""
        staged = self.get_staged_changes()
        unstaged = self.get_unstaged_changes()
        return staged + unstaged

    def get_commit_range(self, commit_range: str) -> List[ChangedFile]:
        """Get changes between two commits."""
        output = self._run_git_diff([commit_range, "--no-color", "-U0"])
        return self.parse_diff(output)

    def get_diff_between(self, old_commit: str, new_commit: str) -> List[ChangedFile]:
        """Get changes between two specific commits."""
        output = self._run_git_diff([f"{old_commit}..{new_commit}", "--no-color", "-U0"])
        return self.parse_diff(output)

    def parse_diff(self, diff_output: str) -> List[ChangedFile]:
        """
        Parse unified diff output into a list of ChangedFile objects.

        Args:
            diff_output: Raw output from git diff.

        Returns:
            List of ChangedFile objects.
        """
        files: List[ChangedFile] = []
        lines = diff_output.splitlines()

        current_file: Optional[ChangedFile] = None
        current_hunk: Optional[DiffHunk] = None

        i = 0
        while i < len(lines):
            line = lines[i]

            if line.startswith("diff --git"):
                if current_file:
                    if current_hunk:
                        current_file.hunks.append(current_hunk)
                    files.append(current_file)

                match = self.DIFF_HEADER_PATTERN.match(line)
                if match:
                    old_path = match.group(1)
                    new_path = match.group(2)
                    current_file = ChangedFile(
                        old_path=old_path,
                        new_path=new_path,
                    )
                    current_hunk = None

            elif line.startswith("new file mode") and current_file:
                current_file.is_new = True

            elif line.startswith("deleted file mode") and current_file:
                current_file.is_deleted = True

            elif line.startswith("rename from") and current_file:
                match = self.RENAME_FROM_PATTERN.match(line)
                if match:
                    current_file.is_renamed = True

            elif line.startswith("rename to") and current_file:
                match = self.RENAME_TO_PATTERN.match(line)
                if match:
                    current_file.is_renamed = True

            elif line.startswith("Binary files") and current_file:
                current_file.binary = True

            elif line.startswith("@@") and current_file:
                if current_hunk:
                    current_file.hunks.append(current_hunk)

                match = self.HUNK_HEADER_PATTERN.match(line)
                if match:
                    old_start = int(match.group(1))
                    old_count = int(match.group(2)) if match.group(2) else 1
                    new_start = int(match.group(3))
                    new_count = int(match.group(4)) if match.group(4) else 1

                    current_hunk = DiffHunk(
                        old_start=old_start,
                        old_count=old_count,
                        new_start=new_start,
                        new_count=new_count,
                    )

            elif current_hunk and current_file:
                if line.startswith("+"):
                    current_hunk.lines.append(("+", line[1:]))
                elif line.startswith("-"):
                    current_hunk.lines.append(("-", line[1:]))
                elif line.startswith(" "):
                    current_hunk.lines.append((" ", line[1:]))

            i += 1

        if current_file:
            if current_hunk:
                current_file.hunks.append(current_hunk)
            files.append(current_file)

        return files


def get_changed_files(
    repo_path: Optional[Path] = None,
    staged: bool = False,
    unstaged: bool = True,
    commit_range: Optional[str] = None,
) -> List[ChangedFile]:
    """
    Convenience function to get changed files.

    Args:
        repo_path: Path to the git repository.
        staged: Whether to include staged changes.
        unstaged: Whether to include unstaged changes.
        commit_range: Optional commit range (e.g., "HEAD~1..HEAD").

    Returns:
        List of ChangedFile objects.
    """
    git_diff = GitDiff(repo_path)

    if not git_diff.is_git_repo():
        raise GitDiffError("Not a git repository")

    if commit_range:
        return git_diff.get_commit_range(commit_range)

    if staged and unstaged:
        return git_diff.get_all_changes()
    elif staged:
        return git_diff.get_staged_changes()
    elif unstaged:
        return git_diff.get_unstaged_changes()
    else:
        return []
