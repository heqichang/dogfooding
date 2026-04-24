// 简单的测试脚本，用 ts-node 运行
import { obfuscateSync } from './src/core/obfuscator';

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
} catch (error: any) {
  console.error('❌ 测试 1 失败:', error.message);
  console.error('错误堆栈:', error.stack);
}

try {
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
} catch (error: any) {
  console.error('❌ 测试 2 失败:', error.message);
  console.error('错误堆栈:', error.stack);
}

try {
  // 测试 3: 保留特定标识符
  console.log('测试 3: 保留 console 和 calculateSum 标识符');
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
} catch (error: any) {
  console.error('❌ 测试 3 失败:', error.message);
  console.error('错误堆栈:', error.stack);
}

try {
  // 测试 4: 仅字符串加密
  console.log('测试 4: 仅字符串加密');
  const result4 = obfuscateSync(testCode, {
    variableRenaming: false,
    stringEncryption: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    antiDebug: false
  });
  console.log('✓ 混淆成功');
  console.log('混淆后代码:\n', result4.code);
  console.log('\n');
} catch (error: any) {
  console.error('❌ 测试 4 失败:', error.message);
  console.error('错误堆栈:', error.stack);
}

try {
  // 测试 5: 仅控制流平坦化
  console.log('测试 5: 仅控制流平坦化');
  const result5 = obfuscateSync(testCode, {
    variableRenaming: false,
    stringEncryption: false,
    controlFlowFlattening: true,
    deadCodeInjection: false,
    antiDebug: false
  });
  console.log('✓ 混淆成功');
  console.log('混淆后代码:\n', result5.code);
  console.log('\n');
} catch (error: any) {
  console.error('❌ 测试 5 失败:', error.message);
  console.error('错误堆栈:', error.stack);
}

try {
  // 测试 6: 仅死代码注入
  console.log('测试 6: 仅死代码注入');
  const result6 = obfuscateSync(testCode, {
    variableRenaming: false,
    stringEncryption: false,
    controlFlowFlattening: false,
    deadCodeInjection: true,
    antiDebug: false
  });
  console.log('✓ 混淆成功');
  console.log('混淆后代码:\n', result6.code);
  console.log('\n');
} catch (error: any) {
  console.error('❌ 测试 6 失败:', error.message);
  console.error('错误堆栈:', error.stack);
}

try {
  // 测试 7: 仅反调试
  console.log('测试 7: 仅反调试');
  const result7 = obfuscateSync(testCode, {
    variableRenaming: false,
    stringEncryption: false,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    antiDebug: true
  });
  console.log('✓ 混淆成功');
  console.log('混淆后代码:\n', result7.code);
  console.log('\n');
} catch (error: any) {
  console.error('❌ 测试 7 失败:', error.message);
  console.error('错误堆栈:', error.stack);
}

console.log('=== 所有测试完成 ===');
