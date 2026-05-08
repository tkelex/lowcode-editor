type TokenType =
  | 'identifier'
  | 'number'
  | 'string'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'operator'
  | 'punctuation'
  | 'eof';

interface Token {
  type: TokenType;
  value: string;
}

export interface SafeExpressionContext {
  context: Record<string, any>;
  event: Record<string, any>;
  args: any[];
}

const binaryPrecedence: Record<string, number> = {
  '||': 1,
  '&&': 2,
  '==': 3,
  '!=': 3,
  '===': 3,
  '!==': 3,
  '<': 4,
  '<=': 4,
  '>': 4,
  '>=': 4,
};

export function evaluateSafeExpression(expression: string, context: SafeExpressionContext) {
  const parser = new SafeExpressionParser(tokenize(expression), context);
  return parser.parse();
}

function tokenize(expression: string) {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    const threeChar = expression.slice(index, index + 3);
    if (threeChar === '===' || threeChar === '!==') {
      tokens.push({ type: 'operator', value: threeChar });
      index += 3;
      continue;
    }

    const twoChar = expression.slice(index, index + 2);
    if (['&&', '||', '==', '!=', '<=', '>='].includes(twoChar)) {
      tokens.push({ type: 'operator', value: twoChar });
      index += 2;
      continue;
    }

    if (['!', '<', '>'].includes(char)) {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }

    if (['(', ')', '.', '[', ']'].includes(char)) {
      tokens.push({ type: 'punctuation', value: char });
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      const parsed = readString(expression, index);
      tokens.push({ type: 'string', value: parsed.value });
      index = parsed.nextIndex;
      continue;
    }

    if (/\d/.test(char)) {
      const parsed = readNumber(expression, index);
      tokens.push({ type: 'number', value: parsed.value });
      index = parsed.nextIndex;
      continue;
    }

    if (/[A-Za-z_$]/.test(char)) {
      const parsed = readIdentifier(expression, index);
      const tokenType = getKeywordTokenType(parsed.value);
      tokens.push({ type: tokenType, value: parsed.value });
      index = parsed.nextIndex;
      continue;
    }

    throw new Error(`不支持的字符：${char}`);
  }

  tokens.push({ type: 'eof', value: '' });
  return tokens;
}

function readString(expression: string, startIndex: number) {
  const quote = expression[startIndex];
  let index = startIndex + 1;
  let value = '';

  while (index < expression.length) {
    const char = expression[index];

    if (char === quote) {
      return { value, nextIndex: index + 1 };
    }

    if (char === '\\') {
      const nextChar = expression[index + 1];
      if (nextChar === undefined) {
        throw new Error('字符串转义不完整');
      }

      value += decodeEscape(nextChar);
      index += 2;
      continue;
    }

    value += char;
    index += 1;
  }

  throw new Error('字符串未闭合');
}

function decodeEscape(char: string) {
  const escapes: Record<string, string> = {
    n: '\n',
    r: '\r',
    t: '\t',
    b: '\b',
    f: '\f',
  };

  return escapes[char] ?? char;
}

function readNumber(expression: string, startIndex: number) {
  let index = startIndex;

  while (index < expression.length && /[\d.]/.test(expression[index])) {
    index += 1;
  }

  return {
    value: expression.slice(startIndex, index),
    nextIndex: index,
  };
}

function readIdentifier(expression: string, startIndex: number) {
  let index = startIndex;

  while (index < expression.length && /[A-Za-z0-9_$]/.test(expression[index])) {
    index += 1;
  }

  return {
    value: expression.slice(startIndex, index),
    nextIndex: index,
  };
}

function getKeywordTokenType(value: string): TokenType {
  if (value === 'true' || value === 'false') return 'boolean';
  if (value === 'null') return 'null';
  if (value === 'undefined') return 'undefined';
  return 'identifier';
}

