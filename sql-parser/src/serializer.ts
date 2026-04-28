import {
  Node,
  Statement,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
  DeleteStatement,
  Expression,
  Identifier,
  Literal,
  ColumnRef,
  StarExpr,
  BinaryExpr,
  UnaryExpr,
  FunctionCall,
  Alias,
  ParenthesisExpr,
  TableRef,
  Join,
  OrderBy,
  Limit,
  SetClause,
} from './ast';

export function toSQL(node: Node | Statement | Expression): string {
  switch (node.type) {
    case 'select': return serializeSelect(node as SelectStatement);
    case 'insert': return serializeInsert(node as InsertStatement);
    case 'update': return serializeUpdate(node as UpdateStatement);
    case 'delete': return serializeDelete(node as DeleteStatement);
    case 'identifier': return serializeIdentifier(node as Identifier);
    case 'literal': return serializeLiteral(node as Literal);
    case 'column_ref': return serializeColumnRef(node as ColumnRef);
    case 'star': return serializeStar(node as StarExpr);
    case 'binary_expr': return serializeBinaryExpr(node as BinaryExpr);
    case 'unary_expr': return serializeUnaryExpr(node as UnaryExpr);
    case 'function': return serializeFunctionCall(node as FunctionCall);
    case 'alias': return serializeAlias(node as Alias);
    case 'parenthesis': return serializeParenthesis(node as ParenthesisExpr);
    case 'table_ref': return serializeTableRef(node as TableRef);
    case 'join': return serializeJoin(node as Join);
    case 'order_by': return serializeOrderBy(node as OrderBy);
    case 'limit': return serializeLimit(node as Limit);
    case 'set_clause': return serializeSetClause(node as SetClause);
    default:
      throw new Error(`Unknown node type: ${(node as Node).type}`);
  }
}

function serializeSelect(stmt: SelectStatement): string {
  const parts: string[] = ['SELECT'];
  
  parts.push(stmt.columns.map(col => toSQL(col)).join(', '));
  
  if (stmt.from) {
    parts.push('FROM');
    parts.push(toSQL(stmt.from));
  }
  
  for (const join of stmt.joins) {
    parts.push(toSQL(join));
  }
  
  if (stmt.where) {
    parts.push('WHERE');
    parts.push(toSQL(stmt.where));
  }
  
  if (stmt.groupBy.length > 0) {
    parts.push('GROUP BY');
    parts.push(stmt.groupBy.map(expr => toSQL(expr)).join(', '));
  }
  
  if (stmt.having) {
    parts.push('HAVING');
    parts.push(toSQL(stmt.having));
  }
  
  if (stmt.orderBy.length > 0) {
    parts.push('ORDER BY');
    parts.push(stmt.orderBy.map(ob => toSQL(ob)).join(', '));
  }
  
  if (stmt.limit) {
    parts.push('LIMIT');
    parts.push(toSQL(stmt.limit));
  }
  
  return parts.join(' ');
}

function serializeInsert(stmt: InsertStatement): string {
  const parts: string[] = ['INSERT INTO'];
  
  parts.push(toSQL(stmt.table));
  
  if (stmt.columns && stmt.columns.length > 0) {
    parts.push('(' + stmt.columns.map(col => toSQL(col)).join(', ') + ')');
  }
  
  parts.push('VALUES');
  
  const valueRows = stmt.values.map(row => {
    return '(' + row.map(val => toSQL(val)).join(', ') + ')';
  });
  parts.push(valueRows.join(', '));
  
  return parts.join(' ');
}

function serializeUpdate(stmt: UpdateStatement): string {
  const parts: string[] = ['UPDATE'];
  
  parts.push(toSQL(stmt.table));
  
  parts.push('SET');
  parts.push(stmt.sets.map(set => toSQL(set)).join(', '));
  
  if (stmt.where) {
    parts.push('WHERE');
    parts.push(toSQL(stmt.where));
  }
  
  return parts.join(' ');
}

function serializeDelete(stmt: DeleteStatement): string {
  const parts: string[] = ['DELETE FROM'];
  
  parts.push(toSQL(stmt.table));
  
  if (stmt.where) {
    parts.push('WHERE');
    parts.push(toSQL(stmt.where));
  }
  
  return parts.join(' ');
}

