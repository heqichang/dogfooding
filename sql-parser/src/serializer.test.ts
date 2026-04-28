import { Parser } from './parser';
import { toSQL } from './serializer';

describe('Serializer', () => {
  function roundTrip(sql: string): string {
    const parser1 = new Parser(sql);
    const ast = parser1.parse();
    const serialized = toSQL(ast);
    const parser2 = new Parser(serialized);
    parser2.parse();
    return serialized;
  }

  describe('Round-trip 测试', () => {
    it('SELECT id, name FROM users', () => {
      const sql = 'SELECT id, name FROM users';
      const serialized = roundTrip(sql);
      expect(serialized).toBe(sql);
    });

    it('SELECT * FROM t WHERE a = 1', () => {
      const sql = 'SELECT * FROM t WHERE a = 1';
      const serialized = roundTrip(sql);
      expect(serialized).toBe(sql);
    });
  });

  describe('字符串转义', () => {
    it("SELECT 'O''Neil' 应该正确序列化", () => {
      const sql = "SELECT 'O''Neil'";
      const parser = new Parser(sql);
      const ast = parser.parse();
      const serialized = toSQL(ast);
      expect(serialized).toBe("SELECT 'O''Neil'");
    });

    it("普通字符串 SELECT 'hello' 应该正确序列化", () => {
      const sql = "SELECT 'hello'";
      const serialized = roundTrip(sql);
      expect(serialized).toBe(sql);
    });
  });

  describe('JOIN 类型', () => {
    it('INNER JOIN 正确输出', () => {
      const sql = 'SELECT * FROM a INNER JOIN b ON a.id = b.id';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('INNER JOIN');
    });

    it('LEFT JOIN 正确输出', () => {
      const sql = 'SELECT * FROM a LEFT JOIN b ON a.id = b.id';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('LEFT JOIN');
    });

    it('RIGHT JOIN 正确输出', () => {
      const sql = 'SELECT * FROM a RIGHT JOIN b ON a.id = b.id';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('RIGHT JOIN');
    });
  });

  describe('ORDER BY', () => {
    it('ORDER BY x DESC, y ASC 中的 DESC 和 ASC 正确输出', () => {
      const sql = 'SELECT * FROM t ORDER BY x DESC, y ASC';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('DESC');
      expect(serialized).toContain('ASC');
    });

    it('默认 ORDER BY x 应该输出 ASC', () => {
      const sql = 'SELECT * FROM t ORDER BY x';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('ASC');
    });
  });

  describe('括号保留', () => {
    it('SELECT (a + b) * c 序列化后括号应保留', () => {
      const sql = 'SELECT (a + b) * c';
      const parser = new Parser(sql);
      const ast = parser.parse();
      const serialized = toSQL(ast);
      expect(serialized).toContain('(');
      expect(serialized).toContain(')');
      expect(serialized).toContain('(a + b) * c');
    });

    it('SELECT a + (b * c) 序列化后括号应保留', () => {
      const sql = 'SELECT a + (b * c)';
      const parser = new Parser(sql);
      const ast = parser.parse();
      const serialized = toSQL(ast);
      expect(serialized).toContain('(b * c)');
    });
  });

  describe('INSERT 多行', () => {
    it('INSERT INTO t VALUES (1), (2) 正确序列化', () => {
      const sql = 'INSERT INTO t VALUES (1), (2)';
      const serialized = roundTrip(sql);
      expect(serialized).toBe(sql);
    });

    it('INSERT INTO t (a, b) VALUES (1, 2), (3, 4) 正确序列化', () => {
      const sql = 'INSERT INTO t (a, b) VALUES (1, 2), (3, 4)';
      const serialized = roundTrip(sql);
      expect(serialized).toBe(sql);
    });
  });

  describe('UPDATE 多列', () => {
    it('UPDATE t SET a = 1, b = 2 正确序列化', () => {
      const sql = 'UPDATE t SET a = 1, b = 2';
      const serialized = roundTrip(sql);
      expect(serialized).toBe(sql);
    });

    it('UPDATE t SET a = 1, b = 2 WHERE id = 1 正确序列化', () => {
      const sql = 'UPDATE t SET a = 1, b = 2 WHERE id = 1';
      const serialized = roundTrip(sql);
      expect(serialized).toBe(sql);
    });
  });

  describe('DELETE', () => {
    it('DELETE FROM t WHERE id = 1 正确序列化', () => {
      const sql = 'DELETE FROM t WHERE id = 1';
      const serialized = roundTrip(sql);
      expect(serialized).toBe(sql);
    });

    it('DELETE FROM t 正确序列化（无 WHERE）', () => {
      const sql = 'DELETE FROM t';
      const serialized = roundTrip(sql);
      expect(serialized).toBe(sql);
    });
  });

  describe('字面量类型', () => {
    it('数字字面量正确序列化', () => {
      const sql = 'SELECT 123, 45.67';
      const serialized = roundTrip(sql);
      expect(serialized).toBe(sql);
    });

    it('布尔字面量正确序列化', () => {
      const sql = 'SELECT TRUE, FALSE';
      const serialized = roundTrip(sql);
      expect(serialized).toBe(sql);
    });

    it('NULL 字面量正确序列化', () => {
      const sql = 'SELECT NULL';
      const serialized = roundTrip(sql);
      expect(serialized).toBe(sql);
    });
  });

  describe('一元运算符', () => {
    it('IS NULL 正确序列化', () => {
      const sql = 'SELECT * FROM t WHERE a IS NULL';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('IS NULL');
    });

    it('IS NOT NULL 正确序列化', () => {
      const sql = 'SELECT * FROM t WHERE a IS NOT NULL';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('IS NOT NULL');
    });

    it('NOT 运算符正确序列化', () => {
      const sql = 'SELECT * FROM t WHERE NOT a = 1';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('NOT');
    });

    it('负号运算符正确序列化', () => {
      const sql = 'SELECT -a';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('-a');
    });
  });

  describe('特殊比较运算符', () => {
    it('BETWEEN 正确序列化', () => {
      const sql = 'SELECT * FROM t WHERE a BETWEEN 1 AND 10';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('BETWEEN');
      expect(serialized).toContain('1 AND 10');
    });

    it('NOT BETWEEN 正确序列化', () => {
      const sql = 'SELECT * FROM t WHERE a NOT BETWEEN 1 AND 10';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('NOT BETWEEN');
    });

    it('IN 正确序列化（单个值）', () => {
      const sql = 'SELECT * FROM t WHERE a IN (1)';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('IN (1)');
    });

    it('IN 正确序列化（多个值）', () => {
      const sql = 'SELECT * FROM t WHERE a IN (1, 2, 3)';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('IN (1, 2, 3)');
    });

    it('NOT IN 正确序列化', () => {
      const sql = 'SELECT * FROM t WHERE a NOT IN (1, 2, 3)';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('NOT IN (1, 2, 3)');
    });

    it('LIKE 正确序列化', () => {
      const sql = "SELECT * FROM t WHERE name LIKE '%test%'";
      const serialized = roundTrip(sql);
      expect(serialized).toContain('LIKE');
    });

    it('NOT LIKE 正确序列化', () => {
      const sql = "SELECT * FROM t WHERE name NOT LIKE '%test%'";
      const serialized = roundTrip(sql);
      expect(serialized).toContain('NOT LIKE');
    });
  });

  describe('函数调用', () => {
    it('COUNT(*) 正确序列化', () => {
      const sql = 'SELECT COUNT(*) FROM t';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('COUNT(*)');
    });

    it('带参数的函数正确序列化', () => {
      const sql = 'SELECT CONCAT(a, b, c) FROM t';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('CONCAT(a, b, c)');
    });
  });

  describe('别名', () => {
    it('列别名正确序列化', () => {
      const sql = 'SELECT col AS alias FROM t';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('AS alias');
    });

    it('表别名正确序列化', () => {
      const sql = 'SELECT * FROM users u';
      const serialized = roundTrip(sql);
      expect(serialized).toContain('users u');
    });
  });

  describe('复杂查询', () => {
    it('完整 SELECT 语句正确序列化', () => {
      const sql = "SELECT u.name, COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' GROUP BY u.id HAVING COUNT(o.id) > 5 ORDER BY order_count DESC LIMIT 10";
      const serialized = roundTrip(sql);
      
      expect(serialized).toContain('SELECT');
      expect(serialized).toContain('FROM');
      expect(serialized).toContain('LEFT JOIN');
      expect(serialized).toContain('WHERE');
      expect(serialized).toContain('GROUP BY');
      expect(serialized).toContain('HAVING');
      expect(serialized).toContain('ORDER BY');
      expect(serialized).toContain('LIMIT');
    });
  });
});
