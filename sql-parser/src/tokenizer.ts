import { TokenType, Token, Position, getKeywordTokenType, isKeyword } from './token';

const LONG_OPERATORS: [string, TokenType][] = [
  ['>=', TokenType.Gte],
  ['<=', TokenType.Lte],
  ['<>', TokenType.Neq],
  ['!=', TokenType.Neq],
];

const SHORT_OPERATORS: Map<string, TokenType> = new Map([
  ['=', TokenType.Eq],
  ['<', TokenType.Lt],
  ['>', TokenType.Gt],
  ['+', TokenType.Plus],
  ['-', TokenType.Minus],
  ['*', TokenType.Star],
  ['/', TokenType.Slash],
  ['%', TokenType.Mod],
]);

const PUNCTUATION: Map<string, TokenType> = new Map([
  ['(', TokenType.LParen],
  [')', TokenType.RParen],
  [',', TokenType.Comma],
  [';', TokenType.Semicolon],
  ['.', TokenType.Dot],
]);

export class Tokenizer {
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(private input: string) {}

  scan(): Token[] {
    const tokens: Token[] = [];
    while (true) {
      const token = this.nextToken();
      tokens.push(token);
      if (token.type === TokenType.EOF) {
        break;
      }
    }
    return tokens;
  }

  nextToken(): Token {
    this.skipWhitespaceAndComments();

    if (this.isAtEnd()) {
      return this.createToken(TokenType.EOF, '', null);
    }

    const startPos = this.getPosition();
    const char = this.input[this.pos];

    for (const [op, type] of LONG_OPERATORS) {
      if (this.matchSequence(op)) {
        return this.createTokenFromStart(type, startPos, op, null);
      }
    }

    if (SHORT_OPERATORS.has(char)) {
      const type = SHORT_OPERATORS.get(char)!;
      this.advance();
      return this.createTokenFromStart(type, startPos, char, null);
    }

    if (char === "'") {
      return this.readStringLiteral();
    }

    if (this.isDigit(char) || (char === '.' && this.peek() && this.isDigit(this.peek()!))) {
      return this.readNumberLiteral();
    }

    if (this.isIdentifierStart(char)) {
      return this.readIdentifier();
    }

    if (PUNCTUATION.has(char)) {
      const type = PUNCTUATION.get(char)!;
      this.advance();
      return this.createTokenFromStart(type, startPos, char, null);
    }

    throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
  }

  private skipWhitespaceAndComments(): void {
    while (!this.isAtEnd()) {
      const char = this.input[this.pos];

      if (this.isWhitespace(char)) {
        this.advance();
      } else if (this.matchSequence('--')) {
        while (!this.isAtEnd() && this.input[this.pos] !== '\n') {
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  private readIdentifier(): Token {
    const startPos = this.getPosition();
    const startOffset = this.pos;

    while (!this.isAtEnd() && this.isIdentifierPart(this.input[this.pos])) {
      this.advance();
    }

    const raw = this.input.substring(startOffset, this.pos);
    const value = raw;

    if (isKeyword(raw)) {
      const type = getKeywordTokenType(raw)!;
      return this.createTokenFromStart(type, startPos, raw, value);
    }

    return this.createTokenFromStart(TokenType.Identifier, startPos, raw, value);
  }

  private readStringLiteral(): Token {
    const startPos = this.getPosition();
    const startOffset = this.pos;

    this.advance();

    let value = '';

    while (!this.isAtEnd()) {
      const char = this.input[this.pos];

      if (char === "'") {
        if (this.peek() === "'") {
          value += "'";
          this.advance();
          this.advance();
        } else {
          this.advance();
          const raw = this.input.substring(startOffset, this.pos);
          return this.createTokenFromStart(TokenType.String, startPos, raw, value);
        }
      } else {
        value += char;
        this.advance();
      }
    }

    throw new Error(`Unterminated string literal at line ${startPos.line}, column ${startPos.column}`);
  }

  private readNumberLiteral(): Token {
    const startPos = this.getPosition();
    const startOffset = this.pos;

    while (!this.isAtEnd() && this.isDigit(this.input[this.pos])) {
      this.advance();
    }

    if (this.input[this.pos] === '.' && this.peek() && this.isDigit(this.peek()!)) {
      this.advance();
      while (!this.isAtEnd() && this.isDigit(this.input[this.pos])) {
        this.advance();
      }
    } else if (this.input[this.pos] === '.') {
      this.advance();
      while (!this.isAtEnd() && this.isDigit(this.input[this.pos])) {
        this.advance();
      }
    }

    if (this.input[this.pos] === 'e' || this.input[this.pos] === 'E') {
      this.advance();
      if (this.input[this.pos] === '+' || this.input[this.pos] === '-') {
        this.advance();
      }
      if (!this.isAtEnd() && this.isDigit(this.input[this.pos])) {
        while (!this.isAtEnd() && this.isDigit(this.input[this.pos])) {
          this.advance();
        }
      } else {
        throw new Error(`Invalid number literal at line ${startPos.line}, column ${startPos.column}`);
      }
    }

    const raw = this.input.substring(startOffset, this.pos);
    const value = parseFloat(raw);

    return this.createTokenFromStart(TokenType.Number, startPos, raw, value);
  }

  private isAtEnd(): boolean {
    return this.pos >= this.input.length;
  }

  private advance(): void {
    if (!this.isAtEnd()) {
      const char = this.input[this.pos];
      if (char === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.pos++;
    }
  }

  private peek(): string | undefined {
    if (this.pos + 1 >= this.input.length) {
      return undefined;
    }
    return this.input[this.pos + 1];
  }

  private matchSequence(seq: string): boolean {
    if (this.pos + seq.length > this.input.length) {
      return false;
    }
    for (let i = 0; i < seq.length; i++) {
      if (this.input[this.pos + i] !== seq[i]) {
        return false;
      }
    }
    for (let i = 0; i < seq.length; i++) {
      this.advance();
    }
    return true;
  }

  private getPosition(): Position {
    return {
      offset: this.pos,
      line: this.line,
      column: this.column,
    };
  }

  private createToken(type: TokenType, raw: string, value: string | number | boolean | null): Token {
    return {
      type,
      value,
      raw,
      position: this.getPosition(),
    };
  }

  private createTokenFromStart(
    type: TokenType,
    startPos: Position,
    raw: string,
    value: string | number | boolean | null
  ): Token {
    return {
      type,
      value,
      raw,
      position: startPos,
    };
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isIdentifierStart(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_' || char === '@';
  }

  private isIdentifierPart(char: string): boolean {
    return this.isIdentifierStart(char) || this.isDigit(char) || char === '$' || char === '#';
  }
}
