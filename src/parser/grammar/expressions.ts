import { TokenType, Token, canStartExpression } from '../../lexer/token';
import {
    Expression, Identifier, NumberLiteral, StringLiteral, CharLiteral,
    BooleanLiteral, NullLiteral, BinaryExpression, BinaryOperator,
    UnaryExpression, UnaryOperator, AssignmentExpression, AssignmentOperator,
    CallExpression, MemberAccessExpression, IndexExpression,
    TernaryExpression, GroupExpression,
} from '../ast';
import { createSpan, SourceSpan } from '../../common/source-location';
import { createErrorNode } from '../error-recovery';
import { DiagnosticBag } from '../../common/diagnostics';

/**
 * Pratt 表达式解析器 — Top-Down Operator Precedence
 *
 * 基于优先级表，递归解析表达式直到遇到优先级低于当前最小优先级的 token。
 */

// 优先级常量
export enum Precedence {
    Lowest = 1,
    Assignment = 2,
    Ternary = 3,
    LogicalOr = 4,
    LogicalAnd = 5,
    Equality = 6,
    Comparison = 7,
    Additive = 8,
    Multiplicative = 9,
    Unary = 10,
    Postfix = 11,
    Primary = 12,
}

// 二元运算符优先级映射
const BINARY_PRECEDENCE: Partial<Record<TokenType, [Precedence, boolean]>> = {
    // [precedence, isRightAssoc]
    [TokenType.Equals]: [Precedence.Assignment, true],
    [TokenType.PlusEquals]: [Precedence.Assignment, true],
    [TokenType.MinusEquals]: [Precedence.Assignment, true],
    [TokenType.StarEquals]: [Precedence.Assignment, true],
    [TokenType.SlashEquals]: [Precedence.Assignment, true],
    [TokenType.PercentEquals]: [Precedence.Assignment, true],
    [TokenType.OrOr]: [Precedence.LogicalOr, false],
    [TokenType.AndAnd]: [Precedence.LogicalAnd, false],
    [TokenType.EqualsEquals]: [Precedence.Equality, false],
    [TokenType.NotEquals]: [Precedence.Equality, false],
    [TokenType.LessThan]: [Precedence.Comparison, false],
    [TokenType.GreaterThan]: [Precedence.Comparison, false],
    [TokenType.LessThanEquals]: [Precedence.Comparison, false],
    [TokenType.GreaterThanEquals]: [Precedence.Comparison, false],
    [TokenType.Plus]: [Precedence.Additive, false],
    [TokenType.Minus]: [Precedence.Additive, false],
    [TokenType.Star]: [Precedence.Multiplicative, false],
    [TokenType.Slash]: [Precedence.Multiplicative, false],
    [TokenType.Percent]: [Precedence.Multiplicative, false],
};

// 二元运算符 → BinaryOperator 映射
const BINARY_OP_MAP: Partial<Record<TokenType, BinaryOperator>> = {
    [TokenType.Plus]: '+',
    [TokenType.Minus]: '-',
    [TokenType.Star]: '*',
    [TokenType.Slash]: '/',
    [TokenType.Percent]: '%',
    [TokenType.EqualsEquals]: '==',
    [TokenType.NotEquals]: '!=',
    [TokenType.LessThan]: '<',
    [TokenType.GreaterThan]: '>',
    [TokenType.LessThanEquals]: '<=',
    [TokenType.GreaterThanEquals]: '>=',
    [TokenType.AndAnd]: '&&',
    [TokenType.OrOr]: '||',
};

// 赋值运算符映射
const ASSIGN_OP_MAP: Partial<Record<TokenType, AssignmentOperator>> = {
    [TokenType.Equals]: '=',
    [TokenType.PlusEquals]: '+=',
    [TokenType.MinusEquals]: '-=',
    [TokenType.StarEquals]: '*=',
    [TokenType.SlashEquals]: '/=',
    [TokenType.PercentEquals]: '%=',
};

export class ExpressionParser {
    private tokens: Token[];
    private pos: number;
    private diagnostics: DiagnosticBag;

    constructor(tokens: Token[], diagnostics: DiagnosticBag) {
        this.tokens = tokens;
        this.pos = 0;
        this.diagnostics = diagnostics;
    }

    setPosition(pos: number): void {
        this.pos = pos;
    }

    getPosition(): number {
        return this.pos;
    }

    /**
     * 解析表达式 (入口)
     */
    parseExpression(minPrec: Precedence = Precedence.Lowest): Expression {
        let left = this.parsePrefix();

        while (true) {
            const token = this.current();
            if (!token) break;

            const prec = this.getInfixPrecedence(token.type);
            if (!prec || prec[0] < minPrec) break;

            const [precLevel, isRightAssoc] = prec;
            const nextMinPrec = isRightAssoc ? precLevel : precLevel + 1;

            left = this.parseInfix(left, token.type, nextMinPrec);
        }

        return left;
    }

