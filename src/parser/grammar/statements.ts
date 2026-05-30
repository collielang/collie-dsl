import { TokenType, Token, canStartExpression } from '../../lexer/token';
import {
    Statement, BlockStatement, IfStatement, WhileStatement, DoWhileStatement,
    ForStatement, ReturnStatement, BreakStatement, ContinueStatement,
    ExpressionStatement, Expression, Identifier, VariableDeclaration,
    MultiVariableDeclaration, ErrorNode,
} from '../ast';
import { ExpressionParser } from './expressions';
import { TypeParser } from './types';
import { DiagnosticBag } from '../../common/diagnostics';
import { createSpan, SourceSpan } from '../../common/source-location';
import { createErrorNode, isSyncPoint } from '../error-recovery';

/**
 * 语句解析器 — 递归下降解析所有语句类型
 */
export class StatementParser {
    private tokens: Token[];
    private pos: number;
    private exprParser: ExpressionParser;
    private typeParser: TypeParser;
    private diagnostics: DiagnosticBag;

    constructor(
        tokens: Token[],
        exprParser: ExpressionParser,
        diagnostics: DiagnosticBag,
    ) {
        this.tokens = tokens;
        this.pos = 0;
        this.exprParser = exprParser;
        this.typeParser = new TypeParser(tokens);
        this.diagnostics = diagnostics;
    }

    setPosition(pos: number): void {
        this.pos = pos;
        this.exprParser.setPosition(pos);
        this.typeParser.setPosition(pos);
    }

    getPosition(): number {
        return this.pos;
    }

    syncPosition(): void {
        this.pos = this.exprParser.getPosition();
    }

    /**
     * 解析一条语句
     */
    parseStatement(): Statement {
        const token = this.current();
        if (!token) {
            return createErrorNode('Unexpected end of input', this.eofSpan());
        }

        // 跳过错误 token
        if (token.type === TokenType.Error) {
            this.advance();
            return createErrorNode(token.errorMessage || 'Lexer error', token.span);
        }

        switch (token.type) {
            // 变量声明: 类型名 标识符 = ...; 或 var 标识符 = ...;
            case TokenType.NumberType:
            case TokenType.IntegerType:
            case TokenType.DecimalType:
            case TokenType.StringType:
            case TokenType.CharType:
            case TokenType.CharacterType:
            case TokenType.BoolType:
            case TokenType.TriboolType:
            case TokenType.BitType:
            case TokenType.ByteType:
            case TokenType.WordType:
            case TokenType.DwordType:
            case TokenType.FloatType:
            case TokenType.DoubleType:
            case TokenType.ObjectType:
            case TokenType.None:
            case TokenType.ListType:
            case TokenType.SetType:
            case TokenType.MapType:
            case TokenType.BufferType:
                // 需要区分: 可能的 for 循环类型标注 VS 变量声明
                // peek: 下一个是标识符 && 下一个的下一个是 =
                return this.tryParseVariableDeclarationOrExpression();

            case TokenType.Var:
                return this.parseVariableDeclaration();

            // Block
            case TokenType.LeftBrace:
                return this.parseBlock();

            // if
            case TokenType.If:
                return this.parseIfStatement();

            // while
            case TokenType.While:
                return this.parseWhileStatement();

            // do
            case TokenType.Do:
                return this.parseDoWhileStatement();

            // for
            case TokenType.For:
                return this.parseForStatement();

            // return
            case TokenType.Return:
                return this.parseReturnStatement();

            // break
            case TokenType.Break:
                return this.parseBreakStatement();

            // continue
            case TokenType.Continue:
                return this.parseContinueStatement();

            // 表达式语句 (以表达式起始的 token)
            default:
                if (canStartExpression(token.type) || token.type === TokenType.PlusPlus || token.type === TokenType.MinusMinus) {
                    return this.parseExpressionStatement();
                }
                // 无法处理的 token → 错误恢复
                return this.skipToRecovery(
                    `Unexpected token '${token.lexeme}' at start of statement`,
                    token.span,
                );
        }
    }

