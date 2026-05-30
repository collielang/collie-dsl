import { TokenType, Token } from '../../lexer/token';
import {
    FunctionDeclaration, Parameter, Identifier, TypeAnnotation,
    BlockStatement, ErrorNode, EnumDeclaration, EnumMember,
} from '../ast';
import { ExpressionParser } from './expressions';
import { StatementParser } from './statements';
import { DiagnosticBag } from '../../common/diagnostics';
import { createSpan, SourceSpan } from '../../common/source-location';
import { createErrorNode } from '../error-recovery';

/**
 * 声明解析器 — fn 函数、enum、class 声明
 */
export class DeclarationParser {
    private tokens: Token[];
    private pos: number;
    private exprParser: ExpressionParser;
    private stmtParser: StatementParser;
    private diagnostics: DiagnosticBag;

    constructor(
        tokens: Token[],
        exprParser: ExpressionParser,
        stmtParser: StatementParser,
        diagnostics: DiagnosticBag,
    ) {
        this.tokens = tokens;
        this.pos = 0;
        this.exprParser = exprParser;
        this.stmtParser = stmtParser;
        this.diagnostics = diagnostics;
    }

    setPosition(pos: number): void {
        this.pos = pos;
        this.exprParser.setPosition(pos);
        this.stmtParser.setPosition(pos);
    }

    getPosition(): number {
        return this.pos;
    }

    syncPosition(): void {
        this.pos = this.stmtParser.getPosition();
    }

    /**
     * 解析函数声明:
     * fn identifier ( params? ) (: returnTypes)? block
     */
    parseFunctionDeclaration(): FunctionDeclaration | ErrorNode {
        const fnToken = this.advance()!; // fn

        const nameToken = this.expect(TokenType.Identifier, 'Expected function name');
        const name: Identifier = { kind: 'Identifier', name: nameToken.lexeme, span: nameToken.span };

        this.expect(TokenType.LeftParen, "Expected '(' after function name");

        // 解析参数列表
        const params = this.parseParameters();

        this.expect(TokenType.RightParen, "Expected ')' after parameters");

        // 解析返回类型 (可选)
        let returnTypes: TypeAnnotation[] = [];
        if (this.current() && this.current()!.type === TokenType.Colon) {
            this.advance(); // skip :
            this.parseReturnTypes(returnTypes);
        }

        // 函数体
        this.stmtParser.setPosition(this.pos);
        const body = this.stmtParser.parseBlock();
        this.syncPosition();

        return {
            kind: 'FunctionDeclaration',
            name,
            parameters: params,
            returnTypes,
            body,
            span: createSpan(fnToken.span.start, body.span.end),
        };
    }

    /**
     * 解析枚举声明:
     * enum Identifier { Member1, Member2 = value, ... }
     */
    parseEnumDeclaration(): EnumDeclaration | ErrorNode {
        const enumToken = this.advance()!; // enum

        const nameToken = this.expect(TokenType.Identifier, 'Expected enum name');
        const name: Identifier = { kind: 'Identifier', name: nameToken.lexeme, span: nameToken.span };

        this.expect(TokenType.LeftBrace, "Expected '{' after enum name");

        const members: EnumMember[] = [];
        while (true) {
            const memberToken = this.current();
            if (!memberToken || memberToken.type === TokenType.RightBrace) break;
            if (memberToken.type === TokenType.EOF) {
                this.diagnostics.addError('Unclosed enum body', enumToken.span);
                break;
            }

            if (memberToken.type !== TokenType.Identifier) {
                this.diagnostics.addError(
                    `Expected enum member name, got '${memberToken.lexeme}'`,
                    memberToken.span,
                );
                this.advance();
                continue;
            }
            this.advance(); // consume member name

            const memberName: Identifier = {
                kind: 'Identifier',
                name: memberToken.lexeme,
                span: memberToken.span,
            };
            let memberValue = null;

            // 可选值: Member = expression
            if (this.current() && this.current()!.type === TokenType.Equals) {
                this.advance(); // skip =
                this.exprParser.setPosition(this.pos);
                memberValue = this.exprParser.parseExpression();
                this.pos = this.exprParser.getPosition();
            }

            members.push({
                kind: 'EnumMember',
                name: memberName,
                value: memberValue,
                span: memberValue
                    ? createSpan(memberToken.span.start, memberValue.span.end)
                    : memberToken.span,
            });

            if (this.current() && this.current()!.type === TokenType.Comma) {
                this.advance();
            } else {
                break;
            }
        }

        this.expect(TokenType.RightBrace, "Expected '}' after enum members");

        return {
            kind: 'EnumDeclaration',
            name,
            members,
            span: createSpan(enumToken.span.start, this.lastTokenSpan().end),
        };
    }

