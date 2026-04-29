import tempfile
from pathlib import Path
from typing import List
from unittest.mock import MagicMock, patch

import pytest

from secret_scan.git.diff import (
    ChangedFile,
    DiffHunk,
    GitDiff,
    GitDiffError,
    get_changed_files,
)


SAMPLE_DIFF = """diff --git a/src/config.py b/src/config.py
index abc123..def456 100644
--- a/src/config.py
+++ b/src/config.py
@@ -1,3 +1,4 @@
 import os
+import sys
 
 CONFIG = {
@@ -10,0 +11,2 @@
+AWS_KEY = "AKIAIOSFODNN7EXAMPLE"
+AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
"""

SAMPLE_NEW_FILE_DIFF = """diff --git a/new_file.py b/new_file.py
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/new_file.py
@@ -0,0 +1,2 @@
+API_KEY = "ghp_abcdefghijklmnopqrstuvwxyz0123456789"
+SECRET = "test-secret"
"""

SAMPLE_DELETED_FILE_DIFF = """diff --git a/old_file.py b/old_file.py
deleted file mode 100644
index abc1234..0000000
--- a/old_file.py
+++ /dev/null
@@ -1,2 +0,0 @@
-import os
-print("hello")
"""

SAMPLE_MULTIPLE_FILES_DIFF = """diff --git a/file1.py b/file1.py
index 123456..abcdef 100644
--- a/file1.py
+++ b/file1.py
@@ -1,0 +1,1 @@
+SECRET = "secret1"
diff --git a/file2.py b/file2.py
index abcdef..123456 100644
--- a/file2.py
+++ b/file2.py
@@ -2,0 +3,1 @@
+TOKEN = "token123"
"""


class TestDiffHunk:
    def test_diff_hunk_creation(self):
        hunk = DiffHunk(
            old_start=1,
            old_count=3,
            new_start=1,
            new_count=4,
        )
        assert hunk.old_start == 1
        assert hunk.old_count == 3
        assert hunk.new_start == 1
        assert hunk.new_count == 4
        assert hunk.lines == []

    def test_get_added_lines(self):
        hunk = DiffHunk(
            old_start=10,
            old_count=0,
            new_start=10,
            new_count=2,
            lines=[
                ("+", "line1"),
                ("+", "line2"),
            ],
        )
        added = hunk.get_added_lines()
        assert len(added) == 2
        assert added[0] == (10, "line1")
        assert added[1] == (11, "line2")

    def test_get_added_lines_with_context(self):
        hunk = DiffHunk(
            old_start=1,
            old_count=5,
            new_start=1,
            new_count=5,
            lines=[
                (" ", "context1"),
                ("+", "added1"),
                (" ", "context2"),
                ("+", "added2"),
                ("-", "removed"),
            ],
        )
        added = hunk.get_added_lines()
        assert len(added) == 2
        assert added[0] == (2, "added1")
        assert added[1] == (4, "added2")


class TestChangedFile:
    def test_changed_file_creation(self):
        cf = ChangedFile(
            old_path="old.py",
            new_path="new.py",
        )
        assert cf.old_path == "old.py"
        assert cf.new_path == "new.py"
        assert cf.path == "new.py"
        assert cf.is_new is False
        assert cf.is_deleted is False
        assert cf.is_renamed is False
        assert cf.binary is False

    def test_path_property_priority(self):
        cf1 = ChangedFile(old_path="a.py", new_path="b.py")
        assert cf1.path == "b.py"

        cf2 = ChangedFile(old_path="a.py", new_path=None)
        assert cf2.path == "a.py"

        cf3 = ChangedFile(old_path=None, new_path=None)
        assert cf3.path is None

    def test_get_all_added_lines(self):
        hunk1 = DiffHunk(
            old_start=1, old_count=0, new_start=1, new_count=2,
            lines=[("+", "line1"), ("+", "line2")],
        )
        hunk2 = DiffHunk(
            old_start=10, old_count=0, new_start=10, new_count=1,
            lines=[("+", "line3")],
        )
        cf = ChangedFile(
            old_path="test.py",
            new_path="test.py",
            hunks=[hunk1, hunk2],
        )
        all_added = cf.get_all_added_lines()
        assert len(all_added) == 3
        assert all_added == [(1, "line1"), (2, "line2"), (10, "line3")]


class TestGitDiffParse:
    def test_parse_simple_diff(self):
        git_diff = GitDiff()
        files = git_diff.parse_diff(SAMPLE_DIFF)

        assert len(files) == 1
        cf = files[0]
        assert cf.old_path == "src/config.py"
        assert cf.new_path == "src/config.py"
        assert cf.is_new is False
        assert cf.is_deleted is False
        assert len(cf.hunks) == 2

        hunk1 = cf.hunks[0]
        assert hunk1.old_start == 1
        assert hunk1.old_count == 3
        assert hunk1.new_start == 1
        assert hunk1.new_count == 4

        added_lines = cf.get_all_added_lines()
        assert len(added_lines) == 3
        line_contents = [content for _, content in added_lines]
        assert "import sys" in line_contents
        assert 'AWS_KEY = "AKIAIOSFODNN7EXAMPLE"' in line_contents
        assert 'AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"' in line_contents

    def test_parse_new_file_diff(self):
        git_diff = GitDiff()
        files = git_diff.parse_diff(SAMPLE_NEW_FILE_DIFF)

        assert len(files) == 1
        cf = files[0]
        assert cf.is_new is True
        assert cf.new_path == "new_file.py"
        assert len(cf.hunks) == 1

        added_lines = cf.get_all_added_lines()
        assert len(added_lines) == 2

    def test_parse_deleted_file_diff(self):
        git_diff = GitDiff()
        files = git_diff.parse_diff(SAMPLE_DELETED_FILE_DIFF)

        assert len(files) == 1
        cf = files[0]
        assert cf.is_deleted is True
        assert cf.old_path == "old_file.py"

    def test_parse_multiple_files_diff(self):
        git_diff = GitDiff()
        files = git_diff.parse_diff(SAMPLE_MULTIPLE_FILES_DIFF)

        assert len(files) == 2
        paths = [cf.path for cf in files]
        assert "file1.py" in paths
        assert "file2.py" in paths

    def test_parse_empty_diff(self):
        git_diff = GitDiff()
        files = git_diff.parse_diff("")
        assert len(files) == 0