    /**
     * 解析前缀表达式 (字面量、标识符、一元运算符、分组)
     */
    private parsePrefix(): Expression {
        const token = this.advance();
        if (!token) {
            return createErrorNode('Unexpected end of input', this.eofSpan());
        }

        switch (token.type) {
            // 字面量
            case TokenType.NumberLiteral:
                return {
                    kind: 'NumberLiteral',
                    value: token.lexeme,
                    numKind: token.lexeme.includes('.') || token.lexeme.includes('e') ? 1 : 0,
                    span: token.span,
                } as NumberLiteral;

            case TokenType.StringLiteral:
                return {
                    kind: 'StringLiteral',
                    value: (token.value as string) || token.lexeme,
                    span: token.span,
                } as StringLiteral;

            case TokenType.MultiLineStringLiteral:
                return {
                    kind: 'MultiLineStringLiteral',
                    value: (token.value as string) || token.lexeme,
                    span: token.span,
                };

            case TokenType.CharLiteral:
                return {
                    kind: 'CharLiteral',
                    value: (token.value as string) || token.lexeme,
                    span: token.span,
                } as CharLiteral;

            case TokenType.True:
                return { kind: 'BooleanLiteral', value: true, span: token.span } as BooleanLiteral;

            case TokenType.False:
                return { kind: 'BooleanLiteral', value: false, span: token.span } as BooleanLiteral;

            case TokenType.Null:
                return { kind: 'NullLiteral', span: token.span } as NullLiteral;

            // 标识符
            case TokenType.Identifier:
                return { kind: 'Identifier', name: token.lexeme, span: token.span } as Identifier;

            // 一元前缀运算符
            case TokenType.Bang:
            case TokenType.Minus:
            case TokenType.PlusPlus:
            case TokenType.MinusMinus: {
                const opMap: Partial<Record<TokenType, UnaryOperator>> = {
                    [TokenType.Bang]: '!',
                    [TokenType.Minus]: '-',
                    [TokenType.PlusPlus]: '++',
                    [TokenType.MinusMinus]: '--',
                };
                const operand = this.parseExpression(Precedence.Unary);
                return {
                    kind: 'UnaryExpression',
                    operator: opMap[token.type]!,
                    operand,
                    isPrefix: true,
                    span: this.spanFromTo(token.span, operand.span),
                } as UnaryExpression;
            }

            // 分组 (Expression)
            case TokenType.LeftParen: {
                const expr = this.parseExpression();
                this.expect(TokenType.RightParen, "Expected ')' after expression");
                return {
                    kind: 'GroupExpression',
                    expression: expr,
                    span: expr.span,
                } as GroupExpression;
            }

            default:
                this.diagnostics.addError(
                    `Unexpected token '${token.lexeme}' in expression`,
                    token.span,
                );
                return createErrorNode(`Unexpected token '${token.lexeme}'`, token.span);
        }
    }

    /**
     * 解析中缀表达式
     */
    private parseInfix(left: Expression, opType: TokenType, minPrec: Precedence): Expression {
        const token = this.advance()!;

        // 赋值
        if (ASSIGN_OP_MAP[opType]) {
            const right = this.parseExpression(minPrec);
            return {
                kind: 'AssignmentExpression',
                operator: ASSIGN_OP_MAP[opType]!,
                left,
                right,
                span: this.spanFromTo(left.span, right.span),
            } as AssignmentExpression;
        }

        // 三元 ? :
        if (opType === TokenType.QuestionMark) {
            const trueBranch = this.parseExpression();
            this.expect(TokenType.Colon, "Expected ':' in ternary expression");
            const falseBranch = this.parseExpression(Precedence.Ternary);
            return {
                kind: 'TernaryExpression',
                condition: left,
                trueBranch,
                falseBranch,
                span: this.spanFromTo(left.span, falseBranch.span),
            } as TernaryExpression;
        }

        // 二元运算符
        if (BINARY_OP_MAP[opType]) {
            const right = this.parseExpression(minPrec);
            return {
                kind: 'BinaryExpression',
                operator: BINARY_OP_MAP[opType]!,
                left,
                right,
                span: this.spanFromTo(left.span, right.span),
            } as BinaryExpression;
        }

        // 函数调用 f(...)
        if (opType === TokenType.LeftParen) {
            const args = this.parseArguments();
            this.expect(TokenType.RightParen, "Expected ')' after arguments");
            return {
                kind: 'CallExpression',
                callee: left,
                arguments: args,
                span: this.spanFromTo(left.span, this.lastTokenSpan()),
            } as CallExpression;
        }

        // 索引访问 a[...]
        if (opType === TokenType.LeftBracket) {
            const index = this.parseExpression();
            this.expect(TokenType.RightBracket, "Expected ']' after index");
            return {
                kind: 'IndexExpression',
                object: left,
                index,
                span: this.spanFromTo(left.span, this.lastTokenSpan()),
            } as IndexExpression;
        }

        // 成员访问 a.b
        if (opType === TokenType.Dot) {
            const member = this.expect(TokenType.Identifier, "Expected identifier after '.'");
            const ident: Identifier = {
                kind: 'Identifier',
                name: member.lexeme,
                span: member.span,
            };
            return {
                kind: 'MemberAccessExpression',
                object: left,
                member: ident,
                span: this.spanFromTo(left.span, member.span),
            } as MemberAccessExpression;
        }

        // 后缀 ++ / --
        if (opType === TokenType.PlusPlus || opType === TokenType.MinusMinus) {
            return {
                kind: 'UnaryExpression',
                operator: opType === TokenType.PlusPlus ? '++' : '--',
                operand: left,
                isPrefix: false,
                span: this.spanFromTo(left.span, token.span),
            } as UnaryExpression;
        }

        this.diagnostics.addError(`Unexpected operator '${token.lexeme}'`, token.span);
        return createErrorNode(`Unexpected operator '${token.lexeme}'`, token.span);
    }