    /**
     * 变量声明: TypeName identifier = expression;
     * 或: var identifier = expression;
     */
    parseVariableDeclaration(): VariableDeclaration | ExpressionStatement {
        const token = this.advance()!;
        const isVar = token.type === TokenType.Var;

        let varType = null;
        if (!isVar) {
            // 类型关键字作为类型注解
            varType = { kind: 'IdentifierType' as const, name: token.lexeme, span: token.span };
        }

        const nameToken = this.expect(TokenType.Identifier, 'Expected variable name');
        const name: Identifier = { kind: 'Identifier', name: nameToken.lexeme, span: nameToken.span };

        this.expect(TokenType.Equals, "Expected '=' in variable declaration");
        this.exprParser.setPosition(this.pos);
        const init = this.exprParser.parseExpression();
        this.syncPosition();

        this.expect(TokenType.Semicolon, "Expected ';' after variable declaration");

        return {
            kind: 'VariableDeclaration',
            varType,
            name,
            initializer: init,
            span: createSpan(token.span.start, this.lastTokenSpan().end),
        };
    }

    /**
     * 尝试解析变量声明，如果失败则回退为表达式语句
     * 支持: TypeName id = expr;  和  TypeName id1, id2, ... = expr;
     */
    private tryParseVariableDeclarationOrExpression(): Statement {
        const savedPos = this.getPosition();
        const token = this.advance()!;

        const nameToken = this.current();
        if (nameToken && nameToken.type === TokenType.Identifier) {
            const afterName = this.peek();

            // 单变量声明: TypeName id = expr;
            if (afterName && afterName.type === TokenType.Equals) {
                const varType = { kind: 'IdentifierType' as const, name: token.lexeme, span: token.span };
                this.advance(); // skip name
                const name: Identifier = { kind: 'Identifier', name: nameToken.lexeme, span: nameToken.span };

                this.advance(); // skip =

                this.exprParser.setPosition(this.pos);
                const init = this.exprParser.parseExpression();
                this.syncPosition();

                this.expect(TokenType.Semicolon, "Expected ';' after variable declaration");

                return {
                    kind: 'VariableDeclaration',
                    varType,
                    name,
                    initializer: init,
                    span: createSpan(token.span.start, this.lastTokenSpan().end),
                };
            }

            // 多变量声明: TypeName id1, id2, ... = expr;
            if (afterName && afterName.type === TokenType.Comma) {
                const varType = { kind: 'IdentifierType' as const, name: token.lexeme, span: token.span };
                const names: Identifier[] = [
                    { kind: 'Identifier', name: nameToken.lexeme, span: nameToken.span },
                ];
                this.advance(); // skip first name

                // 解析逗号分隔的变量名
                while (this.current() && this.current()!.type === TokenType.Comma) {
                    this.advance(); // skip ,
                    const nextName = this.expect(TokenType.Identifier, 'Expected variable name after comma');
                    names.push({ kind: 'Identifier', name: nextName.lexeme, span: nextName.span });
                }

                this.expect(TokenType.Equals, "Expected '=' in multi-variable declaration");

                this.exprParser.setPosition(this.pos);
                const init = this.exprParser.parseExpression();
                this.syncPosition();

                this.expect(TokenType.Semicolon, "Expected ';' after multi-variable declaration");

                return {
                    kind: 'MultiVariableDeclaration',
                    varType,
                    names,
                    initializer: init,
                    span: createSpan(token.span.start, this.lastTokenSpan().end),
                };
            }
        }

        // 回退 — 作为表达式语句处理
        this.setPosition(savedPos);
        return this.parseExpressionStatement();
    }

    /**
     * 解析语句块 { ... }
     */
    parseBlock(): BlockStatement {
        this.advance(); // skip {
        const statements: Statement[] = [];

        while (true) {
            const token = this.current();
            if (!token || token.type === TokenType.EOF) {
                this.diagnostics.addError("Unclosed block, expected '}'", this.eofSpan());
                break;
            }
            if (token.type === TokenType.RightBrace) {
                break;
            }
            statements.push(this.parseStatement());
        }

        this.expect(TokenType.RightBrace, "Expected '}' to close block");
        return {
            kind: 'BlockStatement',
            statements,
            span: this.spanOfBlock(statements),
        };
    }

    /**
     * if (condition) consequent else alternate
     */
    parseIfStatement(): IfStatement {
        const ifToken = this.advance()!;
        this.expect(TokenType.LeftParen, "Expected '(' after 'if'");
        this.exprParser.setPosition(this.pos);
        const condition = this.exprParser.parseExpression();
        this.syncPosition();
        this.expect(TokenType.RightParen, "Expected ')' after condition");

        const consequent = this.parseStatement();

        let alternate: Statement | null = null;
        const elseToken = this.current();
        if (elseToken && elseToken.type === TokenType.Else) {
            this.advance(); // skip else
            alternate = this.parseStatement();
        }

        return {
            kind: 'IfStatement',
            condition,
            consequent,
            alternate,
            span: createSpan(ifToken.span.start,
                (alternate || consequent).span.end),
        };
    }