class TestGitDiffCommands:
    @patch("subprocess.run")
    def test_is_git_repo_true(self, mock_run):
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "true\n"
        mock_run.return_value = mock_result

        git_diff = GitDiff()
        assert git_diff.is_git_repo() is True

    @patch("subprocess.run")
    def test_is_git_repo_false(self, mock_run):
        mock_result = MagicMock()
        mock_result.returncode = 1
        mock_run.return_value = mock_result

        git_diff = GitDiff()
        assert git_diff.is_git_repo() is False

    @patch("subprocess.run")
    def test_run_git_diff_success(self, mock_run):
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = SAMPLE_DIFF
        mock_run.return_value = mock_result

        git_diff = GitDiff()
        output = git_diff._run_git_diff(["--cached"])
        assert output == SAMPLE_DIFF

    @patch("subprocess.run")
    def test_run_git_diff_fatal_error(self, mock_run):
        mock_result = MagicMock()
        mock_result.returncode = 128
        mock_result.stderr = "fatal: not a git repository"
        mock_run.return_value = mock_result

        git_diff = GitDiff()
        with pytest.raises(GitDiffError, match="Git diff failed"):
            git_diff._run_git_diff(["--cached"])

    @patch("subprocess.run")
    def test_get_staged_changes(self, mock_run):
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = SAMPLE_NEW_FILE_DIFF
        mock_run.return_value = mock_result

        git_diff = GitDiff()
        files = git_diff.get_staged_changes()

        mock_run.assert_called_once()
        args = mock_run.call_args[0][0]
        assert "--cached" in args
        assert len(files) == 1
        assert files[0].is_new is True

    @patch("subprocess.run")
    def test_get_unstaged_changes(self, mock_run):
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = SAMPLE_DIFF
        mock_run.return_value = mock_result

        git_diff = GitDiff()
        files = git_diff.get_unstaged_changes()

        mock_run.assert_called_once()
        args = mock_run.call_args[0][0]
        assert "--cached" not in args


class TestGetChangedFiles:
    @patch("secret_scan.git.diff.GitDiff")
    def test_get_changed_files_staged(self, mock_git_diff_class):
        mock_git_diff = MagicMock()
        mock_git_diff.is_git_repo.return_value = True
        mock_git_diff.get_staged_changes.return_value = [
            ChangedFile(old_path="test.py", new_path="test.py")
        ]
        mock_git_diff_class.return_value = mock_git_diff

        files = get_changed_files(staged=True, unstaged=False)

        assert len(files) == 1
        mock_git_diff.get_staged_changes.assert_called_once()

    @patch("secret_scan.git.diff.GitDiff")
    def test_get_changed_files_unstaged(self, mock_git_diff_class):
        mock_git_diff = MagicMock()
        mock_git_diff.is_git_repo.return_value = True
        mock_git_diff.get_unstaged_changes.return_value = [
            ChangedFile(old_path="test.py", new_path="test.py")
        ]
        mock_git_diff_class.return_value = mock_git_diff

        files = get_changed_files(staged=False, unstaged=True)

        assert len(files) == 1
        mock_git_diff.get_unstaged_changes.assert_called_once()

    @patch("secret_scan.git.diff.GitDiff")
    def test_get_changed_files_all(self, mock_git_diff_class):
        mock_git_diff = MagicMock()
        mock_git_diff.is_git_repo.return_value = True
        mock_git_diff.get_all_changes.return_value = [
            ChangedFile(old_path="a.py", new_path="a.py"),
            ChangedFile(old_path="b.py", new_path="b.py"),
        ]
        mock_git_diff_class.return_value = mock_git_diff

        files = get_changed_files(staged=True, unstaged=True)

        assert len(files) == 2
        mock_git_diff.get_all_changes.assert_called_once()

    @patch("secret_scan.git.diff.GitDiff")
    def test_get_changed_files_commit_range(self, mock_git_diff_class):
        mock_git_diff = MagicMock()
        mock_git_diff.is_git_repo.return_value = True
        mock_git_diff.get_commit_range.return_value = [
            ChangedFile(old_path="test.py", new_path="test.py")
        ]
        mock_git_diff_class.return_value = mock_git_diff

        files = get_changed_files(commit_range="HEAD~1..HEAD")

        assert len(files) == 1
        mock_git_diff.get_commit_range.assert_called_once_with("HEAD~1..HEAD")

    @patch("secret_scan.git.diff.GitDiff")
    def test_get_changed_files_not_git_repo(self, mock_git_diff_class):
        mock_git_diff = MagicMock()
        mock_git_diff.is_git_repo.return_value = False
        mock_git_diff_class.return_value = mock_git_diff

        with pytest.raises(GitDiffError, match="Not a git repository"):
            get_changed_files()


class TestGitDiffError:
    def test_git_diff_error_message(self):
        error = GitDiffError("Test error message")
        assert str(error) == "Test error message"

    def test_git_diff_error_inheritance(self):
        assert issubclass(GitDiffError, Exception)
