import shutil
import sys
from pathlib import Path
from typing import Optional

import click

from secret_scan.config import load_config
from secret_scan.models import ScanResult
from secret_scan.scanner import Scanner

__version__ = "0.1.0"


def get_version() -> str:
    return __version__


def copy_example_config(dest_path: Path) -> None:
    """Copy the example config file to the target path."""
    example_path = Path(__file__).parent.parent / ".secret-scan.example.yml"
    if example_path.exists():
        shutil.copy2(example_path, dest_path)
    else:
        example_content = """# Secret Scan 配置示例文件
# 复制此文件为 .secret-scan.yml 并根据需要修改

# 熵值检测配置
entropy:
  enabled: true
  base64_threshold: 4.0
  hex_threshold: 3.5
  min_length_base64: 20
  min_length_hex: 40

# 规则检测配置
rules:
  enabled: true
  custom_rules: []
  disabled_builtins: []

# 白名单配置
whitelist:
  paths: []
  contents: []
  rules: []

# 输出配置
output:
  verbose: false
  show_ignored: false

# 扫描配置
scan:
  skip_gitignore: true
  skip_dirs:
    - ".git"
    - "__pycache__"
    - "node_modules"
  skip_extensions:
    - ".pyc"
    - ".class"
    - ".png"
    - ".jpg"
  max_file_size_mb: 1
"""
        dest_path.write_text(example_content, encoding="utf-8")


def generate_console_report(result: ScanResult, verbose: bool = False, show_ignored: bool = False) -> None:
    """Generate console output for scan results."""
    from secret_scan.models import Severity

    active_findings = [f for f in result.findings if not f.is_whitelisted]
    ignored_findings = [f for f in result.findings if f.is_whitelisted]

    click.echo("=" * 60)
    click.echo(f"🔍 Secret Scan Report - {result.scan_time.strftime('%Y-%m-%d %H:%M:%S')}")
    click.echo("=" * 60)
    click.echo(f"📁 Target: {result.target_path}")
    click.echo(f"🔄 Mode: {result.scan_mode}")
    click.echo()

    total = result.total_findings
    if total == 0:
        click.echo("✅ No secrets found!")
    else:
        click.echo(f"⚠️ Found {total} potential issue(s):")
        click.echo()

        sev_counts = result.by_severity
        if Severity.CRITICAL in sev_counts:
            click.echo(f"  🔴 CRITICAL: {sev_counts[Severity.CRITICAL]}")
        if Severity.HIGH in sev_counts:
            click.echo(f"  🟠 HIGH: {sev_counts[Severity.HIGH]}")
        if Severity.MEDIUM in sev_counts:
            click.echo(f"  🟡 MEDIUM: {sev_counts[Severity.MEDIUM]}")
        if Severity.LOW in sev_counts:
            click.echo(f"  🟢 LOW: {sev_counts[Severity.LOW]}")

        click.echo()
        click.echo("Detailed findings:")
        click.echo("-" * 60)

        for finding in sorted(active_findings, key=lambda f: (
            {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(f.severity.value, 4),
            f.file_path,
            f.line_number,
        )):
            sev_icon = {
                "critical": "🔴",
                "high": "🟠",
                "medium": "🟡",
                "low": "🟢",
            }.get(finding.severity.value, "⚪")

            click.echo(f"\n{sev_icon} [{finding.severity.value.upper()}] {finding.rule_id}")
            click.echo(f"   📄 {finding.file_path}:{finding.line_number}")
            if verbose:
                match_preview = finding.match_content[:50]
                if len(finding.match_content) > 50:
                    match_preview += "..."
                click.echo(f"   🔑 Match: {match_preview}")
                if finding.snippet:
                    snippet_lines = finding.snippet.strip().split("\n")[:3]
                    click.echo(f"   📝 Context:")
                    for line in snippet_lines:
                        click.echo(f"      {line}")

    if show_ignored and ignored_findings:
        click.echo()
        click.echo("-" * 60)
        click.echo(f"ℹ️ Ignored by whitelist: {len(ignored_findings)} finding(s)")
        if verbose:
            for finding in ignored_findings:
                click.echo(f"   - {finding.file_path}:{finding.line_number} ({finding.rule_id})")

    click.echo()
    click.echo("=" * 60)


def write_json_report(result: ScanResult, output_path: str) -> None:
    """Write JSON report to file."""
    import json

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result.to_dict(), f, indent=2, ensure_ascii=False)

    click.echo(f"📄 JSON report written to: {output_path}")


