import { ASTNode, traverse } from '../core/astVisitor';

export class ControlFlowFlattener {
  private stateVarName: string;
  private readonly EXIT_CASE = -1;

  constructor() {
    this.stateVarName = this.generateRandomName();
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

  private createLiteral(value: number): ASTNode {
    return {
      type: 'Literal',
      value,
      raw: value.toString()
    };
  }

  private createIdentifier(name: string): ASTNode {
    return {
      type: 'Identifier',
      name
    };
  }

  private createAssignment(left: ASTNode, right: ASTNode): ASTNode {
    return {
      type: 'ExpressionStatement',
      expression: {
        type: 'AssignmentExpression',
        operator: '=',
        left,
        right
      }
    };
  }

  private createSwitchCase(testValue: number, statements: ASTNode[]): ASTNode {
    return {
      type: 'SwitchCase',
      test: this.createLiteral(testValue),
      consequent: statements
    };
  }

  private createBreak(): ASTNode {
    return {
      type: 'BreakStatement',
      label: null
    };
  }

  flatten(ast: ASTNode): ASTNode {
    const result = traverse(ast, {
      enter: (node) => {
        if (
          node.type === 'FunctionDeclaration' ||
          node.type === 'FunctionExpression' ||
          node.type === 'ArrowFunctionExpression'
        ) {
          if (!node.body) return;

          const body = node.body.type === 'BlockStatement' ? node.body : null;
          if (!body) return;

          const statements = body.body;
          if (!statements || statements.length === 0) return;

          const flattenedBody = this.flattenStatements(statements);
          return {
            ...node,
            body: {
              ...body,
              body: flattenedBody
            }
          };
        }
      }
    });

    return result;
  }

  private flattenStatements(statements: ASTNode[]): ASTNode[] {
    const collectedVars: { name: string; init?: ASTNode; kind: string }[] = [];
    const transformedStmts: ASTNode[] = [];

    for (const stmt of statements) {
      if (stmt.type === 'VariableDeclaration') {
        for (const decl of stmt.declarations) {
          if (decl.id.type === 'Identifier') {
            collectedVars.push({
              name: decl.id.name,
              init: decl.init,
              kind: stmt.kind
            });
            if (decl.init) {
              transformedStmts.push(this.createAssignment(
                this.createIdentifier(decl.id.name),
                decl.init
              ));
            }
          }
        }
      } else {
        transformedStmts.push(stmt);
      }
    }

    const cases: ASTNode[] = [];
    let currentCaseId = 0;

    const processStatement = (stmt: ASTNode, nextCaseId: number): void => {
      if (stmt.type === 'IfStatement') {
        const conditionCaseId = currentCaseId++;

        const trueBody = stmt.consequent.type === 'BlockStatement'
          ? stmt.consequent.body
          : [stmt.consequent];

        const falseBody = stmt.alternate
          ? (stmt.alternate.type === 'BlockStatement'
            ? stmt.alternate.body
            : [stmt.alternate])
          : [];

        const trueStartCase = currentCaseId;
        for (const trueStmt of trueBody) {
          processStatement(trueStmt, nextCaseId);
        }

        const falseStartCase = currentCaseId;
        for (const falseStmt of falseBody) {
          processStatement(falseStmt, nextCaseId);
        }

        const mergeCaseId = currentCaseId++;

        const conditionExpr: ASTNode = {
          type: 'ConditionalExpression',
          test: stmt.test,
          consequent: this.createLiteral(trueBody.length > 0 ? trueStartCase : mergeCaseId),
          alternate: this.createLiteral(stmt.alternate && falseBody.length > 0 ? falseStartCase : mergeCaseId)
        };

        cases.push(this.createSwitchCase(conditionCaseId, [
          this.createAssignment(
            this.createIdentifier(this.stateVarName),
            conditionExpr
          ),
          this.createBreak()
        ]));

        cases.push(this.createSwitchCase(mergeCaseId, [
          this.createAssignment(
            this.createIdentifier(this.stateVarName),
            this.createLiteral(nextCaseId)
          ),
          this.createBreak()
        ]));
      } else {
        const caseId = currentCaseId++;
        const caseStatements: ASTNode[] = [];
        const hasExit = stmt.type === 'ReturnStatement' || stmt.type === 'ThrowStatement';

        caseStatements.push(stmt);

        if (!hasExit) {
          caseStatements.push(
            this.createAssignment(
              this.createIdentifier(this.stateVarName),
              this.createLiteral(nextCaseId)
            )
          );
        }

        caseStatements.push(this.createBreak());
        cases.push(this.createSwitchCase(caseId, caseStatements));
      }
    };

    for (let i = 0; i < transformedStmts.length; i++) {
      const stmt = transformedStmts[i];
      const isLast = i === transformedStmts.length - 1;
      
      let nextCase: number;
      if (isLast) {
        nextCase = this.EXIT_CASE;
      } else {
        if (stmt.type === 'IfStatement') {
          nextCase = this.countNextCaseForIf(stmt, currentCaseId);
        } else {
          nextCase = currentCaseId + 1;
        }
      }
      
      processStatement(stmt, nextCase);
    }

    const stateVarDecl: ASTNode = {
      type: 'VariableDeclaration',
      kind: 'let',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: this.createIdentifier(this.stateVarName),
          init: this.createLiteral(0)
        }
      ]
    };

