export { parse, generate, traverse, findNodes, replaceNodes, ASTNode, Visitor, Visitors } from './core/astVisitor';
export { Obfuscator, obfuscate, obfuscateSync } from './core/obfuscator';
export { ObfuscationOptions, StringDecryptionInfo, FlattenedNode, ObfuscationResult } from './types';

export { VariableRenamer, renameVariables } from './transforms/variableRenamer';
export { StringEncryptor, encryptStrings } from './transforms/stringEncryptor';
export { ControlFlowFlattener, flattenControlFlow } from './transforms/controlFlowFlattener';
export { DeadCodeInjector, injectDeadCode } from './transforms/deadCodeInjector';
export { AntiDebugger, addAntiDebug } from './transforms/antiDebugger';
export { SourceMapGenerator, generateSourceMap } from './transforms/sourceMapGenerator';