    /**
     * while (condition) body
     */
    parseWhileStatement(): WhileStatement {
        const whileToken = this.advance()!;
        this.expect(TokenType.LeftParen, "Expected '(' after 'while'");
        this.exprParser.setPosition(this.pos);
        const condition = this.exprParser.parseExpression();
        this.syncPosition();
        this.expect(TokenType.RightParen, "Expected ')' after condition");

        const body = this.parseStatement();

        return {
            kind: 'WhileStatement',
            condition,
            body,
            span: createSpan(whileToken.span.start, body.span.end),
        };
    }

    /**
     * do body while (condition);
     */
    parseDoWhileStatement(): DoWhileStatement {
        const doToken = this.advance()!;
        const body = this.parseStatement();

        this.expect(TokenType.While, "Expected 'while' after 'do' body");
        this.expect(TokenType.LeftParen, "Expected '(' after 'while'");
        this.exprParser.setPosition(this.pos);
        const condition = this.exprParser.parseExpression();
        this.syncPosition();
        this.expect(TokenType.RightParen, "Expected ')' after condition");
        this.expect(TokenType.Semicolon, "Expected ';' after do-while");

        return {
            kind: 'DoWhileStatement',
            body,
            condition,
            span: createSpan(doToken.span.start, this.lastTokenSpan().end),
        };
    }

    /**
     * for 语句 — C-style 和 for-each
     */
    parseForStatement(): ForStatement {
        const forToken = this.advance()!;
        this.expect(TokenType.LeftParen, "Expected '(' after 'for'");

        // 判断 for 类型
        const first = this.current();
        if (!first) {
            this.diagnostics.addError('Unexpected end of input in for statement', forToken.span);
            return this.placeholderFor(forToken.span);
        }

        // 空 C-style: for (; ...; ...)
        if (first.type === TokenType.Semicolon) {
            return this.parseForCStyle(forToken.span, null);
        }

        // C-style 变量声明: for (TypeName id = ...; ...; ...) 或 for (var id = ...; ...; ...)
        if (first.type === TokenType.Var) {
            const savedPos = this.getPosition();
            this.advance(); // var
            const id = this.current();
            if (id && id.type === TokenType.Identifier) {
                const afterId = this.peek();
                if (afterId && afterId.type === TokenType.Equals) {
                    // C-style with var declaration
                    this.setPosition(savedPos);
                    const varDecl = this.parseVariableDeclarationInFor();
                    return this.parseForCStyle(forToken.span, varDecl);
                }
            }
            this.setPosition(savedPos);
            // 作为表达式处理
            return this.parseForCStyle(forToken.span, null);
        }

        if (this.isTypeKeyword(first.type)) {
            const savedPos = this.getPosition();
            this.advance(); // type
            const id = this.current();
            if (id && id.type === TokenType.Identifier) {
                const afterId = this.peek();
                if (afterId && afterId.type === TokenType.Equals) {
                    this.setPosition(savedPos);
                    const varDecl = this.parseVariableDeclarationInFor();
                    return this.parseForCStyle(forToken.span, varDecl);
                }
            }
            this.setPosition(savedPos);
            // 作为表达式处理
            return this.parseForCStyle(forToken.span, null);
        }

        // 可能是: IDENTIFIER , → for-each with index
        //          IDENTIFIER : → for-each
        //          IDENTIFIER in → for-each
        if (first.type === TokenType.Identifier) {
            const second = this.peek();
            if (second && second.type === TokenType.Comma) {
                // for-each with index
                return this.parseForEach(forToken.span);
            }
            if (second && (second.type === TokenType.Colon || second.type === TokenType.In)) {
                return this.parseForEach(forToken.span);
            }
        }

        // 默认为 C-style 表达式初始化
        return this.parseForCStyle(forToken.span, null);
    }