function serializeIdentifier(node: Identifier): string {
  return node.name;
}

function serializeLiteral(node: Literal): string {
  switch (node.valueType) {
    case 'string':
      const strValue = node.value as string;
      return `'${strValue.replace(/'/g, "''")}'`;
    case 'number':
      return String(node.value);
    case 'boolean':
      return (node.value as boolean) ? 'TRUE' : 'FALSE';
    case 'null':
      return 'NULL';
    default:
      throw new Error(`Unknown literal type: ${node.valueType}`);
  }
}

function serializeColumnRef(node: ColumnRef): string {
  if (node.table) {
    return `${node.table}.${node.column}`;
  }
  return node.column;
}

function serializeStar(node: StarExpr): string {
  if (node.table) {
    return `${node.table}.*`;
  }
  return '*';
}

function serializeBinaryExpr(node: BinaryExpr): string {
  let operator = node.operator;
  
  if (operator === 'BETWEEN' || operator === 'NOT BETWEEN') {
    const rightExpr = node.right as BinaryExpr;
    return `${toSQL(node.left)} ${operator} ${toSQL(rightExpr.left)} AND ${toSQL(rightExpr.right)}`;
  }
  
  if (operator === 'IN' || operator === 'NOT IN') {
    const rightExpr = node.right as ParenthesisExpr;
    const values = collectCommaSeparatedValues(rightExpr.expr);
    return `${toSQL(node.left)} ${operator} (${values.map(v => toSQL(v)).join(', ')})`;
  }
  
  if (operator === ',') {
    return `${toSQL(node.left)}, ${toSQL(node.right)}`;
  }
  
  return `${toSQL(node.left)} ${operator} ${toSQL(node.right)}`;
}

function collectCommaSeparatedValues(expr: Expression): Expression[] {
  const values: Expression[] = [];
  
  function collect(e: Expression): void {
    if (e.type === 'binary_expr' && (e as BinaryExpr).operator === ',') {
      const be = e as BinaryExpr;
      collect(be.left);
      collect(be.right);
    } else {
      values.push(e);
    }
  }
  
  collect(expr);
  return values;
}

function serializeUnaryExpr(node: UnaryExpr): string {
  if (node.operator === 'IS NULL' || node.operator === 'IS NOT NULL') {
    return `${toSQL(node.expr)} ${node.operator}`;
  }
  
  if (node.operator === '+' || node.operator === '-') {
    return `${node.operator}${toSQL(node.expr)}`;
  }
  
  return `${node.operator} ${toSQL(node.expr)}`;
}

function serializeFunctionCall(node: FunctionCall): string {
  const args = node.args.map(arg => toSQL(arg)).join(', ');
  return `${node.name}(${args})`;
}

function serializeAlias(node: Alias): string {
  if (node.as) {
    if (node.hasAs) {
      return `${toSQL(node.expr)} AS ${node.as}`;
    }
    return `${toSQL(node.expr)} ${node.as}`;
  }
  return toSQL(node.expr);
}

function serializeParenthesis(node: ParenthesisExpr): string {
  return `(${toSQL(node.expr)})`;
}

function serializeTableRef(node: TableRef): string {
  if (node.alias) {
    if (node.hasAs) {
      return `${node.name} AS ${node.alias}`;
    }
    return `${node.name} ${node.alias}`;
  }
  return node.name;
}

function serializeJoin(node: Join): string {
  const joinTypeMap: Record<string, string> = {
    'inner': 'INNER JOIN',
    'left': 'LEFT JOIN',
    'right': 'RIGHT JOIN',
  };
  
  const parts: string[] = [joinTypeMap[node.joinType] || 'JOIN'];
  parts.push(toSQL(node.table));
  parts.push('ON');
  parts.push(toSQL(node.on));
  
  return parts.join(' ');
}

function serializeOrderBy(node: OrderBy): string {
  const order = node.order.toUpperCase();
  return `${toSQL(node.expr)} ${order}`;
}

function serializeLimit(node: Limit): string {
  return String(node.count);
}

function serializeSetClause(node: SetClause): string {
  return `${node.column} = ${toSQL(node.value)}`;
}