    /**
     * 解析参数列表
     */
    parseArguments(): Expression[] {
        const args: Expression[] = [];
        const firstToken = this.current();

        if (firstToken && firstToken.type === TokenType.RightParen) {
            return args; // 空参数
        }

        if (firstToken && canStartExpression(firstToken.type)) {
            args.push(this.parseExpression());
            while (this.current() && this.current()!.type === TokenType.Comma) {
                this.advance(); // skip ,
                if (this.current() && this.current()!.type === TokenType.RightParen) {
                    break; // 允许尾部逗号
                }
                args.push(this.parseExpression());
            }
        }

        return args;
    }

    /**
     * 检查当前 token 是否可以开始一个表达式
     */
    canStart(): boolean {
        const token = this.current();
        if (!token) return false;
        return canStartExpression(token.type);
    }

    // --- Token 流操作 ---

    current(): Token | null {
        let p = this.pos;
        while (p < this.tokens.length && this.tokens[p].type === TokenType.Newline) {
            p++;
        }
        if (p >= this.tokens.length) return null;
        return this.tokens[p];
    }

    peek(): Token | null {
        let p = this.pos + 1;
        while (p < this.tokens.length && this.tokens[p].type === TokenType.Newline) {
            p++;
        }
        if (p >= this.tokens.length) return null;
        return this.tokens[p];
    }

    advance(): Token | null {
        while (this.pos < this.tokens.length && this.tokens[this.pos].type === TokenType.Newline) {
            this.pos++;
        }
        if (this.pos >= this.tokens.length) return null;
        return this.tokens[this.pos++];
    }

    expect(expected: TokenType, message: string): Token {
        const token = this.advance();
        if (!token) {
            throw new Error("Unexpected EOF: " + message);
        }
        if (token.type !== expected) {
            this.diagnostics.addError(
                `${message}. Expected '${expected}', got '${token.lexeme}'`,
                token.span,
            );
        }
        return token;
    }

    match(expected: TokenType): boolean {
        const token = this.current();
        if (!token) return false;
        if (token.type === expected) {
            this.advance();
            return true;
        }
        return false;
    }

    isAtEnd(): boolean {
        return this.pos >= this.tokens.length ||
            (this.pos === this.tokens.length - 1 &&
             this.tokens[this.pos].type === TokenType.EOF);
    }

    // --- 辅助 ---

    private getInfixPrecedence(type: TokenType): [Precedence, boolean] | null {
        // 先检查二元运算符
        if (BINARY_PRECEDENCE[type]) {
            return BINARY_PRECEDENCE[type]!;
        }
        // 特殊中缀
        switch (type) {
            case TokenType.Dot:
            case TokenType.LeftBracket:
            case TokenType.LeftParen:
                return [Precedence.Postfix, false];
            case TokenType.QuestionMark:
                return [Precedence.Ternary, true];
            case TokenType.PlusPlus:
            case TokenType.MinusMinus:
                return [Precedence.Postfix, false];
            default:
                return null;
        }
    }

    private spanFromTo(start: SourceSpan, end: SourceSpan): SourceSpan {
        return createSpan(start.start, end.end);
    }

    private lastTokenSpan(): SourceSpan {
        // 回退一个 token 获取 span
        for (let p = this.pos - 1; p >= 0; p--) {
            if (this.tokens[p].type !== TokenType.Newline) {
                return this.tokens[p].span;
            }
        }
        return { start: { offset: 0, line: 1, column: 1 }, end: { offset: 0, line: 1, column: 1 } };
    }

    private eofSpan(): SourceSpan {
        const last = this.tokens[this.tokens.length - 1];
        return last ? last.span : {
            start: { offset: 0, line: 1, column: 1 },
            end: { offset: 0, line: 1, column: 1 },
        };
    }
}
