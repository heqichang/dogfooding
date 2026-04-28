import { parse, toSQL } from './index';

describe('SQL Parser - Integration Tests', () => {
  describe('AC-1: 基本 SELECT 解析与生成', () => {
    test('SELECT id, name FROM users', () => {
      const sql = 'SELECT id, name FROM users';
      const ast = parse(sql);
      const regenerated = toSQL(ast);
      
      // 验证包含关键部分
      expect(regenerated).toContain('SELECT');
      expect(regenerated).toContain('id');
      expect(regenerated).toContain('name');
      expect(regenerated).toContain('FROM');
      expect(regenerated).toContain('users');
      
      // Round-trip 测试
      const ast2 = parse(regenerated);
      expect(ast2.type).toBe('select');
    });
  });

  describe('AC-2: 带 WHERE 和 ORDER BY 的 SELECT', () => {
    test('SELECT * FROM products WHERE price > 100 ORDER BY created_at DESC', () => {
      const sql = 'SELECT * FROM products WHERE price > 100 ORDER BY created_at DESC';
      const ast = parse(sql) as any;
      
      // 验证 WHERE
      expect(ast.where).not.toBeNull();
      expect(ast.where?.type).toBe('binary_expr');
      
      // 验证 ORDER BY
      expect(ast.orderBy.length).toBe(1);
      expect(ast.orderBy[0].order).toBe('desc');
    });
  });

  describe('AC-3: JOIN 支持', () => {
    test('SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id', () => {
      const sql = 'SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id';
      const ast = parse(sql) as any;
      
      // 验证别名
      expect(ast.from?.alias).toBe('u');
      
      // 验证 JOIN
      expect(ast.joins.length).toBe(1);
      expect(ast.joins[0].joinType).toBe('inner');
      expect(ast.joins[0].table.alias).toBe('o');
      expect(ast.joins[0].on).not.toBeNull();
    });
  });

  describe('AC-4: GROUP BY 和 LIMIT', () => {
    test('SELECT category, COUNT(*) as cnt FROM items GROUP BY category HAVING cnt > 5 LIMIT 10', () => {
      const sql = 'SELECT category, COUNT(*) as cnt FROM items GROUP BY category HAVING cnt > 5 LIMIT 10';
      const ast = parse(sql) as any;
      
      // 验证 GROUP BY
      expect(ast.groupBy.length).toBe(1);
      
      // 验证 HAVING
      expect(ast.having).not.toBeNull();
      
      // 验证 LIMIT
      expect(ast.limit).not.toBeNull();
      expect(ast.limit.count).toBe(10);
    });
  });

  describe('AC-5: INSERT 语句解析', () => {
    test("INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')", () => {
      const sql = "INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')";
      const ast = parse(sql);
      const regenerated = toSQL(ast);
      
      expect(ast.type).toBe('insert');
      expect(regenerated).toContain('INSERT INTO');
      expect(regenerated).toContain('VALUES');
    });
  });

  describe('AC-6: UPDATE 语句解析', () => {
    test("UPDATE posts SET status = 'published', views = views + 1 WHERE id = 1", () => {
      const sql = "UPDATE posts SET status = 'published', views = views + 1 WHERE id = 1";
      const ast = parse(sql) as any;
      
      expect(ast.type).toBe('update');
      expect(ast.sets.length).toBe(2);
      expect(ast.where).not.toBeNull();
    });
  });

  describe('AC-7: DELETE 语句解析', () => {
    test("DELETE FROM logs WHERE created_at < '2023-01-01'", () => {
      const sql = "DELETE FROM logs WHERE created_at < '2023-01-01'";
      const ast = parse(sql) as any;
      
      expect(ast.type).toBe('delete');
      expect(ast.table.name).toBe('logs');
      expect(ast.where).not.toBeNull();
    });
  });

  describe('AC-8: 词法分析错误处理', () => {
    test('未闭合字符串应抛出错误', () => {
      expect(() => {
        parse("SELECT 'unclosed");
      }).toThrow();
    });

    test('无效语法应抛出错误', () => {
      expect(() => {
        parse('INVALID SQL STATEMENT');
      }).toThrow();
    });
  });
});
