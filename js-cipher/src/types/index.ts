export interface ObfuscationOptions {
  variableRenaming: boolean;
  stringEncryption: boolean;
  controlFlowFlattening: boolean;
  deadCodeInjection: boolean;
  antiDebug: boolean;
  reservedIdentifiers: string[];
  sourceMap: boolean;
  sourceMapTarget?: string;
}

export interface StringDecryptionInfo {
  encrypted: string;
  key: number;
  iv: number;
}

export interface FlattenedNode {
  type: string;
  body: any[];
  caseValue: number;
}

export interface ObfuscationResult {
  code: string;
  sourceMap?: string;
}
