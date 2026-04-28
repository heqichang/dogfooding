import { Parser } from './parser';
import { toSQL } from './serializer';
import {
  Statement,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
  DeleteStatement,
  Expression,
  Node,
} from './ast';

/**
 * 解析 SQL 字符串为 AST
 * @param sql SQL 字符串
 * @returns AST 语句对象
 */
export function parse(sql: string): Statement {
  const parser = new Parser(sql);
  return parser.parse();
}

// 重新导出
export { toSQL };
export { Parser };

// 导出类型
export type {
  Statement,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
  DeleteStatement,
  Expression,
  Node,
};
