import json
from pathlib import Path
from typing import Any, Dict

from secret_scan.models import ScanResult


class JSONReporter:
    """
    Reporter that generates JSON output for scan results.
    """

    @staticmethod
    def generate(result: ScanResult, output_path: str) -> None:
        """
        Generate JSON report and write to file.

        Args:
            result: ScanResult to report.
            output_path: Path to output JSON file.
        """
        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)

        report_data = JSONReporter._build_report(result)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)

    @staticmethod
    def generate_string(result: ScanResult) -> str:
        """
        Generate JSON report as string.

        Args:
            result: ScanResult to report.

        Returns:
            JSON string.
        """
        report_data = JSONReporter._build_report(result)
        return json.dumps(report_data, indent=2, ensure_ascii=False)

    @staticmethod
    def _build_report(result: ScanResult) -> Dict[str, Any]:
        """
        Build the report data structure.

        Args:
            result: ScanResult to process.

        Returns:
            Dictionary representing the report.
        """
        active_findings = [f for f in result.findings if not f.is_whitelisted]
        ignored_findings = [f for f in result.findings if f.is_whitelisted]

        def finding_to_dict(finding):
            d = finding.to_dict()
            match_content = d.get("match_content", "")
            if match_content and len(match_content) > 20:
                d["match_summary"] = match_content[:4] + "..." + match_content[-4:]
            else:
                d["match_summary"] = match_content
            return d

        by_severity_str = {
            k.value: v for k, v in result.by_severity.items()
        }

        return {
            "scan_info": {
                "scan_time": result.scan_time.isoformat(),
                "target_path": result.target_path,
                "scan_mode": result.scan_mode,
                "generated_by": "secret-scan",
                "version": "0.1.0",
            },
            "summary": {
                "total_findings": result.total_findings,
                "by_severity": by_severity_str,
                "ignored_count": len(ignored_findings),
            },
            "findings": [finding_to_dict(f) for f in active_findings],
            "ignored_findings": [finding_to_dict(f) for f in ignored_findings],
        }
