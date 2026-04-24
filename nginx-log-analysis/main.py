#!/usr/bin/env python3
import argparse
import sys
from pathlib import Path

from parser import NginxLogParser
from analyzer import LogAnalyzer
from report import HTMLReport


def main():
    parser = argparse.ArgumentParser(
        description='Nginx 日志分析工具 - 解析日志并生成 HTML 报告',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例用法:
  python main.py -f access.log
  python main.py -f access.log -o report.html
  python main.py -f access.log --slow-threshold 5.0
        '''
    )
    
    parser.add_argument('-f', '--file', required=True, help='Nginx 日志文件路径')
    parser.add_argument('-o', '--output', default='nginx-report.html', help='输出 HTML 报告文件路径 (默认: nginx-report.html)')
    parser.add_argument('--slow-threshold', type=float, help='慢请求阈值（秒），默认使用 P95')
    parser.add_argument('--abnormal-threshold', type=float, default=3.0, help='异常 IP 检测的标准差倍数 (默认: 3.0)')
    parser.add_argument('--no-report', action='store_true', help='不生成 HTML 报告，只在控制台输出摘要')
    parser.add_argument('--verbose', '-v', action='store_true', help='输出详细信息')
    
    args = parser.parse_args()
    
    log_file = Path(args.file)
    if not log_file.exists():
        print(f"错误: 日志文件不存在: {args.file}", file=sys.stderr)
        sys.exit(1)
    
    print(f"开始解析日志文件: {args.file}")
    print("-" * 50)
    
    log_parser = NginxLogParser()
    records = log_parser.parse_file(str(log_file))
    
    if not records:
        print("错误: 无法解析日志文件或文件为空", file=sys.stderr)
        sys.exit(1)
    
    print(f"成功解析 {len(records)} 条日志记录")
    print()
    
    analyzer = LogAnalyzer(records)
    
    print("执行统计分析...")
    if args.slow_threshold is not None:
        analysis = analyzer.run_all_analysis()
        analysis['slow_requests'] = analyzer.get_slow_requests(
            custom_threshold=args.slow_threshold
        )
    else:
        analysis = analyzer.run_all_analysis()
    
    analysis['abnormal_ips'] = analyzer.get_abnormal_ips(
        threshold_multiplier=args.abnormal_threshold
    )
    
    basic = analysis['basic']
    status = analysis['status_codes']
    response = analysis['response_times']
    
    print("\n" + "=" * 50)
    print("分析摘要")
    print("=" * 50)
    
    print("\n【基本统计】")
    print(f"  总请求数 (PV): {basic['pv']}")
    print(f"  独立 IP (UV): {basic['uv']}")
    print(f"  总流量: {basic['total_size_mb']:.2f} MB")
    print(f"  平均响应时间: {basic['avg_response_time_ms']:.2f} ms")
    
    print("\n【状态码分布】")
    for code, count in sorted(status['distribution'].items()):
        pct = status['percentages'][code]
        print(f"  {code}: {count} ({pct:.2f}%)")
    
    print("\n【响应时间统计】")
    if response.get('has_data'):
        print(f"  P50: {response['p50'] * 1000:.2f} ms")
        print(f"  P95: {response['p95'] * 1000:.2f} ms")
        print(f"  P99: {response['p99'] * 1000:.2f} ms")
        print(f"  P999: {response['p999'] * 1000:.2f} ms")
    else:
        print("  暂无响应时间数据")
    
    slow_count = len(analysis['slow_requests'])
    print(f"\n【慢请求】发现 {slow_count} 个慢请求")
    
    abnormal = analysis['abnormal_ips']
    if abnormal.get('has_abnormal'):
        print(f"【异常 IP】发现 {len(abnormal['abnormal_ips'])} 个异常 IP")
    else:
        print("【异常 IP】未发现异常 IP")
    
    if not args.no_report:
        print("\n" + "=" * 50)
        print(f"正在生成 HTML 报告: {args.output}")
        print("=" * 50)
        
        report = HTMLReport(analysis)
        report.save(args.output)
        
        print(f"\n报告已成功生成: {args.output}")
        print("\n您可以使用浏览器打开此文件查看详细报告。")
        
        if args.verbose:
            print("\n【详细统计】")
            print(f"\n热门路径 TOP 10:")
            for i, path in enumerate(analysis['top_paths'][:10], 1):
                print(f"  {i}. {path['path']} ({path['count']} 次)")
            
            print(f"\n请求方法分布:")
            for method, count in analysis['methods'].items():
                print(f"  {method}: {count}")
    
    print("\n分析完成!")


if __name__ == '__main__':
    main()
