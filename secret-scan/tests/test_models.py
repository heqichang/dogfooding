import json
from datetime import datetime

import pytest

from secret_scan.models import Finding, Rule, ScanResult, Severity


class TestSeverity:
    def test_severity_has_four_values(self):
        assert len(Severity) == 4
    
    def test_severity_values(self):
        assert Severity.LOW.value == "low"
        assert Severity.MEDIUM.value == "medium"
        assert Severity.HIGH.value == "high"
        assert Severity.CRITICAL.value == "critical"
    
    def test_severity_members(self):
        assert Severity.LOW in Severity
        assert Severity.MEDIUM in Severity
        assert Severity.HIGH in Severity
        assert Severity.CRITICAL in Severity


class TestRule:
    def test_rule_instantiation(self):
        rule = Rule(
            id="api-key-001",
            name="API Key Detection",
            pattern=r"api_key\s*=\s*['\"][A-Za-z0-9]{32,}['\"]",
            severity=Severity.HIGH,
            description="Detects hardcoded API keys",
            tags=["api", "security", "key"]
        )
        
        assert rule.id == "api-key-001"
        assert rule.name == "API Key Detection"
        assert rule.pattern == r"api_key\s*=\s*['\"][A-Za-z0-9]{32,}['\"]"
        assert rule.severity == Severity.HIGH
        assert rule.description == "Detects hardcoded API keys"
        assert rule.tags == ["api", "security", "key"]
    
    def test_rule_instantiation_with_default_tags(self):
        rule = Rule(
            id="test-001",
            name="Test Rule",
            pattern=r"test",
            severity=Severity.LOW,
            description="Test description"
        )
        
        assert rule.tags == []
    
    def test_rule_to_dict(self):
        rule = Rule(
            id="api-key-001",
            name="API Key Detection",
            pattern=r"api_key\s*=\s*['\"][A-Za-z0-9]{32,}['\"]",
            severity=Severity.HIGH,
            description="Detects hardcoded API keys",
            tags=["api", "security"]
        )
        
        result = rule.to_dict()
        
        assert isinstance(result, dict)
        assert result["id"] == "api-key-001"
        assert result["name"] == "API Key Detection"
        assert result["pattern"] == r"api_key\s*=\s*['\"][A-Za-z0-9]{32,}['\"]"
        assert result["severity"] == "high"
        assert result["description"] == "Detects hardcoded API keys"
        assert result["tags"] == ["api", "security"]
    
    def test_rule_to_dict_is_json_serializable(self):
        rule = Rule(
            id="test-001",
            name="Test Rule",
            pattern=r"test",
            severity=Severity.MEDIUM,
            description="Test"
        )
        
        result = rule.to_dict()
        
        assert json.dumps(result) is not None
    
    def test_rule_is_frozen(self):
        rule = Rule(
            id="test-001",
            name="Test Rule",
            pattern=r"test",
            severity=Severity.LOW,
            description="Test"
        )
        
        with pytest.raises(FrozenInstanceError):
            rule.id = "new-id"


class TestFinding:
    def test_finding_instantiation(self):
        finding = Finding(
            file_path="src/config.py",
            line_number=42,
            rule_id="api-key-001",
            severity=Severity.HIGH,
            match_content="api_key = 'sk_live_1234567890abcdefghijklmnopqrst'",
            column=10,
            snippet="api_key = 'sk_live_1234567890abcdefghijklmnopqrst'\n",
            is_whitelisted=False
        )
        
        assert finding.file_path == "src/config.py"
        assert finding.line_number == 42
        assert finding.rule_id == "api-key-001"
        assert finding.severity == Severity.HIGH
        assert finding.match_content == "api_key = 'sk_live_1234567890abcdefghijklmnopqrst'"
        assert finding.column == 10
        assert finding.snippet == "api_key = 'sk_live_1234567890abcdefghijklmnopqrst'\n"
        assert finding.is_whitelisted is False
    
    def test_finding_instantiation_with_optional_fields_default(self):
        finding = Finding(
            file_path="src/config.py",
            line_number=42,
            rule_id="api-key-001",
            severity=Severity.HIGH,
            match_content="api_key = 'secret'"
        )
        
        assert finding.column is None
        assert finding.snippet is None
        assert finding.is_whitelisted is False
    
    def test_finding_to_dict(self):
        finding = Finding(
            file_path="src/config.py",
            line_number=42,
            rule_id="api-key-001",
            severity=Severity.HIGH,
            match_content="api_key = 'sk_live_1234567890'",
            column=10,
            snippet="api_key = 'sk_live_1234567890'\n",
            is_whitelisted=False
        )
        
        result = finding.to_dict()
        
        assert isinstance(result, dict)
        assert result["file_path"] == "src/config.py"
        assert result["line_number"] == 42
        assert result["column"] == 10
        assert result["rule_id"] == "api-key-001"
        assert result["severity"] == "high"
        assert result["snippet"] == "api_key = 'sk_live_1234567890'\n"
        assert result["match_content"] == "api_key = 'sk_live_1234567890'"
        assert result["is_whitelisted"] is False
    
    def test_finding_to_dict_with_none_optional_fields(self):
        finding = Finding(
            file_path="src/config.py",
            line_number=42,
            rule_id="api-key-001",
            severity=Severity.HIGH,
            match_content="api_key = 'secret'"
        )
        
        result = finding.to_dict()
        
        assert result["column"] is None
        assert result["snippet"] is None
    
    def test_finding_to_dict_is_json_serializable(self):
        finding = Finding(
            file_path="src/config.py",
            line_number=42,
            rule_id="api-key-001",
            severity=Severity.HIGH,
            match_content="api_key = 'secret'"
        )
        
        result = finding.to_dict()
        
        assert json.dumps(result) is not None
    
    def test_finding_is_frozen(self):
        finding = Finding(
            file_path="src/config.py",
            line_number=42,
            rule_id="api-key-001",
            severity=Severity.HIGH,
            match_content="api_key = 'secret'"
        )
        
        with pytest.raises(FrozenInstanceError):
            finding.file_path = "new/path.py"


