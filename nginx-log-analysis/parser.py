import re
from datetime import datetime
from typing import List, Dict, Any, Optional


class NginxLogParser:
    DEFAULT_LOG_FORMAT = (
        r'^(?P<ip>\S+) '
        r'(?P<identity>\S+) '
        r'(?P<user>\S+) '
        r'\[(?P<time>[^\]]+)\] '
        r'"(?P<method>\S+) '
        r'(?P<path>\S+) '
        r'(?P<protocol>\S+)" '
        r'(?P<status>\d+) '
        r'(?P<size>\S+) '
        r'"(?P<referrer>[^"]*)" '
        r'"(?P<user_agent>[^"]*)"'
        r'(?:\s+(?P<request_time>[\d.]+))?'
    )

    TIME_FORMAT = "%d/%b/%Y:%H:%M:%S %z"

    def __init__(self, custom_format: Optional[str] = None):
        self.pattern = re.compile(custom_format if custom_format else self.DEFAULT_LOG_FORMAT)

    def parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        match = self.pattern.match(line.strip())
        if not match:
            return None

        data = match.groupdict()

        data['status'] = int(data['status'])
        data['size'] = self._parse_size(data['size'])
        data['request_time'] = self._parse_request_time(data.get('request_time'))

        if 'time' in data:
            data['datetime'] = self._parse_time(data['time'])

        return data

    def parse_file(self, filepath: str) -> List[Dict[str, Any]]:
        records = []
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                record = self.parse_line(line)
                if record:
                    records.append(record)
        return records

    def _parse_size(self, size_str: str) -> int:
        if size_str == '-':
            return 0
        try:
            return int(size_str)
        except ValueError:
            return 0

    def _parse_request_time(self, time_str: Optional[str]) -> Optional[float]:
        if time_str is None or time_str == '-':
            return None
        try:
            return float(time_str)
        except ValueError:
            return None

    def _parse_time(self, time_str: str) -> Optional[datetime]:
        try:
            return datetime.strptime(time_str, self.TIME_FORMAT)
        except ValueError:
            return None