    private parseForCStyle(spanStart: SourceSpan, initDecl: VariableDeclaration | null): ForStatement {
        // 左括号已消费

        // init (可能是 VariableDeclaration, Expression, 或空)
        let init: Statement | Expression | null = initDecl;
        if (!initDecl) {
            const first = this.current();
            if (first && first.type !== TokenType.Semicolon && canStartExpression(first.type)) {
                this.exprParser.setPosition(this.pos);
                init = this.exprParser.parseExpression();
                this.syncPosition();
            }
        }
        this.expect(TokenType.Semicolon, "Expected ';' in for loop");

        // condition
        let condition: Expression | null = null;
        this.exprParser.setPosition(this.pos);
        if (this.exprParser.canStart()) {
            condition = this.exprParser.parseExpression();
            this.syncPosition();
        }
        this.expect(TokenType.Semicolon, "Expected ';' in for loop");

        // update
        let update: Expression | null = null;
        this.exprParser.setPosition(this.pos);
        if (this.exprParser.canStart()) {
            update = this.exprParser.parseExpression();
            this.syncPosition();
        }
        this.expect(TokenType.RightParen, "Expected ')' after for clauses");

        const body = this.parseStatement();

        return {
            kind: 'ForStatement',
            forKind: 'c-style',
            init, condition, update,
            loopVariable: null, indexVariable: null, iterable: null,
            body,
            span: createSpan(spanStart.start, body.span.end),
        };
    }

    private parseForEach(spanStart: SourceSpan): ForStatement {
        // 左括号已消费

        let loopVariable: Identifier | null = null;
        let indexVariable: Identifier | null = null;

        const first = this.advance()!; // identifier or ,/:
        loopVariable = { kind: 'Identifier', name: first.lexeme, span: first.span };

        const second = this.current();
        if (second && second.type === TokenType.Comma) {
            this.advance(); // ,
            const idx = this.expect(TokenType.Identifier, 'Expected index variable after comma');
            indexVariable = { kind: 'Identifier', name: idx.lexeme, span: idx.span };

            const sep = this.current();
            if (sep && (sep.type === TokenType.Colon || sep.type === TokenType.In)) {
                this.advance(); // : or in
            } else {
                this.diagnostics.addError("Expected ':' or 'in' in for-each loop", sep ? sep.span : this.eofSpan());
            }
        } else if (second) {
            if (second.type === TokenType.Colon || second.type === TokenType.In) {
                this.advance(); // : or in
            } else {
                this.diagnostics.addError("Expected ':' or 'in' in for-each loop", second.span);
            }
        }

        // iterable
        this.exprParser.setPosition(this.pos);
        let iterable: Expression | null = null;
        if (this.exprParser.canStart()) {
            iterable = this.exprParser.parseExpression();
            this.syncPosition();
        }
        this.expect(TokenType.RightParen, "Expected ')' after for-each expression");

        const body = this.parseStatement();

        return {
            kind: 'ForStatement',
            forKind: 'each',
            init: null, condition: null, update: null,
            loopVariable, indexVariable, iterable,
            body,
            span: createSpan(spanStart.start, body.span.end),
        };
    }

    /**
     * 解析 for 初始化中的变量声明
     */
    private parseVariableDeclarationInFor(): VariableDeclaration {
        const token = this.advance()!;
        const isVar = token.type === TokenType.Var;

        let varType = null;
        if (!isVar) {
            varType = { kind: 'IdentifierType' as const, name: token.lexeme, span: token.span };
        }

        const nameToken = this.expect(TokenType.Identifier, 'Expected variable name');
        const name: Identifier = { kind: 'Identifier', name: nameToken.lexeme, span: nameToken.span };

        this.expect(TokenType.Equals, "Expected '=' in variable declaration");
        this.exprParser.setPosition(this.pos);
        const init = this.exprParser.parseExpression();
        this.syncPosition();

        return { kind: 'VariableDeclaration', varType, name, initializer: init, span: createSpan(token.span.start, init.span.end) };
    }

    /**
     * return expression, ...;
     */
    parseReturnStatement(): ReturnStatement {
        const retToken = this.advance()!;
        const values: Expression[] = [];

        this.exprParser.setPosition(this.pos);
        if (this.exprParser.canStart()) {
            values.push(this.exprParser.parseExpression());
            this.syncPosition();
            // 多返回值: 逗号分隔
            while (this.current() && this.current()!.type === TokenType.Comma) {
                this.advance(); // skip ,
                this.exprParser.setPosition(this.pos);
                if (this.exprParser.canStart()) {
                    values.push(this.exprParser.parseExpression());
                    this.syncPosition();
                } else {
                    break;
                }
            }
        }
        this.expect(TokenType.Semicolon, "Expected ';' after return statement");

        return {
            kind: 'ReturnStatement',
            values,
            span: createSpan(retToken.span.start, this.lastTokenSpan().end),
        };
    }

