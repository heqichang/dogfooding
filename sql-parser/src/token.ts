export enum TokenType {
  Select = 'Select',
  Insert = 'Insert',
  Update = 'Update',
  Delete = 'Delete',
  From = 'From',
  Where = 'Where',
  Join = 'Join',
  Left = 'Left',
  Right = 'Right',
  Inner = 'Inner',
  Outer = 'Outer',
  On = 'On',
  Into = 'Into',
  Group = 'Group',
  By = 'By',
  Having = 'Having',
  Order = 'Order',
  Asc = 'Asc',
  Desc = 'Desc',
  Limit = 'Limit',
  Values = 'Values',
  Set = 'Set',
  As = 'As',
  And = 'And',
  Or = 'Or',
  Not = 'Not',
  Null = 'Null',
  True = 'True',
  False = 'False',
  Is = 'Is',
  Between = 'Between',
  Like = 'Like',
  In = 'In',
  Identifier = 'Identifier',
  String = 'String',
  Number = 'Number',
  Boolean = 'Boolean',
  NullLiteral = 'NullLiteral',
  Eq = 'Eq',
  Neq = 'Neq',
  Lt = 'Lt',
  Lte = 'Lte',
  Gt = 'Gt',
  Gte = 'Gte',
  Plus = 'Plus',
  Minus = 'Minus',
  Star = 'Star',
  Slash = 'Slash',
  Mod = 'Mod',
  LParen = 'LParen',
  RParen = 'RParen',
  Comma = 'Comma',
  Semicolon = 'Semicolon',
  Dot = 'Dot',
  EOF = 'EOF',
}

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface Token {
  type: TokenType;
  value: string | number | boolean | null;
  raw: string;
  position: Position;
}

export const KEYWORDS: ReadonlyMap<string, TokenType> = new Map([
  ['SELECT', TokenType.Select],
  ['INSERT', TokenType.Insert],
  ['UPDATE', TokenType.Update],
  ['DELETE', TokenType.Delete],
  ['FROM', TokenType.From],
  ['INTO', TokenType.Into],
  ['WHERE', TokenType.Where],
  ['JOIN', TokenType.Join],
  ['LEFT', TokenType.Left],
  ['RIGHT', TokenType.Right],
  ['INNER', TokenType.Inner],
  ['OUTER', TokenType.Outer],
  ['ON', TokenType.On],
  ['GROUP', TokenType.Group],
  ['BY', TokenType.By],
  ['HAVING', TokenType.Having],
  ['ORDER', TokenType.Order],
  ['ASC', TokenType.Asc],
  ['DESC', TokenType.Desc],
  ['LIMIT', TokenType.Limit],
  ['VALUES', TokenType.Values],
  ['SET', TokenType.Set],
  ['AS', TokenType.As],
  ['AND', TokenType.And],
  ['OR', TokenType.Or],
  ['NOT', TokenType.Not],
  ['NULL', TokenType.Null],
  ['TRUE', TokenType.True],
  ['FALSE', TokenType.False],
  ['IS', TokenType.Is],
  ['BETWEEN', TokenType.Between],
  ['LIKE', TokenType.Like],
  ['IN', TokenType.In],
]);

export function getKeywordTokenType(keyword: string): TokenType | undefined {
  return KEYWORDS.get(keyword.toUpperCase());
}

export function isKeyword(word: string): boolean {
  return KEYWORDS.has(word.toUpperCase());
}

export const RESERVED_KEYWORDS: ReadonlySet<string> = new Set([
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'FROM',
  'INTO',
  'WHERE',
  'JOIN',
  'GROUP',
  'BY',
  'HAVING',
  'ORDER',
  'LIMIT',
  'VALUES',
  'SET',
]);

export function isReservedKeyword(word: string): boolean {
  return RESERVED_KEYWORDS.has(word.toUpperCase());
}
