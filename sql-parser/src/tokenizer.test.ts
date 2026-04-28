import { Tokenizer } from './tokenizer';
import { TokenType, Token } from './token';

describe('Tokenizer', () => {
  describe('基本查询', () => {
    it('应该正确解析 SELECT * FROM t', () => {
      const tokenizer = new Tokenizer('SELECT * FROM t');
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(5);

      expect(tokens[0].type).toBe(TokenType.Select);
      expect(tokens[0].raw).toBe('SELECT');

      expect(tokens[1].type).toBe(TokenType.Star);

      expect(tokens[2].type).toBe(TokenType.From);
      expect(tokens[2].raw).toBe('FROM');

      expect(tokens[3].type).toBe(TokenType.Identifier);
      expect(tokens[3].value).toBe('t');

      expect(tokens[4].type).toBe(TokenType.EOF);
    });
  });

  describe('字符串字面量', () => {
    it("应该正确解析转义字符串 'Alice''s'", () => {
      const tokenizer = new Tokenizer("'Alice''s'");
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toBe("Alice's");
      expect(tokens[0].raw).toBe("'Alice''s'");
    });

    it('应该正确解析简单字符串', () => {
      const tokenizer = new Tokenizer("'hello'");
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toBe('hello');
    });

    it('未闭合的字符串应该抛出错误', () => {
      const tokenizer = new Tokenizer("SELECT 'test");
      expect(() => tokenizer.scan()).toThrow(/Unterminated string/);
    });
  });

  describe('数字字面量', () => {
    it('应该正确解析整数', () => {
      const tokenizer = new Tokenizer('123');
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(123);
    });

    it('应该正确解析浮点数 123.45', () => {
      const tokenizer = new Tokenizer('123.45');
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(123.45);
    });

    it('应该正确解析浮点数 .45', () => {
      const tokenizer = new Tokenizer('.45');
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(0.45);
    });

    it('应该正确解析科学计数法 1e10', () => {
      const tokenizer = new Tokenizer('1e10');
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(1e10);
    });

    it('应该正确解析科学计数法 1.5E-5', () => {
      const tokenizer = new Tokenizer('1.5E-5');
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(1.5e-5);
    });
  });

  describe('运算符', () => {
    it('应该正确解析 >= 运算符', () => {
      const tokenizer = new Tokenizer('price >= 100.5');
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(4);
      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[1].type).toBe(TokenType.Gte);
      expect(tokens[2].type).toBe(TokenType.Number);
      expect(tokens[2].value).toBe(100.5);
    });

    it('应该正确解析 <= 运算符', () => {
      const tokenizer = new Tokenizer('<=');
      const tokens = tokenizer.scan();
      expect(tokens[0].type).toBe(TokenType.Lte);
    });

    it('应该正确解析 <> 运算符', () => {
      const tokenizer = new Tokenizer('<>');
      const tokens = tokenizer.scan();
      expect(tokens[0].type).toBe(TokenType.Neq);
    });

    it('应该正确解析 != 运算符', () => {
      const tokenizer = new Tokenizer('!=');
      const tokens = tokenizer.scan();
      expect(tokens[0].type).toBe(TokenType.Neq);
    });

    it('应该正确解析 = 运算符', () => {
      const tokenizer = new Tokenizer('=');
      const tokens = tokenizer.scan();
      expect(tokens[0].type).toBe(TokenType.Eq);
    });

    it('应该正确解析 < 运算符', () => {
      const tokenizer = new Tokenizer('<');
      const tokens = tokenizer.scan();
      expect(tokens[0].type).toBe(TokenType.Lt);
    });

    it('应该正确解析 > 运算符', () => {
      const tokenizer = new Tokenizer('>');
      const tokens = tokenizer.scan();
      expect(tokens[0].type).toBe(TokenType.Gt);
    });

    it('应该正确解析所有算术运算符', () => {
      const tokenizer = new Tokenizer('+ - * / %');
      const tokens = tokenizer.scan();

      expect(tokens[0].type).toBe(TokenType.Plus);
      expect(tokens[1].type).toBe(TokenType.Minus);
      expect(tokens[2].type).toBe(TokenType.Star);
      expect(tokens[3].type).toBe(TokenType.Slash);
      expect(tokens[4].type).toBe(TokenType.Mod);
      expect(tokens[5].type).toBe(TokenType.EOF);
    });

    it('长运算符应该优先匹配', () => {
      const tokenizer = new Tokenizer('<= <');
      const tokens = tokenizer.scan();

      expect(tokens[0].type).toBe(TokenType.Lte);
      expect(tokens[1].type).toBe(TokenType.Lt);
    });
  });

  describe('标点符号', () => {
    it('应该正确解析所有标点符号', () => {
      const tokenizer = new Tokenizer('( ) , ; .');
      const tokens = tokenizer.scan();

      expect(tokens[0].type).toBe(TokenType.LParen);
      expect(tokens[1].type).toBe(TokenType.RParen);
      expect(tokens[2].type).toBe(TokenType.Comma);
      expect(tokens[3].type).toBe(TokenType.Semicolon);
      expect(tokens[4].type).toBe(TokenType.Dot);
      expect(tokens[5].type).toBe(TokenType.EOF);
    });
  });

  describe('标识符', () => {
    it('应该正确解析以字母开头的标识符', () => {
      const tokenizer = new Tokenizer('myTable');
      const tokens = tokenizer.scan();
      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('myTable');
    });

    it('应该正确解析以下划线开头的标识符', () => {
      const tokenizer = new Tokenizer('_private');
      const tokens = tokenizer.scan();
      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('_private');
    });

    it('应该正确解析以 @ 开头的标识符', () => {
      const tokenizer = new Tokenizer('@variable');
      const tokens = tokenizer.scan();
      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('@variable');
    });

    it('应该正确解析包含数字和特殊字符的标识符', () => {
      const tokenizer = new Tokenizer('col$1#name');
      const tokens = tokenizer.scan();
      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('col$1#name');
    });
  });

  describe('关键字', () => {
    it('应该正确识别关键字（大小写不敏感）', () => {
      const tokenizer = new Tokenizer('select FROM WHere');
      const tokens = tokenizer.scan();

      expect(tokens[0].type).toBe(TokenType.Select);
      expect(tokens[1].type).toBe(TokenType.From);
      expect(tokens[2].type).toBe(TokenType.Where);
    });

    it('所有关键字应该正确识别', () => {
      const keywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE',
                        'JOIN', 'LEFT', 'RIGHT', 'INNER', 'ON', 'GROUP', 'BY',
                        'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'VALUES',
                        'SET', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE',
                        'IS', 'BETWEEN', 'LIKE', 'IN'];

      for (const keyword of keywords) {
        const tokenizer = new Tokenizer(keyword);
        const tokens = tokenizer.scan();
        expect(tokens[0].type).not.toBe(TokenType.Identifier);
        expect(tokens[0].raw).toBe(keyword);
      }
    });
  });

  describe('注释与空白', () => {
    it('应该跳过空格和制表符', () => {
      const tokenizer = new Tokenizer('  \tSELECT  \t*  ');
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe(TokenType.Select);
      expect(tokens[1].type).toBe(TokenType.Star);
      expect(tokens[2].type).toBe(TokenType.EOF);
    });

    it('应该跳过换行符', () => {
      const tokenizer = new Tokenizer('SELECT\n*\nFROM\nt');
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(5);
      expect(tokens[0].type).toBe(TokenType.Select);
      expect(tokens[1].type).toBe(TokenType.Star);
      expect(tokens[2].type).toBe(TokenType.From);
      expect(tokens[3].type).toBe(TokenType.Identifier);
      expect(tokens[4].type).toBe(TokenType.EOF);
    });

    it('应该跳过行注释', () => {
      const tokenizer = new Tokenizer('SELECT -- this is a comment\n* FROM t');
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(5);
      expect(tokens[0].type).toBe(TokenType.Select);
      expect(tokens[1].type).toBe(TokenType.Star);
      expect(tokens[2].type).toBe(TokenType.From);
      expect(tokens[3].type).toBe(TokenType.Identifier);
      expect(tokens[4].type).toBe(TokenType.EOF);
    });

    it('应该跳过行尾的行注释', () => {
      const tokenizer = new Tokenizer('SELECT * FROM t -- comment');
      const tokens = tokenizer.scan();

      expect(tokens).toHaveLength(5);
      expect(tokens[0].type).toBe(TokenType.Select);
      expect(tokens[1].type).toBe(TokenType.Star);
      expect(tokens[2].type).toBe(TokenType.From);
      expect(tokens[3].type).toBe(TokenType.Identifier);
      expect(tokens[4].type).toBe(TokenType.EOF);
    });
  });

  describe('位置信息', () => {
    it('应该正确记录 Token 位置', () => {
      const tokenizer = new Tokenizer('SELECT\n  * FROM t');
      const tokens = tokenizer.scan();

      expect(tokens[0].position.line).toBe(1);
      expect(tokens[0].position.column).toBe(1);
      expect(tokens[0].position.offset).toBe(0);

      expect(tokens[1].position.line).toBe(2);
      expect(tokens[1].position.column).toBe(3);
    });
  });

  describe('错误处理', () => {
    it('遇到无法识别的字符时应该抛出错误', () => {
      const tokenizer = new Tokenizer('SELECT ~ 1');
      expect(() => tokenizer.scan()).toThrow();
      expect(() => tokenizer.scan()).toThrow(/Unexpected character/);
    });

    it('错误信息应该包含位置信息', () => {
      const tokenizer = new Tokenizer('~');
      try {
        tokenizer.scan();
        fail('应该抛出错误');
      } catch (e) {
        const error = e as Error;
        expect(error.message).toContain('line 1');
        expect(error.message).toContain('column 1');
      }
    });
  });

  describe('复杂查询', () => {
    it('应该正确解析复杂的 SELECT 语句', () => {
      const sql = `
        SELECT id, name, price * 1.1 AS new_price
        FROM products
        WHERE price >= 100 AND category = 'electronics'
        ORDER BY name ASC
        LIMIT 10
      `;
      const tokenizer = new Tokenizer(sql);
      const tokens = tokenizer.scan();

      expect(tokens[0].type).toBe(TokenType.Select);

      const tokenTypes = tokens.slice(0, -1).map(t => t.type);
      expect(tokenTypes).toContain(TokenType.From);
      expect(tokenTypes).toContain(TokenType.Where);
      expect(tokenTypes).toContain(TokenType.Gte);
      expect(tokenTypes).toContain(TokenType.And);
      expect(tokenTypes).toContain(TokenType.Order);
      expect(tokenTypes).toContain(TokenType.By);
      expect(tokenTypes).toContain(TokenType.Asc);
      expect(tokenTypes).toContain(TokenType.Limit);
    });
  });
});