    /**
     * break [label];
     */
    parseBreakStatement(): BreakStatement {
        const breakToken = this.advance()!;
        let label: Identifier | null = null;
        const next = this.current();
        if (next && next.type === TokenType.Identifier && !isSyncPoint(this.peek()?.type || TokenType.EOF)) {
            // 暂不实现 label
        }
        this.expect(TokenType.Semicolon, "Expected ';' after break");
        return { kind: 'BreakStatement', label, span: breakToken.span };
    }

    /**
     * continue [label];
     */
    parseContinueStatement(): ContinueStatement {
        const contToken = this.advance()!;
        let label: Identifier | null = null;
        this.expect(TokenType.Semicolon, "Expected ';' after continue");
        return { kind: 'ContinueStatement', label, span: contToken.span };
    }

    /**
     * expression;
     */
    parseExpressionStatement(): ExpressionStatement {
        this.exprParser.setPosition(this.pos);
        const expr = this.exprParser.parseExpression();
        this.syncPosition();
        this.expect(TokenType.Semicolon, "Expected ';' after expression");
        return { kind: 'ExpressionStatement', expression: expr, span: expr.span };
    }

    // --- 错误恢复 ---

    skipToRecovery(message: string, span: SourceSpan): ErrorNode {
        this.diagnostics.addError(message, span);
        this.advance(); // skip the problematic token

        // 跳到下一个同步点
        while (true) {
            const token = this.current();
            if (!token || token.type === TokenType.EOF) break;
            if (isSyncPoint(token.type)) break;
            this.advance();
        }

        return createErrorNode(message, span);
    }

    // --- Token 流操作 ---

    current(): Token | null {
        return this.skipNewlines(this.pos)[0];
    }

    peek(): Token | null {
        const [_, nextPos] = this.skipNewlines(this.pos);
        return this.skipNewlines(nextPos + 1)[0];
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

    match(expected: TokenType): boolean {
        const token = this.current();
        if (token && token.type === expected) {
            this.advance();
            return true;
        }
        return false;
    }

    private skipNewlines(fromPos: number): [Token | null, number] {
        let p = fromPos;
        while (p < this.tokens.length && this.tokens[p].type === TokenType.Newline) {
            p++;
        }
        if (p >= this.tokens.length) return [null, p];
        return [this.tokens[p], p];
    }

    private lastTokenSpan(): SourceSpan {
        for (let p = this.pos - 1; p >= 0; p--) {
            if (this.tokens[p].type !== TokenType.Newline) {
                return this.tokens[p].span;
            }
        }
        return this.eofSpan();
    }

    private isTypeKeyword(type: TokenType): boolean {
        return type === TokenType.NumberType || type === TokenType.IntegerType ||
            type === TokenType.DecimalType || type === TokenType.StringType ||
            type === TokenType.CharType || type === TokenType.CharacterType ||
            type === TokenType.BoolType || type === TokenType.TriboolType ||
            type === TokenType.BitType || type === TokenType.ByteType ||
            type === TokenType.WordType || type === TokenType.DwordType ||
            type === TokenType.FloatType || type === TokenType.DoubleType ||
            type === TokenType.ObjectType || type === TokenType.None ||
            type === TokenType.ListType || type === TokenType.SetType ||
            type === TokenType.MapType || type === TokenType.BufferType;
    }

    private spanOfBlock(statements: Statement[]): SourceSpan {
        return { start: { offset: 0, line: 1, column: 1 }, end: { offset: 0, line: 1, column: 1 } };
    }

    private placeholderFor(span: SourceSpan): ForStatement {
        return {
            kind: 'ForStatement', forKind: 'c-style',
            init: null, condition: null, update: null,
            loopVariable: null, indexVariable: null, iterable: null,
            body: createErrorNode('Invalid for statement', span),
            span,
        };
    }

    private eofSpan(): SourceSpan {
        const last = this.tokens[this.tokens.length - 1];
        return last ? last.span : {
            start: { offset: 0, line: 1, column: 1 },
            end: { offset: 0, line: 1, column: 1 },
        };
    }
}
