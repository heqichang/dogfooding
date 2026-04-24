#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { obfuscate, ObfuscationOptions } from './index';

interface CliArguments {
  input: string;
  output: string;
  options: ObfuscationOptions;
}

const defaultOptions: ObfuscationOptions = {
  variableRenaming: true,
  stringEncryption: true,
  controlFlowFlattening: true,
  deadCodeInjection: true,
  antiDebug: false,
  reservedIdentifiers: [],
  sourceMap: false,
  sourceMapTarget: undefined,
};

function parseArgs(args: string[]): CliArguments {
  let input: string | undefined;
  let output: string | undefined;
  const options: Partial<ObfuscationOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--input':
      case '-i':
        input = args[++i];
        break;
      case '--output':
      case '-o':
        output = args[++i];
        break;
      case '--no-rename':
      case '--no-variable-renaming':
        options.variableRenaming = false;
        break;
      case '--no-encrypt':
      case '--no-string-encryption':
        options.stringEncryption = false;
        break;
      case '--no-flatten':
      case '--no-control-flow-flattening':
        options.controlFlowFlattening = false;
        break;
      case '--no-dead-code':
      case '--no-dead-code-injection':
        options.deadCodeInjection = false;
        break;
      case '--anti-debug':
        options.antiDebug = true;
        break;
      case '--reserved':
      case '-r':
        options.reservedIdentifiers = args[++i].split(',').map(s => s.trim());
        break;
      case '--source-map':
        options.sourceMap = true;
        options.sourceMapTarget = args[++i];
        break;
      default:
        if (!input && !arg.startsWith('-')) {
          input = arg;
        }
        break;
    }
  }

  if (!input) {
    console.error('Error: Input file is required');
    printHelp();
    process.exit(1);
  }

  return {
    input,
    output: output || input.replace(/\.js$/, '.obfuscated.js'),
    options: { ...defaultOptions, ...options } as ObfuscationOptions,
  };
}

function printHelp(): void {
  console.log(`
JS-Cipher - JavaScript Code Obfuscation Tool

Usage: js-cipher [options] <input-file>

Options:
  -i, --input <file>           Input JavaScript file
  -o, --output <file>          Output file (default: <input>.obfuscated.js)
  
  --no-rename, --no-variable-renaming   Disable variable renaming
  --no-encrypt, --no-string-encryption  Disable string encryption
  --no-flatten, --no-control-flow-flattening  Disable control flow flattening
  --no-dead-code, --no-dead-code-injection   Disable dead code injection
  --anti-debug                 Enable anti-debugging protection
  -r, --reserved <identifiers> Comma-separated list of identifiers to preserve
  --source-map <target-file>   Generate source map with specified target filename

Examples:
  js-cipher input.js
  js-cipher -i src/app.js -o dist/app.min.js
  js-cipher input.js --anti-debug -r console,require
  js-cipher input.js --source-map app.js.map
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    const pkgPath = resolve(__dirname, '../package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      console.log(`JS-Cipher v${pkg.version}`);
    } else {
      console.log('JS-Cipher');
    }
    return;
  }

  try {
    const { input, output, options } = parseArgs(args);
    
    const inputPath = resolve(input);
    if (!existsSync(inputPath)) {
      console.error(`Error: Input file not found: ${inputPath}`);
      process.exit(1);
    }

    const sourceCode = readFileSync(inputPath, 'utf-8');
    
    console.log('Obfuscating...');
    console.log('Options:', JSON.stringify(options, null, 2));

    const result = await obfuscate(sourceCode, options);

    const outputPath = resolve(output);
    writeFileSync(outputPath, result.code, 'utf-8');
    console.log(`✓ Output written to: ${outputPath}`);

    if (result.sourceMap && options.sourceMapTarget) {
      const mapPath = resolve(options.sourceMapTarget);
      writeFileSync(mapPath, result.sourceMap, 'utf-8');
      console.log(`✓ Source map written to: ${mapPath}`);
    }

    console.log('✅ Obfuscation completed successfully!');
    console.log(`   Original size: ${sourceCode.length} bytes`);
    console.log(`   Obfuscated size: ${result.code.length} bytes`);

  } catch (error: any) {
    console.error('Error:', error.message || error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
