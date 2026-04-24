import { parse, generate, ASTNode } from './astVisitor';
import { renameVariables } from '../transforms/variableRenamer';
import { encryptStrings } from '../transforms/stringEncryptor';
import { flattenControlFlow } from '../transforms/controlFlowFlattener';
import { injectDeadCode } from '../transforms/deadCodeInjector';
import { addAntiDebug } from '../transforms/antiDebugger';
import { generateSourceMap } from '../transforms/sourceMapGenerator';
import { ObfuscationOptions, ObfuscationResult } from '../types';

const DEFAULT_OPTIONS: ObfuscationOptions = {
  variableRenaming: true,
  stringEncryption: true,
  controlFlowFlattening: true,
  deadCodeInjection: true,
  antiDebug: false,
  reservedIdentifiers: [],
  sourceMap: false,
  sourceMapTarget: undefined
};

export class Obfuscator {
  private options: ObfuscationOptions;

  constructor(options: Partial<ObfuscationOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  private validateCode(code: string): void {
    if (!code || typeof code !== 'string') {
      throw new Error('Input code must be a non-empty string');
    }
  }

  private applyTransforms(ast: ASTNode, originalCode: string): ASTNode {
    let transformedAST = ast;

    if (this.options.variableRenaming) {
      transformedAST = renameVariables(transformedAST, this.options.reservedIdentifiers);
    }

    if (this.options.stringEncryption) {
      transformedAST = encryptStrings(transformedAST);
    }

    if (this.options.controlFlowFlattening) {
      transformedAST = flattenControlFlow(transformedAST);
    }

    if (this.options.deadCodeInjection) {
      transformedAST = injectDeadCode(transformedAST);
    }

    if (this.options.antiDebug) {
      transformedAST = addAntiDebug(transformedAST);
    }

    return transformedAST;
  }

  async obfuscate(code: string, sourceFileName: string = 'source.js'): Promise<ObfuscationResult> {
    this.validateCode(code);

    const ast = parse(code);
    const transformedAST = this.applyTransforms(ast, code);
    const obfuscatedCode = generate(transformedAST);

    const result: ObfuscationResult = {
      code: obfuscatedCode
    };

    if (this.options.sourceMap) {
      const targetFileName = this.options.sourceMapTarget || 'obfuscated.js';
      result.sourceMap = await generateSourceMap(
        code,
        obfuscatedCode,
        ast,
        sourceFileName,
        targetFileName
      );
    }

    return result;
  }

  obfuscateSync(code: string, sourceFileName: string = 'source.js'): ObfuscationResult {
    this.validateCode(code);

    const ast = parse(code);
    const transformedAST = this.applyTransforms(ast, code);
    const obfuscatedCode = generate(transformedAST);

    const result: ObfuscationResult = {
      code: obfuscatedCode
    };

    return result;
  }

  updateOptions(newOptions: Partial<ObfuscationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  getOptions(): ObfuscationOptions {
    return { ...this.options };
  }
}

export async function obfuscate(
  code: string,
  options: Partial<ObfuscationOptions> = {},
  sourceFileName: string = 'source.js'
): Promise<ObfuscationResult> {
  const obfuscator = new Obfuscator(options);
  return obfuscator.obfuscate(code, sourceFileName);
}

export function obfuscateSync(
  code: string,
  options: Partial<ObfuscationOptions> = {},
  sourceFileName: string = 'source.js'
): ObfuscationResult {
  const obfuscator = new Obfuscator(options);
  return obfuscator.obfuscateSync(code, sourceFileName);
}