    /**
     * 解析参数列表: (name: Type, name: Type, ...)
     */
    parseParameters(): Parameter[] {
        const params: Parameter[] = [];

        const first = this.current();
        if (!first || first.type !== TokenType.Identifier) {
            return params; // 空参数列表
        }

        // 第一个参数
        const param = this.parseParameter();
        if (param) params.push(param);

        // 后续参数
        while (this.current() && this.current()!.type === TokenType.Comma) {
            this.advance(); // skip ,
            const nextParam = this.parseParameter();
            if (nextParam) params.push(nextParam);
        }

        return params;
    }

    /**
     * 解析单个参数: name: Type
     */
    parseParameter(): Parameter | null {
        const nameToken = this.current();
        if (!nameToken || nameToken.type !== TokenType.Identifier) {
            return null;
        }
        this.advance();
        const name: Identifier = { kind: 'Identifier', name: nameToken.lexeme, span: nameToken.span };

        this.expect(TokenType.Colon, "Expected ':' after parameter name");

        const typeToken = this.advance();
        if (!typeToken) {
            this.diagnostics.addError('Expected type annotation', this.eofSpan());
            return null;
        }
        const paramType: TypeAnnotation = {
            kind: 'IdentifierType',
            name: typeToken.lexeme,
            span: typeToken.span,
        };

        return {
            kind: 'Parameter',
            name,
            paramType,
            span: createSpan(nameToken.span.start, typeToken.span.end),
        };
    }

    /**
     * 解析返回类型: Type1, Type2, ... (多返回值)
     */
    parseReturnTypes(types: TypeAnnotation[]): void {
        const typeToken = this.advance();
        if (!typeToken) return;
        types.push({
            kind: 'IdentifierType',
            name: typeToken.lexeme,
            span: typeToken.span,
        });

        // 逗号分隔的多返回值类型
        while (this.current() && this.current()!.type === TokenType.Comma) {
            this.advance(); // skip ,
            const nextType = this.advance();
            if (!nextType) break;
            types.push({
                kind: 'IdentifierType',
                name: nextType.lexeme,
                span: nextType.span,
            });
        }
    }

    // --- Token 流操作 ---

    current(): Token | null {
        return this.skipNewlines(this.pos)[0];
    }

    advance(): Token | null {
        const [token, nextPos] = this.skipNewlines(this.pos);
        this.pos = nextPos;
        if (token) this.pos++;
        return token;
    }

    expect(expected: TokenType, message: string): Token {
        const token = this.advance();
        if (!token) {
            return { type: TokenType.Error, lexeme: '', span: this.eofSpan(),
                     leadingTrivia: [], trailingTrivia: [], flags: 0, errorMessage: 'EOF: ' + message };
        }
        if (token.type !== expected) {
            this.diagnostics.addError(`${message}. Expected '${expected}', got '${token.lexeme}'`, token.span);
        }
        return token;
    }

    private skipNewlines(fromPos: number): [Token | null, number] {
        let p = fromPos;
        while (p < this.tokens.length && this.tokens[p].type === TokenType.Newline) {
            p++;
        }
        if (p >= this.tokens.length) return [null, p];
        return [this.tokens[p], p];
    }

    private eofSpan(): SourceSpan {
        const last = this.tokens[this.tokens.length - 1];
        return last ? last.span : {
            start: { offset: 0, line: 1, column: 1 },
            end: { offset: 0, line: 1, column: 1 },
        };
    }

    private lastTokenSpan(): SourceSpan {
        for (let p = this.pos - 1; p >= 0; p--) {
            if (this.tokens[p].type !== TokenType.Newline) {
                return this.tokens[p].span;
            }
        }
        return this.eofSpan();
    }
}
