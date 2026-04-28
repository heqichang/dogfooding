import { TokenType, Token, getKeywordTokenType, isKeyword, isReservedKeyword } from './token';
import { Tokenizer } from './tokenizer';
import {
  Expression,
  Statement,
  Identifier,
  Literal,
  ColumnRef,
  StarExpr,
  BinaryExpr,
  UnaryExpr,
  FunctionCall,
  ParenthesisExpr,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
  DeleteStatement,
  SelectItem,
  TableRef,
  Join,
  OrderBy,
  Limit,
  Alias,
  SetClause,
} from './ast';

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(input: string) {
    const tokenizer = new Tokenizer(input);
    this.tokens = tokenizer.scan();
  }

  private peek(offset: number = 0): Token {
    const index = this.pos + offset;
    if (index >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1];
    }
    return this.tokens[index];
  }

  private consume(): Token {
    if (this.pos >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1];
    }
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType): Token {
    const token = this.peek();
    if (token.type !== type) {
      this.error(`Expected ${TokenType[type]}, got ${TokenType[token.type]}`);
    }
    return this.consume();
  }

  private match(type: TokenType): boolean {
    if (this.isAtType(type)) {
      this.consume();
      return true;
    }
    return false;
  }

  private error(message: string): never {
    const token = this.peek();
    const { line, column } = token.position;
    throw new Error(`Syntax error at line ${line}, column ${column}: ${message}`);
  }

  private isAtType(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private isAtKeyword(keyword: string): boolean {
    const token = this.peek();
    if (token.type === TokenType.Identifier) {
      return token.value?.toString().toUpperCase() === keyword.toUpperCase();
    }
    const expectedType = getKeywordTokenType(keyword);
    return expectedType !== undefined && token.type === expectedType;
  }

  private expectKeyword(keyword: string): Token {
    if (!this.isAtKeyword(keyword)) {
      this.error(`Expected keyword '${keyword}'`);
    }
    return this.consume();
  }

  parse(): Statement {
    const token = this.peek();
    let result: Statement;
    
    switch (token.type) {
      case TokenType.Select:
        result = this.parseSelect();
        break;
      case TokenType.Insert:
        result = this.parseInsert();
        break;
      case TokenType.Update:
        result = this.parseUpdate();
        break;
      case TokenType.Delete:
        result = this.parseDelete();
        break;
      default:
        this.error(`Unexpected statement type: ${TokenType[token.type]}`);
    }
    
    if (this.isAtType(TokenType.Semicolon)) {
      this.consume();
    }

    if (!this.isAtType(TokenType.EOF)) {
      this.error(`Unexpected token after statement: ${TokenType[this.peek().type]}`);
    }
    
    return result;
  }

  parseExpression(): Expression {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): Expression {
    let left = this.parseLogicalAnd();

    while (this.match(TokenType.Or)) {
      const operator = 'OR';
      const right = this.parseLogicalAnd();
      left = {
        type: 'binary_expr',
        operator,
        left,
        right,
      } as BinaryExpr;
    }

    return left;
  }

  private parseLogicalAnd(): Expression {
    let left = this.parseNot();

    while (this.match(TokenType.And)) {
      const operator = 'AND';
      const right = this.parseNot();
      left = {
        type: 'binary_expr',
        operator,
        left,
        right,
      } as BinaryExpr;
    }

    return left;
  }

  private parseNot(): Expression {
    if (this.match(TokenType.Not)) {
      const expr = this.parseNot();
      return {
        type: 'unary_expr',
        operator: 'NOT',
        expr,
      } as UnaryExpr;
    }
    return this.parseComparison();
  }

  private parseComparison(): Expression {
    let left = this.parseAdditive();

    while (true) {
      if (this.match(TokenType.Eq)) {
        const right = this.parseAdditive();
        left = {
          type: 'binary_expr',
          operator: '=',
          left,
          right,
        } as BinaryExpr;
      } else if (this.match(TokenType.Neq)) {
        const right = this.parseAdditive();
        left = {
          type: 'binary_expr',
          operator: '!=',
          left,
          right,
        } as BinaryExpr;
      } else if (this.match(TokenType.Lt)) {
        const right = this.parseAdditive();
        left = {
          type: 'binary_expr',
          operator: '<',
          left,
          right,
        } as BinaryExpr;
      } else if (this.match(TokenType.Lte)) {
        const right = this.parseAdditive();
        left = {
          type: 'binary_expr',
          operator: '<=',
          left,
          right,
        } as BinaryExpr;
      } else if (this.match(TokenType.Gt)) {
        const right = this.parseAdditive();
        left = {
          type: 'binary_expr',
          operator: '>',
          left,
          right,
        } as BinaryExpr;
      } else if (this.match(TokenType.Gte)) {
        const right = this.parseAdditive();
        left = {
          type: 'binary_expr',
          operator: '>=',
          left,
          right,
        } as BinaryExpr;
      } else if (this.isAtKeyword('IS')) {
        this.consume();
        const isNot = this.match(TokenType.Not);
        if (this.isAtKeyword('NULL')) {
          this.consume();
          const operator = isNot ? 'IS NOT NULL' : 'IS NULL';
          left = {
            type: 'unary_expr',
            operator,
            expr: left,
          } as UnaryExpr;
        } else {
          const right = this.parseAdditive();
          const operator = isNot ? 'IS NOT' : 'IS';
          left = {
            type: 'binary_expr',
            operator,
            left,
            right,
          } as BinaryExpr;
        }
      } else if (this.isAtKeyword('LIKE')) {
        this.consume();
        const right = this.parseAdditive();
        left = {
          type: 'binary_expr',
          operator: 'LIKE',
          left,
          right,
        } as BinaryExpr;
      } else if (this.isAtKeyword('NOT') && this.peek(1).type === TokenType.Like) {
        this.consume();
        this.consume();
        const right = this.parseAdditive();
        left = {
          type: 'binary_expr',
          operator: 'NOT LIKE',
          left,
          right,
        } as BinaryExpr;
      } else if (this.isAtKeyword('IN')) {
        this.consume();
        this.expect(TokenType.LParen);
        const values: Expression[] = [];
        if (!this.isAtType(TokenType.RParen)) {
          values.push(this.parseExpression());
          while (this.match(TokenType.Comma)) {
            values.push(this.parseExpression());
          }
        }
        this.expect(TokenType.RParen);
        left = {
          type: 'binary_expr',
          operator: 'IN',
          left,
          right: {
            type: 'parenthesis',
            expr: this.buildCommaSeparatedExpr(values),
          } as ParenthesisExpr,
        } as BinaryExpr;
      } else if (this.isAtKeyword('NOT') && this.peek(1).type === TokenType.In) {
        this.consume();
        this.consume();
        this.expect(TokenType.LParen);
        const values: Expression[] = [];
        if (!this.isAtType(TokenType.RParen)) {
          values.push(this.parseExpression());
          while (this.match(TokenType.Comma)) {
            values.push(this.parseExpression());
          }
        }
        this.expect(TokenType.RParen);
        left = {
          type: 'binary_expr',
          operator: 'NOT IN',
          left,
          right: {
            type: 'parenthesis',
            expr: this.buildCommaSeparatedExpr(values),
          } as ParenthesisExpr,
        } as BinaryExpr;
      } else if (this.isAtKeyword('BETWEEN')) {
        this.consume();
        const lower = this.parseAdditive();
        this.expectKeyword('AND');
        const upper = this.parseAdditive();
        left = {
          type: 'binary_expr',
          operator: 'BETWEEN',
          left,
          right: {
            type: 'binary_expr',
            operator: 'AND',
            left: lower,
            right: upper,
          } as BinaryExpr,
        } as BinaryExpr;
      } else if (this.isAtKeyword('NOT') && this.peek(1).type === TokenType.Between) {
        this.consume();
        this.consume();
        const lower = this.parseAdditive();
        this.expectKeyword('AND');
        const upper = this.parseAdditive();
        left = {
          type: 'binary_expr',
          operator: 'NOT BETWEEN',
          left,
          right: {
            type: 'binary_expr',
            operator: 'AND',
            left: lower,
            right: upper,
          } as BinaryExpr,
        } as BinaryExpr;
      } else {
        break;
      }
    }

    return left;
  }

  private parseAdditive(): Expression {
    let left = this.parseMultiplicative();

    while (true) {
      if (this.match(TokenType.Plus)) {
        const right = this.parseMultiplicative();
        left = {
          type: 'binary_expr',
          operator: '+',
          left,
          right,
        } as BinaryExpr;
      } else if (this.match(TokenType.Minus)) {
        const right = this.parseMultiplicative();
        left = {
          type: 'binary_expr',
          operator: '-',
          left,
          right,
        } as BinaryExpr;
      } else {
        break;
      }
    }

    return left;
  }

  private parseMultiplicative(): Expression {
    let left = this.parseUnary();

    while (true) {
      if (this.match(TokenType.Star)) {
        const right = this.parseUnary();
        left = {
          type: 'binary_expr',
          operator: '*',
          left,
          right,
        } as BinaryExpr;
      } else if (this.match(TokenType.Slash)) {
        const right = this.parseUnary();
        left = {
          type: 'binary_expr',
          operator: '/',
          left,
          right,
        } as BinaryExpr;
      } else if (this.match(TokenType.Mod)) {
        const right = this.parseUnary();
        left = {
          type: 'binary_expr',
          operator: '%',
          left,
          right,
        } as BinaryExpr;
      } else {
        break;
      }
    }

    return left;
  }

  private parseUnary(): Expression {
    if (this.match(TokenType.Plus)) {
      const expr = this.parseUnary();
      return {
        type: 'unary_expr',
        operator: '+',
        expr,
      } as UnaryExpr;
    }
    if (this.match(TokenType.Minus)) {
      const expr = this.parseUnary();
      return {
        type: 'unary_expr',
        operator: '-',
        expr,
      } as UnaryExpr;
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expression {
    const token = this.peek();

    if (this.match(TokenType.LParen)) {
      const expr = this.parseExpression();
      this.expect(TokenType.RParen);
      return {
        type: 'parenthesis',
        expr,
      } as ParenthesisExpr;
    }

    if (this.match(TokenType.Star)) {
      return {
        type: 'star',
      } as StarExpr;
    }

    if (token.type === TokenType.String) {
      this.consume();
      return {
        type: 'literal',
        value: token.value,
        valueType: 'string',
      } as Literal;
    }

    if (token.type === TokenType.Number) {
      this.consume();
      return {
        type: 'literal',
        value: token.value,
        valueType: 'number',
      } as Literal;
    }

    if (token.type === TokenType.True) {
      this.consume();
      return {
        type: 'literal',
        value: true,
        valueType: 'boolean',
      } as Literal;
    }

    if (token.type === TokenType.False) {
      this.consume();
      return {
        type: 'literal',
        value: false,
        valueType: 'boolean',
      } as Literal;
    }

    if (token.type === TokenType.Null) {
      this.consume();
      return {
        type: 'literal',
        value: null,
        valueType: 'null',
      } as Literal;
    }

    if (token.type === TokenType.Identifier || (isKeyword(token.raw) && !isReservedKeyword(token.raw))) {
      this.consume();
      const name = token.value as string;

      if (this.isAtType(TokenType.Dot)) {
        this.consume();

        if (this.isAtType(TokenType.Star)) {
          this.consume();
          return {
            type: 'star',
            table: name,
          } as StarExpr;
        }

        const columnName = this.parseColumnName();

        return {
          type: 'column_ref',
          table: name,
          column: columnName,
        } as ColumnRef;
      }

      if (this.isAtType(TokenType.LParen)) {
        this.consume();
        const args: Expression[] = [];

        if (!this.isAtType(TokenType.RParen)) {
          args.push(this.parseExpression());
          while (this.match(TokenType.Comma)) {
            args.push(this.parseExpression());
          }
        }

        this.expect(TokenType.RParen);

        return {
          type: 'function',
          name,
          args,
        } as FunctionCall;
      }

      return {
        type: 'identifier',
        name,
      } as Identifier;
    }

    this.error(`Unexpected token: ${TokenType[token.type]}`);
  }

  private parseSelect(): SelectStatement {
    this.expectKeyword('SELECT');

    const columns = this.parseSelectItems();

    let from: TableRef | null = null;
    let joins: Join[] = [];
    let where: Expression | null = null;
    let groupBy: Expression[] = [];
    let having: Expression | null = null;
    let orderBy: OrderBy[] = [];
    let limit: Limit | null = null;

    if (this.isAtKeyword('FROM')) {
      this.consume();
      from = this.parseTableRef();

      while (this.isJoinKeyword()) {
        joins.push(this.parseJoin());
      }
    }

    if (this.isAtKeyword('WHERE')) {
      this.consume();
      where = this.parseExpression();
    }

    if (this.isAtKeyword('GROUP')) {
      this.consume();
      this.expectKeyword('BY');
      groupBy = this.parseExpressionList();

      if (this.isAtKeyword('HAVING')) {
        this.consume();
        having = this.parseExpression();
      }
    }

    if (this.isAtKeyword('ORDER')) {
      this.consume();
      this.expectKeyword('BY');
      orderBy = this.parseOrderBy();
    }

    if (this.isAtKeyword('LIMIT')) {
      this.consume();
      limit = this.parseLimit();
    }

    return {
      type: 'select',
      columns,
      from,
      joins,
      where,
      groupBy,
      having,
      orderBy,
      limit,
    } as SelectStatement;
  }

  private parseSelectItems(): SelectItem[] {
    const items: SelectItem[] = [];

    do {
      items.push(this.parseSelectItem());
    } while (this.match(TokenType.Comma));

    return items;
  }

  private parseSelectItem(): SelectItem {
    const current = this.peek();
    const next = this.peek(1);

    if (
      (current.type === TokenType.Identifier || (isKeyword(current.raw) && !isReservedKeyword(current.raw))) &&
      next.type === TokenType.Dot &&
      this.peek(2).type === TokenType.Star
    ) {
      const tableName = current.value as string;
      this.consume();
      this.consume();
      this.consume();
      return {
        type: 'star',
        table: tableName,
      } as StarExpr;
    }

    if (this.isAtType(TokenType.Star)) {
      this.consume();
      return {
        type: 'star',
      } as StarExpr;
    }

    const expr = this.parseExpression();

    let alias: string | undefined;
    let hasAs = false;

    if (this.isAtKeyword('AS')) {
      this.consume();
      alias = this.parseColumnName();
      hasAs = true;
    } else if (this.isAtType(TokenType.Identifier) || (isKeyword(this.peek().raw) && !isReservedKeyword(this.peek().raw))) {
      alias = this.parseColumnName();
      hasAs = false;
    }

    if (alias) {
      return {
        type: 'alias',
        expr,
        as: alias,
        hasAs,
      } as Alias;
    }

    return expr;
  }

  private parseTableRef(): TableRef {
    const nameToken = this.peek();
    let name: string;

    if (nameToken.type === TokenType.Identifier) {
      name = nameToken.value as string;
      this.consume();
    } else if (isKeyword(nameToken.raw) && !isReservedKeyword(nameToken.raw)) {
      name = nameToken.raw;
      this.consume();
    } else {
      this.error('Expected table name');
    }

    let alias: string | undefined;
    let hasAs = false;

    if (this.isAtKeyword('AS')) {
      this.consume();
      alias = this.parseColumnName();
      hasAs = true;
    } else if (this.isAtType(TokenType.Identifier)) {
      const aliasToken = this.consume();
      alias = aliasToken.value as string;
      hasAs = false;
    }

    return {
      type: 'table_ref',
      name,
      alias,
      hasAs,
    } as TableRef;
  }

  private parseColumnName(): string {
    const token = this.peek();
    if (token.type === TokenType.Identifier) {
      this.consume();
      return token.value as string;
    }
    if (isKeyword(token.raw)) {
      this.consume();
      return token.raw;
    }
    this.error(`Expected column name, got ${TokenType[token.type]}`);
  }

  private parseJoin(): Join {
    let joinType: 'inner' | 'left' | 'right' = 'inner';

    if (this.isAtKeyword('INNER')) {
      this.consume();
      joinType = 'inner';
    } else if (this.isAtKeyword('LEFT')) {
      this.consume();
      if (this.isAtKeyword('OUTER')) {
        this.consume();
      }
      joinType = 'left';
    } else if (this.isAtKeyword('RIGHT')) {
      this.consume();
      if (this.isAtKeyword('OUTER')) {
        this.consume();
      }
      joinType = 'right';
    }

    this.expectKeyword('JOIN');

    const table = this.parseTableRef();

    this.expectKeyword('ON');
    const on = this.parseExpression();

    return {
      type: 'join',
      joinType,
      table,
      on,
    } as Join;
  }

  private isJoinKeyword(): boolean {
    return (
      this.isAtKeyword('JOIN') ||
      this.isAtKeyword('INNER') ||
      this.isAtKeyword('LEFT') ||
      this.isAtKeyword('RIGHT')
    );
  }

  private parseExpressionList(): Expression[] {
    const exprs: Expression[] = [];

    do {
      exprs.push(this.parseExpression());
    } while (this.match(TokenType.Comma));

    return exprs;
  }

  private parseOrderBy(): OrderBy[] {
    const items: OrderBy[] = [];

    do {
      const expr = this.parseExpression();
      let order: 'asc' | 'desc' = 'asc';

      if (this.isAtKeyword('ASC')) {
        this.consume();
        order = 'asc';
      } else if (this.isAtKeyword('DESC')) {
        this.consume();
        order = 'desc';
      }

      items.push({
        type: 'order_by',
        expr,
        order,
      } as OrderBy);
    } while (this.match(TokenType.Comma));

    return items;
  }

  private parseLimit(): Limit {
    const countToken = this.expect(TokenType.Number);
    const count = countToken.value as number;

    if (!Number.isInteger(count)) {
      this.error('LIMIT must be an integer');
    }

    return {
      type: 'limit',
      count,
    } as Limit;
  }

  private parseInsert(): InsertStatement {
    this.expectKeyword('INSERT');

    this.expectKeyword('INTO');

    const table = this.parseTableRef();

    let columns: Identifier[] | null = null;

    if (this.isAtType(TokenType.LParen)) {
      this.consume();
      columns = [];

      do {
        const colToken = this.expect(TokenType.Identifier);
        columns.push({
          type: 'identifier',
          name: colToken.value as string,
        } as Identifier);
      } while (this.match(TokenType.Comma));

      this.expect(TokenType.RParen);
    }

    this.expectKeyword('VALUES');

    const values: Expression[][] = [];

    do {
      this.expect(TokenType.LParen);
      const row: Expression[] = [];

      if (!this.isAtType(TokenType.RParen)) {
        do {
          row.push(this.parseExpression());
        } while (this.match(TokenType.Comma));
      }

      this.expect(TokenType.RParen);
      values.push(row);
    } while (this.match(TokenType.Comma));

    return {
      type: 'insert',
      table,
      columns,
      values,
    } as InsertStatement;
  }

  private parseUpdate(): UpdateStatement {
    this.expectKeyword('UPDATE');

    const table = this.parseTableRef();

    this.expectKeyword('SET');

    const sets: SetClause[] = [];

    do {
      const colToken = this.expect(TokenType.Identifier);
      const column = colToken.value as string;

      this.expect(TokenType.Eq);

      const value = this.parseExpression();

      sets.push({
        type: 'set_clause',
        column,
        value,
      } as SetClause);
    } while (this.match(TokenType.Comma));

    let where: Expression | null = null;

    if (this.isAtKeyword('WHERE')) {
      this.consume();
      where = this.parseExpression();
    }

    return {
      type: 'update',
      table,
      sets,
      where,
    } as UpdateStatement;
  }

  private parseDelete(): DeleteStatement {
    this.expectKeyword('DELETE');

    this.expectKeyword('FROM');

    const table = this.parseTableRef();

    let where: Expression | null = null;

    if (this.isAtKeyword('WHERE')) {
      this.consume();
      where = this.parseExpression();
    }

    return {
      type: 'delete',
      table,
      where,
    } as DeleteStatement;
  }

  private buildCommaSeparatedExpr(values: Expression[]): Expression {
    if (values.length === 0) {
      throw new Error('Cannot build comma-separated expression from empty values');
    }
    if (values.length === 1) {
      return values[0];
    }
    
    let result: Expression = values[values.length - 1];
    for (let i = values.length - 2; i >= 0; i--) {
      result = {
        type: 'binary_expr',
        operator: ',',
        left: values[i],
        right: result,
      } as BinaryExpr;
    }
    return result;
  }
}
