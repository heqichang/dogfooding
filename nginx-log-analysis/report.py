from typing import Dict, Any, List
from datetime import datetime
import os


HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nginx 日志分析报告</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            color: white;
            padding: 40px 0;
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .header .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        .card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .card-title {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #667eea;
            color: #2d3748;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .stat-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .stat-card.pv { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .stat-card.uv { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
        .stat-card.success { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; }
        .stat-card.error { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; }
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        th {
            background: #f7fafc;
            font-weight: 600;
            color: #4a5568;
        }
        tr:hover {
            background: #f7fafc;
        }
        .progress-bar {
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        .progress-fill.green { background: linear-gradient(90deg, #4facfe, #00f2fe); }
        .progress-fill.blue { background: linear-gradient(90deg, #667eea, #764ba2); }
        .progress-fill.red { background: linear-gradient(90deg, #f093fb, #f5576c); }
        .progress-fill.yellow { background: linear-gradient(90deg, #fa709a, #fee140); }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .badge-2xx { background: #c6f6d5; color: #22543d; }
        .badge-3xx { background: #bee3f8; color: #2a4365; }
        .badge-4xx { background: #feebc8; color: #744210; }
        .badge-5xx { background: #fed7d7; color: #742a2a; }
        .warning-box {
            background: linear-gradient(135deg, #fff3cd 0%, #ffecd2 100%);
            border-left: 4px solid #ffc107;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .warning-box h4 {
            color: #856404;
            margin-bottom: 8px;
        }
        .warning-box p {
            color: #856404;
            font-size: 0.9rem;
        }
        .info-box {
            background: linear-gradient(135deg, #d1ecf1 0%, #b8daff 100%);
            border-left: 4px solid #0c5460;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .info-box h4 {
            color: #0c5460;
            margin-bottom: 8px;
        }
        .info-box p {
            color: #0c5460;
            font-size: 0.9rem;
        }
        .two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        @media (max-width: 768px) {
            .two-columns {
                grid-template-columns: 1fr;
            }
            .header h1 {
                font-size: 1.8rem;
            }
        }
        .chart-container {
            height: 300px;
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            padding: 20px;
            background: #f7fafc;
            border-radius: 12px;
        }
        .chart-bar {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 60px;
        }
        .chart-bar .bar {
            width: 40px;
            background: linear-gradient(180deg, #667eea, #764ba2);
            border-radius: 4px 4px 0 0;
            transition: height 0.5s ease;
        }
        .chart-bar .label {
            margin-top: 8px;
            font-size: 0.75rem;
            color: #4a5568;
            text-align: center;
            word-wrap: break-word;
            max-width: 60px;
        }
        .chart-bar .value {
            font-size: 0.8rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 4px;
        }
        .footer {
            text-align: center;
            color: white;
            padding: 20px;
            opacity: 0.8;
            font-size: 0.9rem;
        }
        .code {
            background: #2d3748;
            color: #e2e8f0;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            overflow-x: auto;
            white-space: nowrap;
        }
        .scrollable {
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nginx 日志分析报告</h1>
            <div class="subtitle">生成时间: {{ generate_time }}</div>
        </div>

        <div class="card">
            <h2 class="card-title">基本统计</h2>
            <div class="info-box">
                <h4>时间范围</h4>
                <p>{{ time_range }}</p>
            </div>
            <div class="stats-grid">
                <div class="stat-card pv">
                    <div class="stat-value">{{ basic.pv }}</div>
                    <div class="stat-label">总请求数 (PV)</div>
                </div>
                <div class="stat-card uv">
                    <div class="stat-value">{{ basic.uv }}</div>
                    <div class="stat-label">独立 IP 数 (UV)</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-value">{{ status.success_count }}</div>
                    <div class="stat-label">成功请求 (2xx)</div>
                </div>
                <div class="stat-card error">
                    <div class="stat-value">{{ status.error_count }}</div>
                    <div class="stat-label">错误请求 (4xx+5xx)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ "%.2f"|format(basic.total_size_mb) }} MB</div>
                    <div class="stat-label">总流量</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ "%.2f"|format(basic.avg_response_time_ms) }} ms</div>
                    <div class="stat-label">平均响应时间</div>
                </div>
            </div>
        </div>

        <div class="two-columns">
            <div class="card">
                <h2 class="card-title">状态码分布</h2>
                <table>
                    <thead>
                        <tr>
                            <th>状态码</th>
                            <th>数量</th>
                            <th>占比</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for code, count in status.distribution.items() %}
                        <tr>
                            <td>
                                <span class="badge badge-{{ code[0] }}xx">{{ code }}</span>
                            </td>
                            <td>{{ count }}</td>
                            <td>{{ "%.2f"|format(status.percentages[code]) }}%</td>
                            <td style="width: 200px;">
                                <div class="progress-bar">
                                    <div class="progress-fill {% if code[0] == '2' %}green{% elif code[0] in ('4', '5') %}red{% else %}blue{% endif %}" 
                                         style="width: {{ status.percentages[code] }}%"></div>
                                </div>
                            </td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h2 class="card-title">响应时间分布</h2>
                {% if response.has_data %}
                <table>
                    <thead>
                        <tr>
                            <th>范围</th>
                            <th>数量</th>
                            <th>占比</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for range, count in response.distribution.items() %}
                        <tr>
                            <td>{{ range }}</td>
                            <td>{{ count }}</td>
                            <td>{{ "%.2f"|format(response.percentages[range]) }}%</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
                <div style="margin-top: 20px; padding: 16px; background: #f7fafc; border-radius: 8px;">
                    <h4 style="margin-bottom: 12px; color: #2d3748;">响应时间统计</h4>
                    <div class="stats-grid" style="gap: 12px;">
                        <div>
                            <strong>P50 (中位数):</strong> {{ "%.2f"|format(response.p50 * 1000) }} ms
                        </div>
                        <div>
                            <strong>P95:</strong> {{ "%.2f"|format(response.p95 * 1000) }} ms
                        </div>
                        <div>
                            <strong>P99:</strong> {{ "%.2f"|format(response.p99 * 1000) }} ms
                        </div>
                        <div>
                            <strong>P999:</strong> {{ "%.2f"|format(response.p999 * 1000) }} ms
                        </div>
                    </div>
                </div>
                {% else %}
                <p>暂无响应时间数据</p>
                {% endif %}
            </div>
        </div>

        {% if slow_requests %}
        <div class="card">
            <h2 class="card-title">慢请求分析 (P95 阈值: {{ "%.2f"|format(response.p95 * 1000) }} ms)</h2>
            <div class="warning-box">
                <h4>发现 {{ slow_requests|length }} 个慢请求</h4>
                <p>以下是响应时间超过 P95 的请求，建议关注性能优化。</p>
            </div>
            <div class="scrollable">
                <table>
                    <thead>
                        <tr>
                            <th>响应时间 (ms)</th>
                            <th>状态码</th>
                            <th>方法</th>
                            <th>路径</th>
                            <th>IP</th>
                            <th>时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for req in slow_requests[:50] %}
                        <tr>
                            <td><strong style="color: #e53e3e;">{{ "%.2f"|format(req.time_ms) }}</strong></td>
                            <td><span class="badge badge-{{ (req.status|string)[0] }}xx">{{ req.status }}</span></td>
                            <td>{{ req.method }}</td>
                            <td class="code">{{ req.path }}</td>
                            <td>{{ req.ip }}</td>
                            <td>{{ req.datetime }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
            {% if slow_requests|length > 50 %}
            <p style="margin-top: 16px; color: #4a5568; text-align: center;">仅显示前 50 条记录，共 {{ slow_requests|length }} 条</p>
            {% endif %}
        </div>
        {% endif %}

        {% if abnormal_ips.abnormal_ips %}
        <div class="card">
            <h2 class="card-title">异常 IP 分析</h2>
            <div class="warning-box">
                <h4>发现 {{ abnormal_ips.abnormal_ips|length }} 个异常访问 IP</h4>
                <p>平均每个 IP 请求数: {{ "%.2f"|format(abnormal_ips.avg_requests_per_ip) }}，阈值: {{ "%.2f"|format(abnormal_ips.threshold) }}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>IP 地址</th>
                        <th>请求数</th>
                        <th>占比</th>
                        <th>超过平均倍数</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {% for ip_info in abnormal_ips.abnormal_ips[:20] %}
                    <tr>
                        <td><strong>{{ ip_info.ip }}</strong></td>
                        <td>{{ ip_info.request_count }}</td>
                        <td>{{ "%.2f"|format(ip_info.percentage) }}%</td>
                        <td>{{ "%.2f"|format(ip_info.ratio_to_avg) }}x</td>
                        <td style="width: 200px;">
                            <div class="progress-bar">
                                <div class="progress-fill red" style="width: {{ ip_info.bar_width }}%"></div>
                            </div>
                        </td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
            {% if abnormal_ips.abnormal_ips|length > 20 %}
            <p style="margin-top: 16px; color: #4a5568; text-align: center;">仅显示前 20 个 IP，共 {{ abnormal_ips.abnormal_ips|length }} 个</p>
            {% endif %}
        </div>
        {% endif %}

        <div class="two-columns">
            <div class="card">
                <h2 class="card-title">热门路径 TOP 20</h2>
                <table>
                    <thead>
                        <tr>
                            <th>排名</th>
                            <th>路径</th>
                            <th>请求数</th>
                            <th>占比</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for item in top_paths %}
                        <tr>
                            <td>{{ loop.index }}</td>
                            <td class="code">{{ item.path }}</td>
                            <td>{{ item.count }}</td>
                            <td>{{ "%.2f"|format(item.percentage) }}%</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h2 class="card-title">请求方法分布</h2>
                <table>
                    <thead>
                        <tr>
                            <th>方法</th>
                            <th>数量</th>
                            <th>占比</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for method, count in methods.items() %}
                        <tr>
                            <td><strong>{{ method }}</strong></td>
                            <td>{{ count }}</td>
                            <td>{{ "%.2f"|format((count / basic.pv) * 100) }}%</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>

                {% if top_referrers %}
                <h3 style="margin-top: 24px; margin-bottom: 16px; color: #2d3748;">热门来源页 TOP 10</h3>
                <table>
                    <thead>
                        <tr>
                            <th>来源页</th>
                            <th>数量</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for item in top_referrers[:10] %}
                        <tr>
                            <td class="code">{{ item.referrer }}</td>
                            <td>{{ item.count }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
                {% endif %}
            </div>
        </div>

        {% if top_user_agents %}
        <div class="card">
            <h2 class="card-title">用户代理 TOP 20</h2>
            <div class="scrollable">
                <table>
                    <thead>
                        <tr>
                            <th>排名</th>
                            <th>用户代理</th>
                            <th>数量</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for item in top_user_agents[:20] %}
                        <tr>
                            <td>{{ loop.index }}</td>
                            <td>{{ item.user_agent }}</td>
                            <td>{{ item.count }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </div>
        {% endif %}

        <div class="footer">
            Nginx Log Analyzer | 报告生成于 {{ generate_time }}
        </div>
    </div>
</body>
</html>
"""


class HTMLReport:
    def __init__(self, analysis_result: Dict[str, Any]):
        self.analysis = analysis_result

    def _format_time_range(self) -> str:
        time_range = self.analysis.get('time_range', {})
        if not time_range.get('has_data'):
            return '未知'
        
        start = time_range.get('start_time')
        end = time_range.get('end_time')
        
        if start and end:
            return f"{start.strftime('%Y-%m-%d %H:%M:%S')} 至 {end.strftime('%Y-%m-%d %H:%M:%S')}"
        return '未知'

    def generate(self) -> str:
        from jinja2 import Template
        
        abnormal_ips = self.analysis.get('abnormal_ips', {})
        if abnormal_ips and 'abnormal_ips' in abnormal_ips:
            for ip_info in abnormal_ips['abnormal_ips']:
                if 'percentage' in ip_info:
                    ip_info['bar_width'] = min(ip_info['percentage'] * 10, 100)
                else:
                    ip_info['bar_width'] = 0
        
        template = Template(HTML_TEMPLATE)
        
        context = {
            'generate_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'time_range': self._format_time_range(),
            'basic': self.analysis.get('basic', {}),
            'status': self.analysis.get('status_codes', {}),
            'response': self.analysis.get('response_times', {}),
            'slow_requests': self.analysis.get('slow_requests', []),
            'abnormal_ips': abnormal_ips,
            'top_paths': self.analysis.get('top_paths', []),
            'top_referrers': self.analysis.get('top_referrers', []),
            'top_user_agents': self.analysis.get('top_user_agents', []),
            'methods': self.analysis.get('methods', {}),
        }
        
        return template.render(context)

    def save(self, filepath: str) -> None:
        html_content = self.generate()
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)
