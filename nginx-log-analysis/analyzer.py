from collections import Counter, defaultdict
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from datetime import datetime


class LogAnalyzer:
    def __init__(self, records: List[Dict[str, Any]]):
        self.records = records

    def get_basic_stats(self) -> Dict[str, Any]:
        pv = len(self.records)
        
        unique_ips = set()
        unique_users = set()
        
        for record in self.records:
            unique_ips.add(record.get('ip', ''))
            if record.get('user') and record.get('user') != '-':
                unique_users.add(record.get('user', ''))
        
        uv = len(unique_ips)
        
        total_size = sum(r.get('size', 0) for r in self.records)
        
        request_times = [r['request_time'] for r in self.records if r.get('request_time') is not None]
        avg_response_time = np.mean(request_times) if request_times else 0
        
        return {
            'total_records': pv,
            'pv': pv,
            'uv': uv,
            'unique_users': len(unique_users) if unique_users else uv,
            'total_size_bytes': total_size,
            'total_size_mb': total_size / (1024 * 1024),
            'avg_response_time_seconds': avg_response_time,
            'avg_response_time_ms': avg_response_time * 1000,
        }

    def get_status_code_distribution(self) -> Dict[str, Any]:
        status_codes = [r['status'] for r in self.records]
        counter = Counter(status_codes)
        
        total = len(status_codes)
        distribution = {}
        percentages = {}
        
        for code, count in sorted(counter.items()):
            category = f"{str(code)[0]}xx"
            distribution[str(code)] = count
            percentages[str(code)] = (count / total) * 100
        
        category_dist = defaultdict(int)
        for code, count in counter.items():
            category = f"{str(code)[0]}xx"
            category_dist[category] += count
        
        return {
            'raw': dict(counter),
            'distribution': distribution,
            'percentages': percentages,
            'categories': dict(category_dist),
            'total': total,
            'success_count': category_dist.get('2xx', 0),
            'error_count': category_dist.get('4xx', 0) + category_dist.get('5xx', 0),
        }

    def get_response_time_distribution(self) -> Dict[str, Any]:
        request_times = [r['request_time'] for r in self.records if r.get('request_time') is not None]
        
        if not request_times:
            return {
                'has_data': False,
                'message': 'No response time data available'
            }
        
        times_array = np.array(request_times)
        
        bins = [0, 0.1, 0.3, 0.5, 1.0, 2.0, 5.0, float('inf')]
        labels = ['0-100ms', '100-300ms', '300-500ms', '500ms-1s', '1s-2s', '2s-5s', '5s+']
        
        hist, _ = np.histogram(times_array, bins=bins)
        distribution = dict(zip(labels, hist.tolist()))
        
        total = len(request_times)
        percentages = {k: (v / total) * 100 for k, v in distribution.items()}
        
        return {
            'has_data': True,
            'count': total,
            'min': float(np.min(times_array)),
            'max': float(np.max(times_array)),
            'mean': float(np.mean(times_array)),
            'median': float(np.median(times_array)),
            'p50': float(np.percentile(times_array, 50)),
            'p95': float(np.percentile(times_array, 95)),
            'p99': float(np.percentile(times_array, 99)),
            'p999': float(np.percentile(times_array, 99.9)),
            'distribution': distribution,
            'percentages': percentages,
            'all_times': request_times,
        }

    def get_slow_requests(self, threshold_p95: bool = True, custom_threshold: Optional[float] = None) -> List[Dict[str, Any]]:
        response_times = self.get_response_time_distribution()
        
        if not response_times.get('has_data'):
            return []
        
        if custom_threshold is not None:
            threshold = custom_threshold
        elif threshold_p95:
            threshold = response_times['p95']
        else:
            threshold = response_times['p99']
        
        slow_records = []
        for record in self.records:
            rt = record.get('request_time')
            if rt is not None and rt >= threshold:
                slow_records.append({
                    'ip': record.get('ip'),
                    'datetime': record.get('datetime'),
                    'method': record.get('method'),
                    'path': record.get('path'),
                    'status': record.get('status'),
                    'request_time': rt,
                    'user_agent': record.get('user_agent'),
                    'time_ms': rt * 1000
                })
        
        slow_records.sort(key=lambda x: x['request_time'], reverse=True)
        
        return slow_records

    def get_abnormal_ips(self, threshold_multiplier: float = 3.0) -> Dict[str, Any]:
        ip_counts = Counter(r.get('ip', '') for r in self.records)
        
        total_requests = len(self.records)
        unique_ips = len(ip_counts)
        
        if unique_ips == 0:
            return {
                'has_abnormal': False,
                'abnormal_ips': [],
                'total_ips': 0,
                'avg_requests_per_ip': 0
            }
        
        counts = np.array(list(ip_counts.values()))
        mean = np.mean(counts)
        std = np.std(counts)
        
        threshold = mean + threshold_multiplier * std
        
        abnormal_ips = []
        for ip, count in ip_counts.most_common(100):
            if count >= threshold:
                abnormal_ips.append({
                    'ip': ip,
                    'request_count': count,
                    'percentage': (count / total_requests) * 100,
                    'ratio_to_avg': count / mean if mean > 0 else 0
                })
        
        return {
            'has_abnormal': len(abnormal_ips) > 0,
            'abnormal_ips': abnormal_ips,
            'total_ips': unique_ips,
            'total_requests': total_requests,
            'avg_requests_per_ip': float(mean),
            'std_dev': float(std),
            'threshold': float(threshold),
        }

    def get_top_paths(self, top_n: int = 20) -> List[Dict[str, Any]]:
        path_counts = Counter(r.get('path', '') for r in self.records)
        
        total = len(self.records)
        top_paths = []
        for path, count in path_counts.most_common(top_n):
            top_paths.append({
                'path': path,
                'count': count,
                'percentage': (count / total) * 100
            })
        
        return top_paths

    def get_time_range(self) -> Dict[str, Any]:
        datetimes = [r['datetime'] for r in self.records if r.get('datetime')]
        
        if not datetimes:
            return {
                'has_data': False,
                'message': 'No datetime data available'
            }
        
        return {
            'has_data': True,
            'start_time': min(datetimes),
            'end_time': max(datetimes),
            'duration_hours': (max(datetimes) - min(datetimes)).total_seconds() / 3600
        }

    def get_referrers(self, top_n: int = 20) -> List[Dict[str, Any]]:
        referrers = Counter(r.get('referrer', '') for r in self.records if r.get('referrer') and r.get('referrer') != '-')
        
        top = []
        for ref, count in referrers.most_common(top_n):
            top.append({
                'referrer': ref,
                'count': count
            })
        
        return top

    def get_user_agents(self, top_n: int = 20) -> List[Dict[str, Any]]:
        uas = Counter(r.get('user_agent', '') for r in self.records if r.get('user_agent'))
        
        top = []
        for ua, count in uas.most_common(top_n):
            top.append({
                'user_agent': ua,
                'count': count
            })
        
        return top

    def get_method_distribution(self) -> Dict[str, int]:
        methods = Counter(r.get('method', '') for r in self.records)
        return dict(methods)

    def run_all_analysis(self) -> Dict[str, Any]:
        return {
            'basic': self.get_basic_stats(),
            'time_range': self.get_time_range(),
            'status_codes': self.get_status_code_distribution(),
            'response_times': self.get_response_time_distribution(),
            'top_paths': self.get_top_paths(),
            'top_referrers': self.get_referrers(),
            'top_user_agents': self.get_user_agents(),
            'methods': self.get_method_distribution(),
            'slow_requests': self.get_slow_requests(),
            'abnormal_ips': self.get_abnormal_ips(),
        }
