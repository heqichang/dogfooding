import yaml
import json
from typing import Dict, Any, Optional, List
from pathlib import Path
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TemplateRenderer:
    def __init__(self):
        self.template = None
        self.context = {}

    def load_template(self, template_path: str, file_format: str = None):
        path = Path(template_path)
        if not path.exists():
            raise FileNotFoundError(f"模板文件不存在: {template_path}")

        if file_format is None:
            if path.suffix in ['.yaml', '.yml']:
                file_format = 'yaml'
            elif path.suffix == '.json':
                file_format = 'json'
            else:
                raise ValueError(f"无法识别的文件格式: {path.suffix}")

        with open(path, 'r', encoding='utf-8') as f:
            if file_format == 'yaml':
                self.template = yaml.safe_load(f)
            elif file_format == 'json':
                self.template = json.load(f)

        logger.info(f"模板已加载: {template_path}")
        return self.template

    def load_template_from_string(self, template_str: str, file_format: str = 'yaml'):
        if file_format == 'yaml':
            self.template = yaml.safe_load(template_str)
        elif file_format == 'json':
            self.template = json.loads(template_str)

        logger.info("模板已从字符串加载")
        return self.template

    def set_context(self, context: Dict[str, Any]):
        self.context.update(context)
        logger.info(f"上下文已设置: {list(context.keys())}")

    def render_value(self, value: Any, context: Dict[str, Any] = None) -> Any:
        if context is None:
            context = self.context

        if isinstance(value, str):
            import re
            matches = re.findall(r'\{\{([^}]+)\}\}', value)
            for match in matches:
                var_name = match.strip()
                var_value = self._get_nested_value(context, var_name)
                if var_value is not None:
                    value = value.replace(f"{{{{{match}}}}}", str(var_value))
            return value
        elif isinstance(value, dict):
            return {k: self.render_value(v, context) for k, v in value.items()}
        elif isinstance(value, list):
            return [self.render_value(item, context) for item in value]
        else:
            return value

    def _get_nested_value(self, context: Dict[str, Any], key: str) -> Any:
        keys = key.split('.')
        value = context
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            elif hasattr(value, k):
                value = getattr(value, k)
            else:
                return None
        return value

    def validate_template(self) -> List[str]:
        errors = []

        if not self.template:
            errors.append("模板为空")
            return errors

        if 'sheets' not in self.template:
            errors.append("模板缺少 'sheets' 配置")

        if 'sheets' in self.template:
            for idx, sheet in enumerate(self.template.get('sheets', [])):
                if 'name' not in sheet:
                    errors.append(f"Sheet {idx} 缺少 'name' 字段")
                if 'data' not in sheet and 'query' not in sheet:
                    errors.append(f"Sheet '{sheet.get('name', idx)}' 缺少 'data' 或 'query' 配置")

        return errors

    def get_sheet_configs(self) -> List[Dict[str, Any]]:
        if not self.template:
            return []
        return self.template.get('sheets', [])

    def get_global_config(self) -> Dict[str, Any]:
        if not self.template:
            return {}
        return self.template.get('global', {})

    def generate_output_name(self, template_name: str = None) -> str:
        global_config = self.get_global_config()
        output_name = global_config.get('output_name', template_name or 'report')

        context = {
            'timestamp': datetime.now().strftime('%Y%m%d_%H%M%S'),
            'date': datetime.now().strftime('%Y-%m-%d'),
            'time': datetime.now().strftime('%H:%M:%S'),
            **self.context
        }

        rendered_name = self.render_value(output_name, context)

        if not rendered_name.endswith('.xlsx'):
            rendered_name += '.xlsx'

        return rendered_name

    @staticmethod
    def create_sample_template() -> Dict[str, Any]:
        return {
            'global': {
                'output_name': 'report_{{timestamp}}',
                'default_style': {
                    'font': {'size': 11},
                    'border': 'thin'
                }
            },
            'sheets': [
                {
                    'name': '销售数据',
                    'data_source': 'database',
                    'query': 'SELECT * FROM sales_data',
                    'include_headers': True,
                    'styles': {
                        'header': {
                            'bold': True,
                            'fill_color': '4472C4',
                            'font_color': 'FFFFFF'
                        }
                    },
                    'merge_cells': [
                        {
                            'start_row': 1,
                            'end_row': 1,
                            'start_col': 1,
                            'end_col': 5,
                            'value': '销售数据表',
                            'style': {'bold': True, 'font_size': 14}
                        }
                    ]
                },
                {
                    'name': '销售图表',
                    'data_source': 'database',
                    'query': 'SELECT month, sales, profit FROM sales_summary',
                    'charts': [
                        {
                            'type': 'bar',
                            'title': '月度销售额',
                            'x_axis': 'month',
                            'y_axes': ['sales'],
                            'position': 'A10'
                        },
                        {
                            'type': 'line',
                            'title': '利润趋势',
                            'x_axis': 'month',
                            'y_axes': ['profit'],
                            'position': 'A30'
                        }
                    ]
                }
            ]
        }

    @staticmethod
    def save_sample_template(file_path: str, format: str = 'yaml'):
        template = TemplateRenderer.create_sample_template()
        path = Path(file_path)

        with open(path, 'w', encoding='utf-8') as f:
            if format == 'yaml':
                yaml.dump(template, f, default_flow_style=False, allow_unicode=True)
            elif format == 'json':
                json.dump(template, f, indent=2, ensure_ascii=False)

        logger.info(f"示例模板已保存: {file_path}")
