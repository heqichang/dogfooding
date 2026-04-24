import { ASTNode } from '../core/astVisitor';

export class DeadCodeInjector {
  private generateRandomName(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
    const length = Math.floor(Math.random() * 6) + 4;
    let name = '';
    for (let i = 0; i < length; i++) {
      name += chars[Math.floor(Math.random() * chars.length)];
    }
    return name;
  }

  private createLiteral(value: any): ASTNode {
    return {
      type: 'Literal',
      value,
      raw: JSON.stringify(value)
    };
  }

  private createIdentifier(name: string): ASTNode {
    return {
      type: 'Identifier',
      name
    };
  }

  private generateJunkFunction(): ASTNode {
    const funcName = this.generateRandomName();
    const paramName = this.generateRandomName();
    const localVar = this.generateRandomName();

    return {
      type: 'FunctionDeclaration',
      id: this.createIdentifier(funcName),
      params: [this.createIdentifier(paramName)],
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'VariableDeclaration',
            kind: 'let',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: this.createIdentifier(localVar),
                init: {
                  type: 'BinaryExpression',
                  operator: '+',
                  left: this.createIdentifier(paramName),
                  right: this.createLiteral(Math.floor(Math.random() * 100) + 1)
                }
              }
            ]
          },
          {
            type: 'ReturnStatement',
            argument: this.createIdentifier(paramName)
          }
        ]
      },
      generator: false,
      async: false
    };
  }

  private generateSimpleDeadCode(): ASTNode {
    return {
      type: 'IfStatement',
      test: {
        type: 'BinaryExpression',
        operator: '===',
        left: this.createLiteral(1),
        right: this.createLiteral(2)
      },
      consequent: {
        type: 'BlockStatement',
        body: [
          {
            type: 'VariableDeclaration',
            kind: 'let',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: this.createIdentifier(this.generateRandomName()),
                init: this.createLiteral(Math.floor(Math.random() * 1000))
              }
            ]
          }
        ]
      },
      alternate: null
    };
  }

  private injectIntoBody(body: ASTNode[]): ASTNode[] {
    const newBody = [...body];
    const injectionCount = Math.min(Math.floor(Math.random() * 2) + 1, body.length + 1);

    for (let i = 0; i < injectionCount; i++) {
      const position = Math.floor(Math.random() * (newBody.length + 1));
      newBody.splice(position, 0, this.generateSimpleDeadCode());
    }

    return newBody;
  }

  inject(ast: ASTNode): ASTNode {
    const junkFunctions: ASTNode[] = [];
    const junkFunctionCount = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < junkFunctionCount; i++) {
      junkFunctions.push(this.generateJunkFunction());
    }

    const newAst = JSON.parse(JSON.stringify(ast));

    if (newAst.type === 'Program') {
      newAst.body = [...junkFunctions, ...this.injectIntoBody(newAst.body)];

      const injectIntoFunctions = (node: ASTNode): void => {
        if (
          (node.type === 'FunctionDeclaration' ||
            node.type === 'FunctionExpression' ||
            node.type === 'ArrowFunctionExpression') &&
          node.body &&
          node.body.type === 'BlockStatement' &&
          node.body.body
        ) {
          node.body.body = this.injectIntoBody(node.body.body);
        }

        for (const key of Object.keys(node)) {
          const child = (node as any)[key];
          if (Array.isArray(child)) {
            for (const item of child) {
              if (item && typeof item === 'object' && item.type) {
                injectIntoFunctions(item);
              }
            }
          } else if (child && typeof child === 'object' && child.type) {
            injectIntoFunctions(child);
          }
        }
      };

      for (const stmt of newAst.body) {
        injectIntoFunctions(stmt);
      }
    }

    return newAst;
  }
}

export function injectDeadCode(ast: ASTNode): ASTNode {
  const injector = new DeadCodeInjector();
  return injector.inject(ast);
}
