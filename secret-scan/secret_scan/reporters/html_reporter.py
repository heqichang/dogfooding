from pathlib import Path
from typing import Optional

from jinja2 import Environment, PackageLoader, select_autoescape

from secret_scan.models import ScanResult


class HTMLReporter:
    """
    Reporter that generates HTML output for scan results.
    
    Uses jinja2 PackageLoader to load templates from the secret_scan package,
    ensuring compatibility when the package is installed.
    """

    TEMPLATE_NAME = "report.html.jinja2"

    def __init__(self, template_path: Optional[str] = None):
        """
        Initialize HTML reporter.

        Args:
            template_path: Optional path to custom template directory.
                If provided, uses FileSystemLoader; otherwise uses PackageLoader.
        """
        if template_path:
            from jinja2 import FileSystemLoader
            template_dir = Path(template_path)
            self._env = Environment(
                loader=FileSystemLoader(str(template_dir)),
                autoescape=select_autoescape(["html", "htm"]),
            )
        else:
            self._env = Environment(
                loader=PackageLoader("secret_scan", "templates"),
                autoescape=select_autoescape(["html", "htm"]),
            )

    def generate(self, result: ScanResult, output_path: str) -> None:
        """
        Generate HTML report and write to file.

        Args:
            result: ScanResult to report.
            output_path: Path to output HTML file.
        """
        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)

        template = self._load_template()
        report_data = self._build_report_data(result)
        html_content = template.render(**report_data)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html_content)

    def generate_string(self, result: ScanResult) -> str:
        """
        Generate HTML report as string.

        Args:
            result: ScanResult to report.

        Returns:
            HTML string.
        """
        template = self._load_template()
        report_data = self._build_report_data(result)
        return template.render(**report_data)

    def _load_template(self):
        """Load the HTML template."""
        return self._env.get_template(self.TEMPLATE_NAME)

    def _build_report_data(self, result: ScanResult) -> dict:
        """
        Build the data structure for the template.

        Args:
            result: ScanResult to process.

        Returns:
            Dictionary for template rendering.
        """
        active_findings = [f for f in result.findings if not f.is_whitelisted]
        ignored_findings = [f for f in result.findings if f.is_whitelisted]

        by_severity_str = {}
        for sev, count in result.by_severity.items():
            by_severity_str[sev.value] = count

        return {
            "scan_info": {
                "scan_time": result.scan_time.strftime("%Y-%m-%d %H:%M:%S"),
                "target_path": result.target_path,
                "scan_mode": result.scan_mode,
                "version": "0.1.0",
            },
            "summary": {
                "total_findings": result.total_findings,
                "by_severity": by_severity_str,
            },
            "findings": active_findings,
            "ignored_findings": ignored_findings,
        }
