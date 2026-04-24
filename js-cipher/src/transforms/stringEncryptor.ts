import { ASTNode, traverse, parse } from '../core/astVisitor';

interface EncryptedString {
  original: string;
  encrypted: string;
  key: number;
}

export class StringEncryptor {
  private encryptedStrings: EncryptedString[] = [];
  private decryptorName: string;
  private stringsArrayName: string;
  private key: number;

  constructor(key?: number) {
    this.key = key || Math.floor(Math.random() * 255) + 1;
    this.decryptorName = this.generateRandomName();
    this.stringsArrayName = this.generateRandomName();
  }

  private generateRandomName(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
    const length = Math.floor(Math.random() * 5) + 5;
    let name = '';
    for (let i = 0; i < length; i++) {
      name += chars[Math.floor(Math.random() * chars.length)];
    }
    return name;
  }

  private xorEncrypt(str: string, key: number): string {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ (key + i) % 256);
    }
    return result;
  }

  private encryptString(str: string): EncryptedString {
    const key = this.key + this.encryptedStrings.length;
    const encrypted = this.xorEncrypt(str, key);
    const encryptedStr: EncryptedString = {
      original: str,
      encrypted,
      key
    };
    this.encryptedStrings.push(encryptedStr);
    return encryptedStr;
  }

  private createDecryptorFunction(): ASTNode {
    const decryptorCode = `
      function ${this.decryptorName}(idx, key) {
        var str = ${this.stringsArrayName}[idx];
        var result = '';
        for (var i = 0; i < str.length; i++) {
          result += String.fromCharCode(str.charCodeAt(i) ^ (key + i) % 256);
        }
        return result;
      }
    `;
    const acorn = require('acorn');
    const ast = acorn.parse(decryptorCode, {
      ecmaVersion: 2020,
      sourceType: 'script'
    });
    return ast.body[0] as ASTNode;
  }

  private createStringsArray(): ASTNode {
    const encryptedStrings = this.encryptedStrings.map(s => JSON.stringify(s.encrypted));
    const arrayCode = `var ${this.stringsArrayName} = [${encryptedStrings.join(',')}];`;
    const acorn = require('acorn');
    const ast = acorn.parse(arrayCode, {
      ecmaVersion: 2020,
      sourceType: 'script'
    });
    return ast.body[0] as ASTNode;
  }

  private createDecryptCall(index: number, key: number): ASTNode {
    return {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: this.decryptorName
      },
      arguments: [
        {
          type: 'Literal',
          value: index,
          raw: index.toString()
        },
        {
          type: 'Literal',
          value: key,
          raw: key.toString()
        }
      ],
      optional: false
    };
  }

  private isDebuggerRelated(node: ASTNode): boolean {
    if (node.type === 'Literal' && typeof node.value === 'string') {
      const str = node.value.toLowerCase();
      if (str.includes('debugger') || str.includes('console')) {
        return true;
      }
    }
    return false;
  }

  private isShortString(str: string): boolean {
    return str.length <= 2;
  }

  encrypt(ast: ASTNode): ASTNode {
    this.encryptedStrings = [];
    let stringIndex = 0;

    const transformedAST = traverse(ast, {
      enter: (node) => {
        if (
          node.type === 'Literal' && 
          typeof node.value === 'string' &&
          !this.isDebuggerRelated(node) &&
          !this.isShortString(node.value)
        ) {
          const encrypted = this.encryptString(node.value);
          const currentIndex = stringIndex++;
          return this.createDecryptCall(currentIndex, encrypted.key);
        }

        if (
          node.type === 'TemplateLiteral' && 
          node.quasis && 
          node.quasis.length === 1 &&
          !node.expressions.length
        ) {
          const quasis = node.quasis[0];
          const str = quasis.value.raw;
          if (str && !this.isShortString(str)) {
            const encrypted = this.encryptString(str);
            const currentIndex = stringIndex++;
            return this.createDecryptCall(currentIndex, encrypted.key);
          }
        }
      }
    });

    if (this.encryptedStrings.length > 0 && transformedAST.type === 'Program') {
      const stringsArrayDecl = this.createStringsArray();
      const decryptorFunc = this.createDecryptorFunction();

      return {
        ...transformedAST,
        body: [stringsArrayDecl, decryptorFunc, ...transformedAST.body]
      };
    }

    return transformedAST;
  }
}

export function encryptStrings(ast: ASTNode, key?: number): ASTNode {
  const encryptor = new StringEncryptor(key);
  return encryptor.encrypt(ast);
}