class SafeExpressionParser {
  private index = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly context: SafeExpressionContext,
  ) {}

  parse() {
    const value = this.parseExpression(0);
    this.expect('eof');
    return value;
  }

  private parseExpression(minPrecedence: number): any {
    let left = this.parseUnary();

    while (this.current().type === 'operator') {
      const operator = this.current().value;
      const precedence = binaryPrecedence[operator];

      if (!precedence || precedence < minPrecedence) {
        break;
      }

      this.consume();
      const right = this.parseExpression(precedence + 1);
      left = applyBinaryOperator(operator, left, right);
    }

    return left;
  }

  private parseUnary(): any {
    if (this.match('operator', '!')) {
      return !this.parseUnary();
    }

    return this.parsePrimary();
  }

  private parsePrimary(): any {
    const token = this.current();

    if (this.match('punctuation', '(')) {
      const value = this.parseExpression(0);
      this.expect('punctuation', ')');
      return value;
    }

    if (token.type === 'string') {
      this.consume();
      return token.value;
    }

    if (token.type === 'number') {
      this.consume();
      const value = Number(token.value);
      if (Number.isNaN(value)) {
        throw new Error(`数字不合法：${token.value}`);
      }
      return value;
    }

    if (token.type === 'boolean') {
      this.consume();
      return token.value === 'true';
    }

    if (token.type === 'null') {
      this.consume();
      return null;
    }

    if (token.type === 'undefined') {
      this.consume();
      return undefined;
    }

    if (token.type === 'identifier') {
      return this.parsePath();
    }

    throw new Error(`表达式不完整：${token.value || token.type}`);
  }

  private parsePath() {
    const rootName = this.expect('identifier').value;
    let value: unknown = this.readRootValue(rootName);

    while (this.current().type === 'punctuation') {
      if (this.match('punctuation', '.')) {
        const property = this.expect('identifier').value;
        value = readProperty(value, property);
        continue;
      }

      if (this.match('punctuation', '[')) {
        const property = this.parseExpression(0);
        this.expect('punctuation', ']');
        value = readProperty(value, property);
        continue;
      }

      break;
    }

    return value;
  }

  private readRootValue(name: string) {
    if (name === 'event') return this.context.event;
    if (name === 'context') return this.context.context;
    if (name === 'args') return this.context.args;

    throw new Error(`不支持的变量：${name}`);
  }

  private current() {
    return this.tokens[this.index];
  }

  private consume() {
    const token = this.current();
    this.index += 1;
    return token;
  }

  private match(type: TokenType, value?: string) {
    const token = this.current();
    if (token.type !== type) return false;
    if (value !== undefined && token.value !== value) return false;

    this.index += 1;
    return true;
  }

  private expect(type: TokenType, value?: string) {
    const token = this.current();
    if (token.type !== type || (value !== undefined && token.value !== value)) {
      throw new Error(`期望 ${value ?? type}，当前为 ${token.value || token.type}`);
    }

    return this.consume();
  }
}

function readProperty(value: unknown, property: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof property !== 'string' && typeof property !== 'number') {
    throw new Error('属性路径只支持字符串或数字');
  }

  return (value as Record<string | number, unknown>)[property];
}

function applyBinaryOperator(operator: string, left: unknown, right: unknown) {
  if (operator === '&&') return Boolean(left) && Boolean(right);
  if (operator === '||') return Boolean(left) || Boolean(right);
  if (operator === '==') return left === right;
  if (operator === '!=') return left !== right;
  if (operator === '===') return left === right;
  if (operator === '!==') return left !== right;
  if (operator === '<') return compareValues(left, right) < 0;
  if (operator === '<=') return compareValues(left, right) <= 0;
  if (operator === '>') return compareValues(left, right) > 0;
  if (operator === '>=') return compareValues(left, right) >= 0;

  throw new Error(`不支持的运算符：${operator}`);
}

function compareValues(left: unknown, right: unknown) {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}