    const varDeclarations: ASTNode[] = [];
    if (collectedVars.length > 0) {
      varDeclarations.push({
        type: 'VariableDeclaration',
        kind: 'let',
        declarations: collectedVars.map(v => ({
          type: 'VariableDeclarator',
          id: this.createIdentifier(v.name),
          init: undefined
        }))
      });
    }

    const switchStmt: ASTNode = {
      type: 'SwitchStatement',
      discriminant: this.createIdentifier(this.stateVarName),
      cases: cases
    };

    const whileLoop: ASTNode = {
      type: 'WhileStatement',
      test: {
        type: 'BinaryExpression',
        operator: '>=',
        left: this.createIdentifier(this.stateVarName),
        right: this.createLiteral(0)
      },
      body: {
        type: 'BlockStatement',
        body: [switchStmt]
      }
    };

    return [stateVarDecl, ...varDeclarations, whileLoop];
  }

  private countNextCaseForIf(stmt: ASTNode, startCaseId: number): number {
    let caseCount = 1;

    const trueBody = stmt.consequent.type === 'BlockStatement'
      ? stmt.consequent.body
      : [stmt.consequent];

    for (const s of trueBody) {
      caseCount += this.countCasesForStatement(s);
    }

    if (stmt.alternate) {
      const falseBody = stmt.alternate.type === 'BlockStatement'
        ? stmt.alternate.body
        : [stmt.alternate];
      for (const s of falseBody) {
        caseCount += this.countCasesForStatement(s);
      }
    }

    caseCount += 1;

    return startCaseId + caseCount;
  }

  private countCasesForStatement(stmt: ASTNode): number {
    if (stmt.type === 'IfStatement') {
      let count = 1;

      const trueBody = stmt.consequent.type === 'BlockStatement'
        ? stmt.consequent.body
        : [stmt.consequent];
      for (const s of trueBody) {
        count += this.countCasesForStatement(s);
      }

      if (stmt.alternate) {
        const falseBody = stmt.alternate.type === 'BlockStatement'
          ? stmt.alternate.body
          : [stmt.alternate];
        for (const s of falseBody) {
          count += this.countCasesForStatement(s);
        }
      }

      count += 1;

      return count;
    } else {
      return 1;
    }
  }
}

export function flattenControlFlow(ast: ASTNode): ASTNode {
  const flattener = new ControlFlowFlattener();
  return flattener.flatten(ast);
}
