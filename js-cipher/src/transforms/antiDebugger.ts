import { ASTNode, traverse } from '../core/astVisitor';

export class AntiDebugger {
  private generateRandomName(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
    const length = Math.floor(Math.random() * 6) + 4;
    let name = '';
    for (let i = 0; i < length; i++) {
      name += chars[Math.floor(Math.random() * chars.length)];
    }
    return name;
  }

  private createDebuggerCheck(): ASTNode {
    const checkVar = this.generateRandomName();
    const startTimeVar = this.generateRandomName();
    const endTimeVar = this.generateRandomName();
    const thresholdVar = this.generateRandomName();

    return {
      type: 'VariableDeclaration',
      kind: 'var',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: checkVar },
          init: {
            type: 'FunctionExpression',
            id: null,
            params: [],
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'VariableDeclaration',
                  kind: 'var',
                  declarations: [
                    {
                      type: 'VariableDeclarator',
                      id: { type: 'Identifier', name: startTimeVar },
                      init: {
                        type: 'CallExpression',
                        callee: {
                          type: 'MemberExpression',
                          computed: false,
                          object: { type: 'Identifier', name: 'Date' },
                          property: { type: 'Identifier', name: 'now' }
                        },
                        arguments: [],
                        optional: false
                      }
                    }
                  ]
                },
                {
                  type: 'DebuggerStatement'
                },
                {
                  type: 'VariableDeclaration',
                  kind: 'var',
                  declarations: [
                    {
                      type: 'VariableDeclarator',
                      id: { type: 'Identifier', name: endTimeVar },
                      init: {
                        type: 'CallExpression',
                        callee: {
                          type: 'MemberExpression',
                          computed: false,
                          object: { type: 'Identifier', name: 'Date' },
                          property: { type: 'Identifier', name: 'now' }
                        },
                        arguments: [],
                        optional: false
                      }
                    }
                  ]
                },
                {
                  type: 'VariableDeclaration',
                  kind: 'var',
                  declarations: [
                    {
                      type: 'VariableDeclarator',
                      id: { type: 'Identifier', name: thresholdVar },
                      init: { type: 'Literal', value: 100, raw: '100' }
                    }
                  ]
                },
                {
                  type: 'IfStatement',
                  test: {
                    type: 'BinaryExpression',
                    operator: '>',
                    left: {
                      type: 'BinaryExpression',
                      operator: '-',
                      left: { type: 'Identifier', name: endTimeVar },
                      right: { type: 'Identifier', name: startTimeVar }
                    },
                    right: { type: 'Identifier', name: thresholdVar }
                  },
                  consequent: {
                    type: 'BlockStatement',
                    body: [
                      {
                        type: 'WhileStatement',
                        test: { type: 'Literal', value: true, raw: 'true' },
                        body: {
                          type: 'DebuggerStatement'
                        }
                      }
                    ]
                  },
                  alternate: null
                }
              ]
            },
            generator: false,
            async: false
          }
        }
      ]
    };
  }

  private createConsoleCheck(): ASTNode {
    const checkVar = this.generateRandomName();
    const consoleVar = this.generateRandomName();

    return {
      type: 'VariableDeclaration',
      kind: 'var',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: checkVar },
          init: {
            type: 'FunctionExpression',
            id: null,
            params: [],
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'VariableDeclaration',
                  kind: 'var',
                  declarations: [
                    {
                      type: 'VariableDeclarator',
                      id: { type: 'Identifier', name: consoleVar },
                      init: {
                        type: 'MemberExpression',
                        computed: false,
                        object: { type: 'Identifier', name: 'window' },
                        property: { type: 'Identifier', name: 'console' }
                      }
                    }
                  ]
                },
                {
                  type: 'IfStatement',
                  test: {
                    type: 'BinaryExpression',
                    operator: '&&',
                    left: {
                      type: 'BinaryExpression',
                      operator: '!==',
                      left: { type: 'Identifier', name: consoleVar },
                      right: { type: 'Literal', value: undefined, raw: 'undefined' }
                    },
                    right: {
                      type: 'BinaryExpression',
                      operator: '!==',
                      left: {
                        type: 'MemberExpression',
                        computed: false,
                        object: { type: 'Identifier', name: consoleVar },
                        property: { type: 'Identifier', name: 'log' }
                      },
                      right: { type: 'Literal', value: undefined, raw: 'undefined' }
                    }
                  },
                  consequent: {
                    type: 'BlockStatement',
                    body: [
                      {
                        type: 'ExpressionStatement',
                        expression: {
                          type: 'CallExpression',
                          callee: {
                            type: 'MemberExpression',
                            computed: false,
                            object: { type: 'Identifier', name: consoleVar },
                            property: { type: 'Identifier', name: 'clear' }
                          },
                          arguments: [],
                          optional: false
                        }
                      }
                    ]
                  },
                  alternate: null
                }
              ]
            },
            generator: false,
            async: false
          }
        }
      ]
    };
  }

  private createToStringCheck(): ASTNode {
    const checkVar = this.generateRandomName();
    const originalToStringVar = this.generateRandomName();
    const currentToStringVar = this.generateRandomName();

    return {
      type: 'VariableDeclaration',
      kind: 'var',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: checkVar },
          init: {
            type: 'FunctionExpression',
            id: null,
            params: [],
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'VariableDeclaration',
                  kind: 'var',
                  declarations: [
                    {
                      type: 'VariableDeclarator',
                      id: { type: 'Identifier', name: originalToStringVar },
                      init: {
                        type: 'Literal',
                        value: 'function () { [native code] }',
                        raw: '"function () { [native code] }"'
                      }
                    }
                  ]
                },
                {
                  type: 'VariableDeclaration',
                  kind: 'var',
                  declarations: [
                    {
                      type: 'VariableDeclarator',
                      id: { type: 'Identifier', name: currentToStringVar },
                      init: {
                        type: 'CallExpression',
                        callee: {
                          type: 'MemberExpression',
                          computed: false,
                          object: {
                            type: 'MemberExpression',
                            computed: false,
                            object: { type: 'Identifier', name: 'console' },
                            property: { type: 'Identifier', name: 'log' }
                          },
                          property: { type: 'Identifier', name: 'toString' }
                        },
                        arguments: [],
                        optional: false
                      }
                    }
                  ]
                },
                {
                  type: 'IfStatement',
                  test: {
                    type: 'BinaryExpression',
                    operator: '!==',
                    left: {
                      type: 'CallExpression',
                      callee: {
                        type: 'MemberExpression',
                        computed: false,
                        object: { type: 'Identifier', name: currentToStringVar },
                        property: { type: 'Identifier', name: 'indexOf' }
                      },
                      arguments: [
                        { type: 'Literal', value: '[native code]', raw: '"[native code]"' }
                      ],
                      optional: false
                    },
                    right: { type: 'Literal', value: -1, raw: '-1' }
                  },
                  consequent: {
                    type: 'BlockStatement',
                    body: [
                      {
                        type: 'WhileStatement',
                        test: { type: 'Literal', value: true, raw: 'true' },
                        body: {
                          type: 'DebuggerStatement'
                        }
                      }
                    ]
                  },
                  alternate: null
                }
              ]
            },
            generator: false,
            async: false
          }
        }
      ]
    };
  }

  private createIntervalCheck(): ASTNode {
    const intervalVar = this.generateRandomName();
    const startTimeVar = this.generateRandomName();
    const checkFuncVar = this.generateRandomName();

    return {
      type: 'ExpressionStatement',
      expression: {
        type: 'AssignmentExpression',
        operator: '=',
        left: { type: 'Identifier', name: intervalVar },
        right: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'setInterval' },
          arguments: [
            {
              type: 'FunctionExpression',
              id: { type: 'Identifier', name: checkFuncVar },
              params: [],
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'VariableDeclaration',
                    kind: 'var',
                    declarations: [
                      {
                        type: 'VariableDeclarator',
                        id: { type: 'Identifier', name: startTimeVar },
                        init: {
                          type: 'CallExpression',
                          callee: {
                            type: 'MemberExpression',
                            computed: false,
                            object: { type: 'Identifier', name: 'Date' },
                            property: { type: 'Identifier', name: 'now' }
                          },
                          arguments: [],
                          optional: false
                        }
                      }
                    ]
                  },
                  {
                    type: 'DebuggerStatement'
                  },
                  {
                    type: 'IfStatement',
                    test: {
                      type: 'BinaryExpression',
                      operator: '>',
                      left: {
                        type: 'BinaryExpression',
                        operator: '-',
                        right: {
                          type: 'CallExpression',
                          callee: {
                            type: 'MemberExpression',
                            computed: false,
                            object: { type: 'Identifier', name: 'Date' },
                            property: { type: 'Identifier', name: 'now' }
                          },
                          arguments: [],
                          optional: false
                        },
                        left: { type: 'Identifier', name: startTimeVar }
                      },
                      right: { type: 'Literal', value: 100, raw: '100' }
                    },
                    consequent: {
                      type: 'BlockStatement',
                      body: [
                        {
                          type: 'ExpressionStatement',
                          expression: {
                            type: 'CallExpression',
                            callee: { type: 'Identifier', name: 'clearInterval' },
                            arguments: [{ type: 'Identifier', name: intervalVar }],
                            optional: false
                          }
                        }
                      ]
                    },
                    alternate: null
                  }
                ]
              },
              generator: false,
              async: false
            },
            { type: 'Literal', value: 1000, raw: '1000' }
          ],
          optional: false
        }
      }
    };
  }

  private createCheckInvocation(checkVar: string): ASTNode {
    return {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: checkVar },
        arguments: [],
        optional: false
      }
    };
  }

  addAntiDebug(ast: ASTNode): ASTNode {
    const debuggerCheck = this.createDebuggerCheck();
    const consoleCheck = this.createConsoleCheck();
    const toStringCheck = this.createToStringCheck();

    let hasFunctionWrapper = false;

    const result = traverse(ast, {
      enter: (node) => {
        if (node.type === 'Program') {
          const invocations: ASTNode[] = [];
          
          for (const decl of debuggerCheck.declarations) {
            invocations.push(this.createCheckInvocation(decl.id.name));
          }
          for (const decl of consoleCheck.declarations) {
            invocations.push(this.createCheckInvocation(decl.id.name));
          }
          for (const decl of toStringCheck.declarations) {
            invocations.push(this.createCheckInvocation(decl.id.name));
          }

          return {
            ...node,
            body: [debuggerCheck, consoleCheck, toStringCheck, ...invocations, ...node.body]
          };
        }

        if (
          (node.type === 'FunctionDeclaration' ||
          node.type === 'FunctionExpression' ||
          node.type === 'ArrowFunctionExpression') &&
          node.body &&
          node.body.type === 'BlockStatement'
        ) {
          hasFunctionWrapper = true;
          const newBody = [...node.body.body];
          
          if (Math.random() > 0.5) {
            newBody.unshift({ type: 'DebuggerStatement' });
          }
          
          return {
            ...node,
            body: {
              ...node.body,
              body: newBody
            }
          };
        }
      }
    });

    return result;
  }
}

export function addAntiDebug(ast: ASTNode): ASTNode {
  const antiDebug = new AntiDebugger();
  return antiDebug.addAntiDebug(ast);
}
