// 基础接口
export interface Node {
  type: string;
}

// 表达式节点
export interface Identifier extends Node {
  type: 'identifier';
  name: string;
}

export interface Literal extends Node {
  type: 'literal';
  value: string | number | boolean | null;
  valueType: 'string' | 'number' | 'boolean' | 'null';
}

export interface ColumnRef extends Node {
  type: 'column_ref';
  table?: string;
  column: string;
}

export interface StarExpr extends Node {
  type: 'star';
  table?: string;
}

export interface BinaryExpr extends Node {
  type: 'binary_expr';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpr extends Node {
  type: 'unary_expr';
  operator: string;
  expr: Expression;
}

export interface FunctionCall extends Node {
  type: 'function';
  name: string;
  args: Expression[];
}

export interface Alias extends Node {
  type: 'alias';
  expr: Expression;
  as?: string;
  hasAs?: boolean;
}

export interface ParenthesisExpr extends Node {
  type: 'parenthesis';
  expr: Expression;
}

// 子句节点
export interface TableRef extends Node {
  type: 'table_ref';
  name: string;
  alias?: string;
  hasAs?: boolean;
}

export interface Join extends Node {
  type: 'join';
  joinType: 'inner' | 'left' | 'right';
  table: TableRef;
  on: Expression;
}

export interface OrderBy extends Node {
  type: 'order_by';
  expr: Expression;
  order: 'asc' | 'desc';
}

export interface Limit extends Node {
  type: 'limit';
  count: number;
}

export interface SetClause extends Node {
  type: 'set_clause';
  column: string;
  value: Expression;
}

// 辅助类型
export type Expression = 
  | Identifier
  | Literal
  | ColumnRef
  | StarExpr
  | BinaryExpr
  | UnaryExpr
  | FunctionCall
  | Alias
  | ParenthesisExpr;

export type SelectItem = StarExpr | Alias | Expression;

// 语句节点
export interface SelectStatement extends Node {
  type: 'select';
  columns: SelectItem[];
  from: TableRef | null;
  joins: Join[];
  where: Expression | null;
  groupBy: Expression[];
  having: Expression | null;
  orderBy: OrderBy[];
  limit: Limit | null;
}

export interface InsertStatement extends Node {
  type: 'insert';
  table: TableRef;
  columns: Identifier[] | null;
  values: Expression[][];
}

export interface UpdateStatement extends Node {
  type: 'update';
  table: TableRef;
  sets: SetClause[];
  where: Expression | null;
}

export interface DeleteStatement extends Node {
  type: 'delete';
  table: TableRef;
  where: Expression | null;
}

// 语句类型联合
export type Statement = 
  | SelectStatement
  | InsertStatement
  | UpdateStatement
  | DeleteStatement;
