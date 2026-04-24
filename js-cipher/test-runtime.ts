import { obfuscateSync } from './src/core/obfuscator';

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
const r = calculateSum(x, y);
console.log("Result:", r);
`;

console.log('=== 验证混淆后代码能否正确执行 ===\n');

// 先执行原始代码
console.log('--- 原始代码执行结果 ---');
eval(testCode);

// 测试 A: 变量重命名
console.log('\n--- 测试 A: 变量重命名后执行 ---');
try {
  const r = obfuscateSync(testCode, {
    variableRenaming: true, stringEncryption: false,
    controlFlowFlattening: false, deadCodeInjection: false, antiDebug: false
  });
  eval(r.code);
} catch (e: any) {
  console.error('BUG: 变量重命名后代码执行失败:', e.message);
}

// 测试 B: 字符串加密
console.log('\n--- 测试 B: 字符串加密后执行 ---');
try {
  const r = obfuscateSync(testCode, {
    variableRenaming: false, stringEncryption: true,
    controlFlowFlattening: false, deadCodeInjection: false, antiDebug: false
  });
  eval(r.code);
} catch (e: any) {
  console.error('BUG: 字符串加密后代码执行失败:', e.message);
}

// 测试 C: 控制流平坦化
console.log('\n--- 测试 C: 控制流平坦化后执行 ---');
try {
  const r = obfuscateSync(testCode, {
    variableRenaming: false, stringEncryption: false,
    controlFlowFlattening: true, deadCodeInjection: false, antiDebug: false
  });
  eval(r.code);
} catch (e: any) {
  console.error('BUG: 控制流平坦化后代码执行失败:', e.message);
}

// 测试 D: 死代码注入
console.log('\n--- 测试 D: 死代码注入后执行 ---');
try {
  const r = obfuscateSync(testCode, {
    variableRenaming: false, stringEncryption: false,
    controlFlowFlattening: false, deadCodeInjection: true, antiDebug: false
  });
  eval(r.code);
} catch (e: any) {
  console.error('BUG: 死代码注入后代码执行失败:', e.message);
}

// 测试 E: 变量重命名 + 字符串加密
console.log('\n--- 测试 E: 变量重命名 + 字符串加密后执行 ---');
try {
  const r = obfuscateSync(testCode, {
    variableRenaming: true, stringEncryption: true,
    controlFlowFlattening: false, deadCodeInjection: false, antiDebug: false
  });
  eval(r.code);
} catch (e: any) {
  console.error('BUG: 变量重命名+字符串加密后代码执行失败:', e.message);
}

// 测试 F: 全功能（不含反调试）
console.log('\n--- 测试 F: 全功能（不含反调试）后执行 ---');
try {
  const r = obfuscateSync(testCode, {
    variableRenaming: true, stringEncryption: true,
    controlFlowFlattening: true, deadCodeInjection: true, antiDebug: false
  });
  eval(r.code);
} catch (e: any) {
  console.error('BUG: 全功能混淆后代码执行失败:', e.message);
}

// 测试 G: Source Map 生成
console.log('\n--- 测试 G: Source Map 生成 ---');
import { obfuscate } from './src/core/obfuscator';
(async () => {
  try {
    const r = await obfuscate(testCode, {
      variableRenaming: true, stringEncryption: false,
      controlFlowFlattening: false, deadCodeInjection: false,
      antiDebug: false, sourceMap: true, sourceMapTarget: 'output.js'
    }, 'input.js');
    if (r.sourceMap) {
      console.log('✓ Source Map 生成成功');
      console.log('Source Map 内容:', JSON.stringify(r.sourceMap).substring(0, 200));
    } else {
      console.error('BUG: sourceMap 选项开启但未生成 Source Map');
    }
  } catch (e: any) {
    console.error('BUG: Source Map 生成失败:', e.message);
  }
})();
