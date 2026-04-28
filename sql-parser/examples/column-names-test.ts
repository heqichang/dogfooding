import { parse, toSQL } from '../src/index';

const testCases = [
  'SELECT t.left FROM t',
  'SELECT t.right FROM t',
  'SELECT t.as FROM t',
  'SELECT t.and FROM t',
  'SELECT t.true FROM t',
  'SELECT t.false FROM t',
  'SELECT t.null FROM t',
  'SELECT t.is FROM t',
  'SELECT t.in FROM t',
  'SELECT t.like FROM t',
  'SELECT t.between FROM t',
  'SELECT t.not FROM t',
  'SELECT t.or FROM t',
  'SELECT t.on FROM t',
  'SELECT t.inner FROM t',
  'SELECT t.outer FROM t',
];

console.log('Testing column names that are keywords:\n');

for (const sql of testCases) {
  try {
    const ast = parse(sql);
    const result = toSQL(ast);
    console.log(`✅ ${sql}`);
    console.log(`   → ${result}`);
  } catch (e: any) {
    console.log(`❌ ${sql}`);
    console.log(`   → Error: ${e.message}`);
  }
  console.log();
}