class TestScanResult:
    def test_scan_result_instantiation(self):
        scan_time = datetime(2024, 1, 15, 10, 30, 0)
        
        finding = Finding(
            file_path="src/config.py",
            line_number=42,
            rule_id="api-key-001",
            severity=Severity.HIGH,
            match_content="api_key = 'secret'"
        )
        
        scan_result = ScanResult(
            scan_time=scan_time,
            target_path="/home/user/project",
            scan_mode="filesystem",
            total_findings=1,
            findings=[finding],
            by_severity={Severity.HIGH: 1}
        )
        
        assert scan_result.scan_time == scan_time
        assert scan_result.target_path == "/home/user/project"
        assert scan_result.scan_mode == "filesystem"
        assert scan_result.total_findings == 1
        assert scan_result.findings == [finding]
        assert scan_result.by_severity == {Severity.HIGH: 1}
    
    def test_scan_result_instantiation_with_default_fields(self):
        scan_time = datetime(2024, 1, 15, 10, 30, 0)
        
        scan_result = ScanResult(
            scan_time=scan_time,
            target_path="/home/user/project",
            scan_mode="filesystem",
            total_findings=0
        )
        
        assert scan_result.findings == []
        assert scan_result.by_severity == {}
    
    def test_scan_result_to_dict(self):
        scan_time = datetime(2024, 1, 15, 10, 30, 0, 123456)
        
        finding = Finding(
            file_path="src/config.py",
            line_number=42,
            rule_id="api-key-001",
            severity=Severity.HIGH,
            match_content="api_key = 'secret'"
        )
        
        scan_result = ScanResult(
            scan_time=scan_time,
            target_path="/home/user/project",
            scan_mode="filesystem",
            total_findings=1,
            findings=[finding],
            by_severity={Severity.HIGH: 1, Severity.LOW: 2}
        )
        
        result = scan_result.to_dict()
        
        assert isinstance(result, dict)
        assert result["scan_time"] == scan_time.isoformat()
        assert result["target_path"] == "/home/user/project"
        assert result["scan_mode"] == "filesystem"
        assert result["total_findings"] == 1
        assert len(result["findings"]) == 1
        assert result["findings"][0]["file_path"] == "src/config.py"
        assert result["by_severity"] == {"high": 1, "low": 2}
    
    def test_scan_result_to_dict_is_json_serializable(self):
        scan_time = datetime(2024, 1, 15, 10, 30, 0)
        
        finding = Finding(
            file_path="src/config.py",
            line_number=42,
            rule_id="api-key-001",
            severity=Severity.HIGH,
            match_content="api_key = 'secret'"
        )
        
        scan_result = ScanResult(
            scan_time=scan_time,
            target_path="/home/user/project",
            scan_mode="filesystem",
            total_findings=1,
            findings=[finding],
            by_severity={Severity.HIGH: 1}
        )
        
        result = scan_result.to_dict()
        
        assert json.dumps(result) is not None
    
    def test_scan_result_is_frozen(self):
        scan_time = datetime(2024, 1, 15, 10, 30, 0)
        
        scan_result = ScanResult(
            scan_time=scan_time,
            target_path="/home/user/project",
            scan_mode="filesystem",
            total_findings=0
        )
        
        with pytest.raises(FrozenInstanceError):
            scan_result.total_findings = 10