def write_html_report(result: ScanResult, output_path: str) -> None:
    """Write HTML report to file."""
    try:
        from secret_scan.reporters.html_reporter import HTMLReporter
        reporter = HTMLReporter()
        reporter.generate(result, output_path)
        click.echo(f"📄 HTML report written to: {output_path}")
    except ImportError:
        click.echo("❌ HTML reporter not available. Skipping HTML report.")


@click.group()
@click.version_option(version=get_version(), prog_name="secret-scan")
def cli():
    """Secret scan tool - 扫描代码库中的敏感信息"""
    pass


@cli.command("scan")
@click.argument("path", type=click.Path(exists=True), required=False)
@click.option("--full", "-f", is_flag=True, help="全量扫描所有文件")
@click.option("--staged", "-s", is_flag=True, help="仅扫描 staged 变更")
@click.option("--unstaged", "-u", is_flag=True, help="仅扫描 unstaged 变更")
@click.option("--diff", "-d", "diff_range", help="扫描指定的 commit 范围 (如 HEAD~1..HEAD)")
@click.option("--config", "-c", "config_path", type=click.Path(exists=True, dir_okay=False), help="配置文件路径")
@click.option("--json", "-j", "json_output", type=click.Path(dir_okay=False), help="JSON 报告输出路径")
@click.option("--html", "html_output", type=click.Path(dir_okay=False), help="HTML 报告输出路径")
@click.option("--no-fail", is_flag=True, help="发现问题时不返回非零退出码")
@click.option("--verbose", "-v", is_flag=True, help="详细输出")
@click.option("--show-ignored", is_flag=True, help="显示被白名单忽略的项")
def scan(
    path: Optional[str],
    full: bool,
    staged: bool,
    unstaged: bool,
    diff_range: Optional[str],
    config_path: Optional[str],
    json_output: Optional[str],
    html_output: Optional[str],
    no_fail: bool,
    verbose: bool,
    show_ignored: bool,
):
    """扫描代码库中的敏感信息

    默认行为：
    - 如果是 git 仓库且有变更：扫描所有变更（staged + unstaged）
    - 否则：全量扫描

    扫描模式优先级：--diff > --staged/--unstaged > --full > 默认
    """
    try:
        config = load_config(config_path)
    except Exception as e:
        click.echo(f"❌ Configuration error: {e}", err=True)
        sys.exit(2)

    scanner = Scanner(config=config)
    target_path = Path(path) if path else Path.cwd()

    scan_mode = "default"
    result: Optional[ScanResult] = None

    if diff_range:
        result = scanner.scan_diff(diff_range, target_path)
        scan_mode = f"diff:{diff_range}"
    elif staged and unstaged:
        result = scanner.scan_all_changes(target_path)
        scan_mode = "all-changes"
    elif staged:
        result = scanner.scan_staged(target_path)
        scan_mode = "staged"
    elif unstaged:
        result = scanner.scan_unstaged(target_path)
        scan_mode = "unstaged"
    elif full:
        result = scanner.scan_full(target_path)
        scan_mode = "full"
    else:
        from secret_scan.git import GitDiff
        git_diff = GitDiff(target_path)
        if git_diff.is_git_repo():
            result = scanner.scan_all_changes(target_path)
            scan_mode = "all-changes"
        else:
            result = scanner.scan_full(target_path)
            scan_mode = "full"

    effective_verbose = verbose or config.output.verbose
    effective_show_ignored = show_ignored or config.output.show_ignored

    generate_console_report(result, verbose=effective_verbose, show_ignored=effective_show_ignored)

    if json_output:
        write_json_report(result, json_output)

    if html_output:
        write_html_report(result, html_output)

    if result.total_findings > 0 and not no_fail:
        sys.exit(1)

    sys.exit(0)


@cli.command("init")
@click.option("--force", "-f", is_flag=True, help="强制覆盖现有配置文件")
def init(force: bool):
    """在当前目录生成示例配置文件"""
    target_path = Path.cwd() / ".secret-scan.yml"

    if target_path.exists() and not force:
        click.echo(f"❌ Configuration file already exists: {target_path}")
        click.echo("   Use --force to overwrite.")
        sys.exit(1)

    try:
        copy_example_config(target_path)
        click.echo(f"✅ Created configuration file: {target_path}")
        click.echo("   Edit this file to customize your secret scanning rules.")
    except Exception as e:
        click.echo(f"❌ Failed to create config: {e}", err=True)
        sys.exit(2)


@cli.command("version")
def version():
    """显示版本号"""
    click.echo(get_version())


if __name__ == "__main__":
    cli()
