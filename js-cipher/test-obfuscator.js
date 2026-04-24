// 简单的测试脚本，用 ts-node 运行
const { obfuscateSync } = require('./src/core/obfuscator');

// 测试代码
const testCode = `
function calculateSum(firstNumber, secondNumber) {
  const result = firstNumber + secondNumber;
  const message = "The sum is: ";
  console.log(message + result);

  if (result > 100) {
    console.log("Large number!");
  } else {
    console.log("Small number!");
  }

  return result;
}

const x = 10;
const y = 20;
calculateSum(x, y);
`;

console.log('=== 原始代码 ===');
console.log(testCode);
console.log('\n=== 开始混淆测试 ===\n');

try {
  // 测试 1: 所有功能开启
  console.log('测试 1: 所有功能开启');
  const result1 = obfuscateSync(testCode, {
    variableRenaming: true,
    stringEncryption: true,
    controlFlowFlattening: true,
    deadCodeInjection: true,
    antiDebug: true,
    reservedIdentifiers: [],
    sourceMap: false
  });
  console.log('✓ 混淆成功');
  console.log('混淆后代码长度:', result1.code.length);
  console.log('混淆后代码预览 (前 500 字符):');
  console.log(result1.code.substring(0, 500));
  console.log('\n');

  // 测试 2: 仅变量重命名
  console.log('测试 2: 仅变量重命名');
  const result2 = obfuscateSync(testCode, {
    variableRenaming: true,
    stringEncryption: false,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    antiDebug: false
  });
  console.log('✓ 混淆成功');
  console.log('混淆后代码:\n', result2.code);
  console.log('\n');

  // 测试 3: 保留特定标识符
  console.log('测试 3: 保留 console 标识符');
  const result3 = obfuscateSync(testCode, {
    variableRenaming: true,
    stringEncryption: false,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    antiDebug: false,
    reservedIdentifiers: ['console', 'calculateSum']
  });
  console.log('✓ 混淆成功');
  console.log('混淆后代码:\n', result3.code);
  console.log('\n');

  console.log('=== 所有测试完成 ===');
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  console.error('错误堆栈:', error.stack);
  process.exit(1);
}
