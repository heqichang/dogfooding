import { ASTNode, traverse } from '../core/astVisitor';

interface Scope {
  variables: Map<string, string>;
  parent: Scope | null;
}

const OBFUSCATION_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
const RESERVED_WORDS = new Set([
  'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete',
  'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof',
  'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
  'void', 'while', 'with', 'class', 'const', 'enum', 'export', 'extends',
  'import', 'super', 'implements', 'interface', 'let', 'package', 'private',
  'protected', 'public', 'static', 'yield', 'null', 'true', 'false'
]);

export class VariableRenamer {
  private nameCounter: number = 0;
  private reservedIdentifiers: Set<string>;
  private usedNames: Set<string> = new Set();
  private variableMap: Map<string, string> = new Map();

  constructor(reservedIdentifiers: string[] = []) {
    this.reservedIdentifiers = new Set(reservedIdentifiers);
  }

  private generateObfuscatedName(): string {
    let name = '';
    let counter = this.nameCounter;

    do {
      name = OBFUSCATION_CHARS[counter % OBFUSCATION_CHARS.length] + name;
      counter = Math.floor(counter / OBFUSCATION_CHARS.length) - 1;
    } while (counter >= 0);

    this.nameCounter++;

    if (RESERVED_WORDS.has(name) || this.usedNames.has(name)) {
      return this.generateObfuscatedName();
    }

    this.usedNames.add(name);
    return name;
  }

  private createScope(parent: Scope | null = null): Scope {
    return {
      variables: new Map(),
      parent
    };
  }

  private collectDeclarations(ast: ASTNode): Map<string, string> {
    const globalScope = this.createScope();
    let currentScope = globalScope;
    const scopeStack: Scope[] = [globalScope];
    const allVariables = new Map<string, string>();

    const collectPattern = (node: ASTNode, scope: Scope) => {
      if (node.type === 'Identifier') {
        if (!this.reservedIdentifiers.has(node.name) && !RESERVED_WORDS.has(node.name)) {
          if (!allVariables.has(node.name)) {
            const obfuscatedName = this.generateObfuscatedName();
            allVariables.set(node.name, obfuscatedName);
            scope.variables.set(node.name, obfuscatedName);
          }
        }
      } else if (node.type === 'ObjectPattern') {
        for (const prop of node.properties || []) {
          if (prop.type === 'RestElement') {
            collectPattern(prop.argument, scope);
          } else if (prop.value) {
            collectPattern(prop.value, scope);
          }
        }
      } else if (node.type === 'ArrayPattern') {
        for (const element of node.elements || []) {
          if (element) {
            if (element.type === 'RestElement') {
              collectPattern(element.argument, scope);
            } else {
              collectPattern(element, scope);
            }
          }
        }
      } else if (node.type === 'RestElement') {
        collectPattern(node.argument, scope);
      } else if (node.type === 'AssignmentPattern') {
        collectPattern(node.left, scope);
      }
    };

    traverse(ast, {
      enter: (node) => {
        if (
          node.type === 'ArrowFunctionExpression' ||
          node.type === 'FunctionExpression' ||
          node.type === 'FunctionDeclaration' ||
          node.type === 'BlockStatement' ||
          node.type === 'CatchClause' ||
          node.type === 'ForStatement' ||
          node.type === 'ForInStatement' ||
          node.type === 'ForOfStatement'
        ) {
          currentScope = this.createScope(currentScope);
          scopeStack.push(currentScope);
        }

        if (node.type === 'VariableDeclaration') {
          for (const decl of node.declarations || []) {
            collectPattern(decl.id, currentScope);
          }
        }

        if (node.type === 'FunctionDeclaration' && node.id) {
          collectPattern(node.id, currentScope);
        }

        if (
          (node.type === 'ArrowFunctionExpression' ||
            node.type === 'FunctionExpression' ||
            node.type === 'FunctionDeclaration') &&
          node.params
        ) {
          for (const param of node.params) {
            collectPattern(param, currentScope);
          }
        }

        if (node.type === 'FunctionExpression' && node.id) {
          collectPattern(node.id, currentScope);
        }

        if (node.type === 'CatchClause' && node.param) {
          collectPattern(node.param, currentScope);
        }
      },
      exit: (node) => {
        if (
          node.type === 'ArrowFunctionExpression' ||
          node.type === 'FunctionExpression' ||
          node.type === 'FunctionDeclaration' ||
          node.type === 'BlockStatement' ||
          node.type === 'CatchClause' ||
          node.type === 'ForStatement' ||
          node.type === 'ForInStatement' ||
          node.type === 'ForOfStatement'
        ) {
          scopeStack.pop();
          currentScope = scopeStack.length > 0 ? scopeStack[scopeStack.length - 1] : globalScope;
        }
      }
    });

    return allVariables;
  }

  rename(ast: ASTNode): ASTNode {
    this.nameCounter = 0;
    this.usedNames = new Set();

    const varMap = this.collectDeclarations(ast);

    if (varMap.size === 0) {
      return ast;
    }

    const result = traverse(ast, {
      enter: (node) => {
        if (node.type === 'Identifier') {
          const newName = varMap.get(node.name);
          if (newName) {
            return { ...node, name: newName };
          }
        }

        if (node.type === 'FunctionDeclaration' && node.id) {
          const newName = varMap.get(node.id.name);
          if (newName) {
            return { ...node, id: { ...node.id, name: newName } };
          }
        }

        if (node.type === 'FunctionExpression' && node.id) {
          const newName = varMap.get(node.id.name);
          if (newName) {
            return { ...node, id: { ...node.id, name: newName } };
          }
        }
      }
    });

    return result;
  }
}

export function renameVariables(ast: ASTNode, reservedIdentifiers: string[] = []): ASTNode {
  const renamer = new VariableRenamer(reservedIdentifiers);
  return renamer.rename(ast);
}
