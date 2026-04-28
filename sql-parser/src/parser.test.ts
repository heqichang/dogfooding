import { Parser } from './parser';
import {
  Expression,
  Literal,
  Identifier,
  ColumnRef,
  StarExpr,
  BinaryExpr,
  UnaryExpr,
  FunctionCall,
  ParenthesisExpr,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
  DeleteStatement,
  TableRef,
  Join,
  OrderBy,
  Limit,
  Alias,
  SetClause,
} from './ast';

describe('Parser', () => {
  describe('简单表达式', () => {
    it('应该正确解析 1 + 2 * 3（优先级正确）', () => {
      const parser = new Parser('1 + 2 * 3');
      const expr = parser.parseExpression() as BinaryExpr;

      expect(expr.type).toBe('binary_expr');
      expect(expr.operator).toBe('+');

      const left = expr.left as Literal;
      expect(left.type).toBe('literal');
      expect(left.value).toBe(1);

      const right = expr.right as BinaryExpr;
      expect(right.type).toBe('binary_expr');
      expect(right.operator).toBe('*');
      expect((right.left as Literal).value).toBe(2);
      expect((right.right as Literal).value).toBe(3);
    });
  });

  describe('括号', () => {
    it('应该正确解析 (1 + 2) * 3（括号改变优先级）', () => {
      const parser = new Parser('(1 + 2) * 3');
      const expr = parser.parseExpression() as BinaryExpr;

      expect(expr.type).toBe('binary_expr');
      expect(expr.operator).toBe('*');

      const left = expr.left as ParenthesisExpr;
      expect(left.type).toBe('parenthesis');

      const innerExpr = left.expr as BinaryExpr;
      expect(innerExpr.operator).toBe('+');
      expect((innerExpr.left as Literal).value).toBe(1);
      expect((innerExpr.right as Literal).value).toBe(2);

      expect((expr.right as Literal).value).toBe(3);
    });
  });

  describe('比较与逻辑', () => {
    it('应该正确解析 a > 10 AND b <= 20（AND 优先级低于比较）', () => {
      const parser = new Parser('a > 10 AND b <= 20');
      const expr = parser.parseExpression() as BinaryExpr;

      expect(expr.type).toBe('binary_expr');
      expect(expr.operator).toBe('AND');

      const leftComp = expr.left as BinaryExpr;
      expect(leftComp.operator).toBe('>');
      expect((leftComp.left as Identifier).name).toBe('a');
      expect((leftComp.right as Literal).value).toBe(10);

      const rightComp = expr.right as BinaryExpr;
      expect(rightComp.operator).toBe('<=');
      expect((rightComp.left as Identifier).name).toBe('b');
      expect((rightComp.right as Literal).value).toBe(20);
    });

    it('应该正确解析 a OR b AND c（AND 先于 OR）', () => {
      const parser = new Parser('a OR b AND c');
      const expr = parser.parseExpression() as BinaryExpr;

      expect(expr.type).toBe('binary_expr');
      expect(expr.operator).toBe('OR');
      expect((expr.left as Identifier).name).toBe('a');

      const rightExpr = expr.right as BinaryExpr;
      expect(rightExpr.operator).toBe('AND');
      expect((rightExpr.left as Identifier).name).toBe('b');
      expect((rightExpr.right as Identifier).name).toBe('c');
    });
  });

  describe('列引用', () => {
    it('应该正确解析 table.column', () => {
      const parser = new Parser('table.column');
      const expr = parser.parseExpression() as ColumnRef;

      expect(expr.type).toBe('column_ref');
      expect(expr.table).toBe('table');
      expect(expr.column).toBe('column');
    });

    it('应该正确解析简单标识符', () => {
      const parser = new Parser('myColumn');
      const expr = parser.parseExpression() as Identifier;

      expect(expr.type).toBe('identifier');
      expect(expr.name).toBe('myColumn');
    });
  });

  describe('函数调用', () => {
    it('应该正确解析 COUNT(*)', () => {
      const parser = new Parser('COUNT(*)');
      const expr = parser.parseExpression() as FunctionCall;

      expect(expr.type).toBe('function');
      expect(expr.name).toBe('COUNT');
      expect(expr.args).toHaveLength(1);

      const starArg = expr.args[0] as StarExpr;
      expect(starArg.type).toBe('star');
    });

    it('应该正确解析带多个参数的函数', () => {
      const parser = new Parser('CONCAT(a, b, c)');
      const expr = parser.parseExpression() as FunctionCall;

      expect(expr.type).toBe('function');
      expect(expr.name).toBe('CONCAT');
      expect(expr.args).toHaveLength(3);
      expect((expr.args[0] as Identifier).name).toBe('a');
      expect((expr.args[1] as Identifier).name).toBe('b');
      expect((expr.args[2] as Identifier).name).toBe('c');
    });
  });

  describe('字面量', () => {
    it('应该正确解析字符串', () => {
      const parser = new Parser("'hello'");
      const expr = parser.parseExpression() as Literal;

      expect(expr.type).toBe('literal');
      expect(expr.value).toBe('hello');
      expect(expr.valueType).toBe('string');
    });

    it('应该正确解析数字', () => {
      const parser = new Parser('123.45');
      const expr = parser.parseExpression() as Literal;

      expect(expr.type).toBe('literal');
      expect(expr.value).toBe(123.45);
      expect(expr.valueType).toBe('number');
    });

    it('应该正确解析布尔值', () => {
      const parserTrue = new Parser('TRUE');
      const exprTrue = parserTrue.parseExpression() as Literal;
      expect(exprTrue.value).toBe(true);
      expect(exprTrue.valueType).toBe('boolean');

      const parserFalse = new Parser('FALSE');
      const exprFalse = parserFalse.parseExpression() as Literal;
      expect(exprFalse.value).toBe(false);
      expect(exprFalse.valueType).toBe('boolean');
    });

    it('应该正确解析 NULL', () => {
      const parser = new Parser('NULL');
      const expr = parser.parseExpression() as Literal;

      expect(expr.type).toBe('literal');
      expect(expr.value).toBe(null);
      expect(expr.valueType).toBe('null');
    });
  });

  describe('特殊比较运算符', () => {
    it('应该正确解析 IS NULL', () => {
      const parser = new Parser('a IS NULL');
      const expr = parser.parseExpression() as UnaryExpr;

      expect(expr.type).toBe('unary_expr');
      expect(expr.operator).toBe('IS NULL');
      expect((expr.expr as Identifier).name).toBe('a');
    });

    it('应该正确解析 IS NOT NULL', () => {
      const parser = new Parser('a IS NOT NULL');
      const expr = parser.parseExpression() as UnaryExpr;

      expect(expr.type).toBe('unary_expr');
      expect(expr.operator).toBe('IS NOT NULL');
      expect((expr.expr as Identifier).name).toBe('a');
    });

    it('应该正确解析 BETWEEN', () => {
      const parser = new Parser('a BETWEEN 1 AND 10');
      const expr = parser.parseExpression() as BinaryExpr;

      expect(expr.type).toBe('binary_expr');
      expect(expr.operator).toBe('BETWEEN');
      expect((expr.left as Identifier).name).toBe('a');

      const range = expr.right as BinaryExpr;
      expect(range.operator).toBe('AND');
      expect((range.left as Literal).value).toBe(1);
      expect((range.right as Literal).value).toBe(10);
    });

    it('应该正确解析 NOT BETWEEN', () => {
      const parser = new Parser('a NOT BETWEEN 1 AND 10');
      const expr = parser.parseExpression() as BinaryExpr;

      expect(expr.type).toBe('binary_expr');
      expect(expr.operator).toBe('NOT BETWEEN');
    });

    it('应该正确解析 LIKE', () => {
      const parser = new Parser("name LIKE '%test%'");
      const expr = parser.parseExpression() as BinaryExpr;

      expect(expr.type).toBe('binary_expr');
      expect(expr.operator).toBe('LIKE');
      expect((expr.left as Identifier).name).toBe('name');
      expect((expr.right as Literal).value).toBe('%test%');
    });

    it('应该正确解析 NOT LIKE', () => {
      const parser = new Parser("name NOT LIKE '%test%'");
      const expr = parser.parseExpression() as BinaryExpr;

      expect(expr.type).toBe('binary_expr');
      expect(expr.operator).toBe('NOT LIKE');
    });

    it('应该正确解析 IN', () => {
      const parser = new Parser('a IN (1, 2, 3)');
      const expr = parser.parseExpression() as BinaryExpr;

      expect(expr.type).toBe('binary_expr');
      expect(expr.operator).toBe('IN');
      expect((expr.left as Identifier).name).toBe('a');
    });

    it('应该正确解析 NOT IN', () => {
      const parser = new Parser('a NOT IN (1, 2, 3)');
      const expr = parser.parseExpression() as BinaryExpr;

      expect(expr.type).toBe('binary_expr');
      expect(expr.operator).toBe('NOT IN');
    });
  });

  describe('一元运算符', () => {
    it('应该正确解析 -a', () => {
      const parser = new Parser('-a');
      const expr = parser.parseExpression() as UnaryExpr;

      expect(expr.type).toBe('unary_expr');
      expect(expr.operator).toBe('-');
      expect((expr.expr as Identifier).name).toBe('a');
    });

    it('应该正确解析 +a', () => {
      const parser = new Parser('+a');
      const expr = parser.parseExpression() as UnaryExpr;

      expect(expr.type).toBe('unary_expr');
      expect(expr.operator).toBe('+');
    });

    it('应该正确解析 NOT a', () => {
      const parser = new Parser('NOT a');
      const expr = parser.parseExpression() as UnaryExpr;

      expect(expr.type).toBe('unary_expr');
      expect(expr.operator).toBe('NOT');
    });
  });

  describe('StarExpr', () => {
    it('应该正确解析 *', () => {
      const parser = new Parser('*');
      const expr = parser.parseExpression() as StarExpr;

      expect(expr.type).toBe('star');
      expect(expr.table).toBeUndefined();
    });

    it('应该正确解析 table.*', () => {
      const parser = new Parser('table.*');
      const expr = parser.parseExpression() as StarExpr;

      expect(expr.type).toBe('star');
      expect(expr.table).toBe('table');
    });
  });

  describe('比较运算符', () => {
    it('应该正确解析 =', () => {
      const parser = new Parser('a = 1');
      const expr = parser.parseExpression() as BinaryExpr;
      expect(expr.operator).toBe('=');
    });

    it('应该正确解析 !=', () => {
      const parser = new Parser('a != 1');
      const expr = parser.parseExpression() as BinaryExpr;
      expect(expr.operator).toBe('!=');
    });

    it('应该正确解析 <>', () => {
      const parser = new Parser('a <> 1');
      const expr = parser.parseExpression() as BinaryExpr;
      expect(expr.operator).toBe('!=');
    });

    it('应该正确解析 <', () => {
      const parser = new Parser('a < 1');
      const expr = parser.parseExpression() as BinaryExpr;
      expect(expr.operator).toBe('<');
    });

    it('应该正确解析 <=', () => {
      const parser = new Parser('a <= 1');
      const expr = parser.parseExpression() as BinaryExpr;
      expect(expr.operator).toBe('<=');
    });

    it('应该正确解析 >', () => {
      const parser = new Parser('a > 1');
      const expr = parser.parseExpression() as BinaryExpr;
      expect(expr.operator).toBe('>');
    });

    it('应该正确解析 >=', () => {
      const parser = new Parser('a >= 1');
      const expr = parser.parseExpression() as BinaryExpr;
      expect(expr.operator).toBe('>=');
    });
  });

  describe('错误处理', () => {
    it('应该在语法错误时抛出包含位置信息的错误', () => {
      expect(() => {
        const parser = new Parser('1 + ');
        parser.parseExpression();
      }).toThrow(/Syntax error/);
    });

    it('应该在期望的 Token 缺失时抛出错误', () => {
      expect(() => {
        const parser = new Parser('(1 + 2');
        parser.parseExpression();
      }).toThrow(/Expected/);
    });
  });

  describe('SELECT 语句', () => {
    it('基本 SELECT: SELECT id, name FROM users', () => {
      const parser = new Parser('SELECT id, name FROM users');
      const stmt = parser.parse() as SelectStatement;

      expect(stmt.type).toBe('select');
      expect(stmt.columns).toHaveLength(2);
      expect((stmt.columns[0] as Identifier).name).toBe('id');
      expect((stmt.columns[1] as Identifier).name).toBe('name');
      expect(stmt.from).not.toBeNull();
      expect((stmt.from as TableRef).name).toBe('users');
    });

    it('SELECT *: SELECT * FROM t', () => {
      const parser = new Parser('SELECT * FROM t');
      const stmt = parser.parse() as SelectStatement;

      expect(stmt.columns).toHaveLength(1);
      expect(stmt.columns[0].type).toBe('star');
    });

    it('SELECT table.*: SELECT users.* FROM users', () => {
      const parser = new Parser('SELECT users.* FROM users');
      const stmt = parser.parse() as SelectStatement;

      expect(stmt.columns).toHaveLength(1);
      expect(stmt.columns[0].type).toBe('star');
      expect((stmt.columns[0] as StarExpr).table).toBe('users');
    });

    it('列别名: SELECT col AS alias FROM t', () => {
      const parser = new Parser('SELECT col AS alias FROM t');
      const stmt = parser.parse() as SelectStatement;

      expect(stmt.columns[0].type).toBe('alias');
      const alias = stmt.columns[0] as Alias;
      expect(alias.as).toBe('alias');
    });

    it('WHERE 条件: SELECT * FROM t WHERE a = 1', () => {
      const parser = new Parser('SELECT * FROM t WHERE a = 1');
      const stmt = parser.parse() as SelectStatement;

      expect(stmt.where).not.toBeNull();
      const where = stmt.where as BinaryExpr;
      expect(where.operator).toBe('=');
    });

    it('JOIN: SELECT * FROM a JOIN b ON a.id = b.id', () => {
      const parser = new Parser('SELECT * FROM a JOIN b ON a.id = b.id');
      const stmt = parser.parse() as SelectStatement;

      expect(stmt.joins).toHaveLength(1);
      expect(stmt.joins[0].joinType).toBe('inner');
    });

    it('LEFT JOIN: SELECT * FROM a LEFT JOIN b ON a.id = b.id', () => {
      const parser = new Parser('SELECT * FROM a LEFT JOIN b ON a.id = b.id');
      const stmt = parser.parse() as SelectStatement;

      expect(stmt.joins).toHaveLength(1);
      expect(stmt.joins[0].joinType).toBe('left');
    });

    it('GROUP BY + HAVING: SELECT count(*) FROM t GROUP BY id HAVING count(*) > 10', () => {
      const parser = new Parser('SELECT count(*) FROM t GROUP BY id HAVING count(*) > 10');
      const stmt = parser.parse() as SelectStatement;

      expect(stmt.groupBy).toHaveLength(1);
      expect(stmt.having).not.toBeNull();
    });

    it('ORDER BY: SELECT * FROM t ORDER BY x DESC, y ASC', () => {
      const parser = new Parser('SELECT * FROM t ORDER BY x DESC, y ASC');
      const stmt = parser.parse() as SelectStatement;

      expect(stmt.orderBy).toHaveLength(2);
      expect(stmt.orderBy[0].order).toBe('desc');
      expect(stmt.orderBy[1].order).toBe('asc');
    });

    it('LIMIT: SELECT * FROM t LIMIT 10', () => {
      const parser = new Parser('SELECT * FROM t LIMIT 10');
      const stmt = parser.parse() as SelectStatement;

      expect(stmt.limit).not.toBeNull();
      expect(stmt.limit?.count).toBe(10);
    });

    it('复杂查询: 所有子句组合', () => {
      const sql =
        "SELECT u.name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' GROUP BY u.id HAVING order_count > 5 ORDER BY order_count DESC LIMIT 10";
      const parser = new Parser(sql);
      const stmt = parser.parse() as SelectStatement;

      expect(stmt.type).toBe('select');
      expect(stmt.columns).toHaveLength(2);

      expect(stmt.from).not.toBeNull();
      expect((stmt.from as TableRef).name).toBe('users');
      expect((stmt.from as TableRef).alias).toBe('u');

      expect(stmt.joins).toHaveLength(1);
      expect(stmt.joins[0].joinType).toBe('left');
      expect(stmt.joins[0].table.name).toBe('orders');
      expect(stmt.joins[0].table.alias).toBe('o');

      expect(stmt.where).not.toBeNull();

      expect(stmt.groupBy).toHaveLength(1);

      expect(stmt.having).not.toBeNull();

      expect(stmt.orderBy).toHaveLength(1);
      expect(stmt.orderBy[0].order).toBe('desc');

      expect(stmt.limit).not.toBeNull();
      expect(stmt.limit?.count).toBe(10);
    });
  });

  describe('INSERT 语句', () => {
    it('基本 INSERT: INSERT INTO users (name, email) VALUES (\'Alice\', \'alice@example.com\')', () => {
      const parser = new Parser("INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')");
      const stmt = parser.parse() as InsertStatement;

      expect(stmt.type).toBe('insert');
      expect(stmt.table.name).toBe('users');
      expect(stmt.columns).not.toBeNull();
      expect(stmt.columns?.length).toBe(2);
      expect(stmt.values.length).toBe(1);
      expect(stmt.values[0].length).toBe(2);
    });

    it('INSERT 无列列表: INSERT INTO users VALUES (1, \'Bob\')', () => {
      const parser = new Parser("INSERT INTO users VALUES (1, 'Bob')");
      const stmt = parser.parse() as InsertStatement;

      expect(stmt.type).toBe('insert');
      expect(stmt.table.name).toBe('users');
      expect(stmt.columns).toBeNull();
      expect(stmt.values.length).toBe(1);
      expect(stmt.values[0].length).toBe(2);
    });

    it('INSERT 多行: INSERT INTO t VALUES (1), (2), (3)', () => {
      const parser = new Parser('INSERT INTO t VALUES (1), (2), (3)');
      const stmt = parser.parse() as InsertStatement;

      expect(stmt.type).toBe('insert');
      expect(stmt.values.length).toBe(3);
    });
  });

  describe('UPDATE 语句', () => {
    it('基本 UPDATE: UPDATE users SET status = \'active\' WHERE id = 1', () => {
      const parser = new Parser("UPDATE users SET status = 'active' WHERE id = 1");
      const stmt = parser.parse() as UpdateStatement;

      expect(stmt.type).toBe('update');
      expect(stmt.table.name).toBe('users');
      expect(stmt.sets.length).toBe(1);
      expect(stmt.sets[0].column).toBe('status');
      expect(stmt.where).not.toBeNull();
    });

    it('UPDATE 多列: UPDATE posts SET views = views + 1, status = \'published\'', () => {
      const parser = new Parser("UPDATE posts SET views = views + 1, status = 'published'");
      const stmt = parser.parse() as UpdateStatement;

      expect(stmt.type).toBe('update');
      expect(stmt.table.name).toBe('posts');
      expect(stmt.sets.length).toBe(2);
      expect(stmt.where).toBeNull();
    });
  });

  describe('DELETE 语句', () => {
    it('基本 DELETE: DELETE FROM logs WHERE id = 1', () => {
      const parser = new Parser('DELETE FROM logs WHERE id = 1');
      const stmt = parser.parse() as DeleteStatement;

      expect(stmt.type).toBe('delete');
      expect(stmt.table.name).toBe('logs');
      expect(stmt.where).not.toBeNull();
    });

    it('DELETE 无 WHERE: DELETE FROM temp', () => {
      const parser = new Parser('DELETE FROM temp');
      const stmt = parser.parse() as DeleteStatement;

      expect(stmt.type).toBe('delete');
      expect(stmt.table.name).toBe('temp');
      expect(stmt.where).toBeNull();
    });
  });
});
