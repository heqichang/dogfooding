import { parse, toSQL } from '../src/index';

// 示例 1: 基本解析
const sql1 = 'SELECT t.left FROM t';
const ast1 = parse(sql1);
console.log('Parsed AST:', JSON.stringify(ast1, null, 2));
console.log('Regenerated SQL:', toSQL(ast1));

// 示例 2: 复杂查询
const sql2 = `
  SELECT u.name, COUNT(o.id) as order_count
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE u.active = 1
  GROUP BY u.id
  HAVING order_count > 5
  ORDER BY order_count DESC
  LIMIT 10
`;
const ast2 = parse(sql2);
console.log('\nComplex Query SQL:', toSQL(ast2));
