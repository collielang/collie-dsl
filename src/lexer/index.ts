import { Scanner } from './scanner';
import {
    Token, TokenType, TokenFlags, CommentToken,
    canStartExpression,
} from './token';
import { lookupKeyword } from './keywords';
import { SourceSpan, createSpan } from '../common/source-location';

/**
 * Lexer — 词法分析器
 *
 * 将 Collie 源码字符流转换为 Token 序列。
 * 支持: 关键字、标识符、数字(十进制/十六进制/二进制/八进制)、字符串、字符、运算符、分隔符、
 *       单行注释、嵌套块注释、文档注释、段落注释、字符串插值(P2)
 *
 * 错误处理: 永不抛异常，产生 Error token 并继续扫描。
 */
export class Lexer {
    private readonly scanner: Scanner;
    private readonly tokens: Token[] = [];
    private readonly pendingComments: CommentToken[] = [];

    constructor(source: string) {
        this.scanner = new Scanner(source);
    }

    /**
     * 一次性拆解所有 token (批量模式)
     */
    tokenize(): Token[] {
        const tokens: Token[] = [];
        while (true) {
            const token = this.nextToken();
            tokens.push(token);
            if (token.type === TokenType.EOF) break;
        }
        return tokens;
    }

    /**
     * 逐个产生 token (迭代器模式)
     */
    *[Symbol.iterator](): Generator<Token> {
        while (true) {
            const token = this.nextToken();
            yield token;
            if (token.type === TokenType.EOF) break;
        }
    }

    /**
     * 核心循环: 产生下一个 token
     */
    nextToken(): Token {
        // 跳过空白
        this.scanner.skipWhitespace();

        // 标记 token 起始
        this.scanner.markTokenStart();

        if (this.scanner.isAtEnd) {
            return this.makeToken(TokenType.EOF, '');
        }

        const ch = this.scanner.peek();

        // 换行 — 不消耗 pending comments
        if (ch === '\n' || ch === '\r') {
            this.scanner.advance(); // 消费 \n (或 \r\n)
            return {
                type: TokenType.Newline,
                lexeme: '\n',
                span: this.tokenSpan(),
                leadingTrivia: [],
                trailingTrivia: [],
                flags: TokenFlags.None,
            };
        }

        // 注释: / 开头
        if (ch === '/') {
            return this.handleSlash();
        }

        // 字符串: "
        if (ch === '"') {
            return this.readString();
        }

        // 字符字面量: '
        if (ch === "'") {
            return this.readCharLiteral();
        }

        // 数字: 0-9 或 .数字
        if ((ch >= '0' && ch <= '9') || (ch === '.' && this.isDigit(this.scanner.peekAhead(1)))) {
            return this.readNumber();
        }

        // 标识符或关键字
        if (this.isIdentifierStart(ch)) {
            return this.readIdentifierOrKeyword();
        }

        // 运算符 + 分隔符
        return this.readOperatorOrPunctuator();
    }

    // ============================================================
    // 注释处理
    // ============================================================

    private handleSlash(): Token {
        const next = this.scanner.peekAhead(1);

        // 单行注释 //
        if (next === '/') {
            return this.readLineComment();
        }

        // 多行注释 /* 或文档注释 /**
        if (next === '*') {
            this.scanner.advance(); // skip /
            this.scanner.advance(); // skip *
            const isDoc = this.scanner.peek() === '*' && this.scanner.peekAhead(1) !== '/';
            if (isDoc) {
                this.scanner.advance(); // skip extra * for /**
            }
            return this.readBlockComment(isDoc);
        }

        // 段落注释结束 .../
        if (next === '.' && this.scanner.peekAhead(2) === '.' && this.scanner.peekAhead(3) === '/') {
            // .../ — 段落注释的结束标记
            this.scanner.skipN(4); // skip .../
            const text = this.scanner.extractToken();
            const comment: CommentToken = {
                text,
                isBlock: false,
                isDoc: false,
                isParagraph: true,
                span: this.tokenSpan(),
            };
            this.pendingComments.push(comment);
            return this.nextToken(); // 跳过注释，继续下一个 token
        }

        // /... — 段落注释的开始
        if (next === '.' && this.scanner.peekAhead(2) === '.' && this.scanner.peekAhead(3) === '.') {
            this.scanner.advance(); // skip /
            return this.readParagraphComment();
        }

        // 普通除号
        return this.readOperatorOrPunctuator();
    }

    /**
     * 单行注释 //
     */
    private readLineComment(): Token {
        this.scanner.advance(); // skip first /
        this.scanner.advance(); // skip second /

        const startOffset = this.scanner.currentOffset;
        this.scanner.skipToEndOfLine();
        const text = this.scanner.extractFrom(startOffset);

        const comment: CommentToken = {
            text,
            isBlock: false,
            isDoc: false,
            isParagraph: false,
            span: this.tokenSpan(),
        };
        this.pendingComments.push(comment);

        return this.nextToken(); // 跳过注释，继续下一个 token
    }

    /**
     * 块注释 /* ... *​/ (支持嵌套)
     */
    private readBlockComment(isDoc: boolean): Token {
        let depth = 1;
        const startOffset = this.scanner.currentOffset;

        while (!this.scanner.isAtEnd && depth > 0) {
            if (this.scanner.peek() === '/' && this.scanner.peekAhead(1) === '*') {
                if (this.scanner.peekAhead(1) === '*' && this.scanner.peekAhead(2) === '/') {
                    // /**/ — 空文档注释，不嵌套
                }
                this.scanner.skipN(2);
                depth++;
            } else if (this.scanner.peek() === '*' && this.scanner.peekAhead(1) === '/') {
                this.scanner.skipN(2);
                depth--;
            } else {
                this.scanner.advance();
            }
        }

        if (depth > 0) {
            // 未闭合的块注释 — 产生 Error token
            return this.errorToken('Unterminated block comment');
        }

        // 提取注释文本 (去掉结尾的 */)
        const fullText = this.scanner.extractFrom(startOffset);
        const text = fullText.substring(0, fullText.length - 2);

        const comment: CommentToken = {
            text,
            isBlock: true,
            isDoc,
            isParagraph: false,
            span: this.tokenSpan(),
        };
        this.pendingComments.push(comment);

        return this.nextToken();
    }

    /**
     * 段落注释 /... .../
     * /... 开始，直到 .../ 或 EOF
     */
    private readParagraphComment(): Token {
        this.scanner.skipN(3); // skip . . .
        // 跳过当前行剩余部分 (到行尾)
        this.scanner.skipToEndOfLine();
        if (this.scanner.peek() === '\r' || this.scanner.peek() === '\n') {
            this.scanner.advance();
        }

        const startOffset = this.scanner.currentOffset;

        // 逐行扫描直到遇到 .../ 或 EOF
        while (!this.scanner.isAtEnd) {
            // 检查当前行是否为 .../
            const restOfLine = this.scanner.peekRestOfLine().trim();
            if (restOfLine === '.../') {
                // 找到结束标记
                this.scanner.skipToEndOfLine();
                if (!this.scanner.isAtEnd) {
                    this.scanner.advance(); // skip newline
                }
                break;
            }

            // 跳过当前行
            this.scanner.skipToEndOfLine();
            if (!this.scanner.isAtEnd) {
                this.scanner.advance(); // skip newline
            }
        }

        const text = this.scanner.extractFrom(startOffset);

        const comment: CommentToken = {
            text,
            isBlock: false,
            isDoc: false,
            isParagraph: true,
            span: this.tokenSpan(),
        };
        this.pendingComments.push(comment);

        return this.nextToken();
    }

    // ============================================================
    // 字符串处理
    // ============================================================

    /**
     * 双引号字符串 "..." 或多行字符串 """..."""
     */
    private readString(): Token {
        this.scanner.advance(); // skip opening "

        // 检查是否为多行字符串 """
        if (this.scanner.peek() === '"' && this.scanner.peekAhead(1) === '"') {
            return this.readMultiLineString();
        }

        return this.readSingleLineString();
    }

    /**
     * 单行字符串 "..."
     */
    private readSingleLineString(): Token {
        let value = '';
        while (!this.scanner.isAtEnd) {
            const ch = this.scanner.peek();
            if (ch === '"') {
                this.scanner.advance(); // skip closing "
                return this.makeToken(TokenType.StringLiteral, value, value);
            }
            if (ch === '\\') {
                value += this.readEscapeSequence();
            } else if (ch === '\n' || ch === '\r') {
                return this.errorToken('Unterminated string literal');
            } else {
                value += ch;
                this.scanner.advance();
            }
        }
        return this.errorToken('Unterminated string literal');
    }

    /**
     * 多行字符串 """..."""
     */
    private readMultiLineString(): Token {
        this.scanner.skipN(2); // skip remaining ""

        let value = '';
        while (!this.scanner.isAtEnd) {
            const ch = this.scanner.peek();
            if (ch === '"' && this.scanner.peekAhead(1) === '"' && this.scanner.peekAhead(2) === '"') {
                this.scanner.skipN(3); // skip closing """
                return this.makeToken(TokenType.MultiLineStringLiteral, value, value);
            }
            if (ch === '\r' || ch === '\n') {
                value += '\n';
                this.scanner.advance();
            } else {
                value += ch;
                this.scanner.advance();
            }
        }
        return this.errorToken('Unterminated multi-line string');
    }

    /**
     * 字符字面量 'x'
     */
    private readCharLiteral(): Token {
        this.scanner.advance(); // skip '

        if (this.scanner.isAtEnd) {
            return this.errorToken('Unterminated character literal');
        }

        let value: string;
        if (this.scanner.peek() === '\\') {
            value = this.readEscapeSequence();
        } else {
            value = this.scanner.peek();
            this.scanner.advance();
        }

        if (this.scanner.peek() !== "'") {
            return this.errorToken('Unterminated character literal');
        }
        this.scanner.advance(); // skip closing '

        return this.makeToken(TokenType.CharLiteral, value, value);
    }

    /**
     * 读取转义序列
     */
    private readEscapeSequence(): string {
        this.scanner.advance(); // skip \
        const ch = this.scanner.peek();
        this.scanner.advance();

        switch (ch) {
            case 'n': return '\n';
            case 't': return '\t';
            case 'r': return '\r';
            case '\\': return '\\';
            case '"': return '"';
            case "'": return "'";
            case '0': return '\0';
            default: return ch; // 未知转义，保留原字符
        }
    }

    // ============================================================
    // 数字处理
    // ============================================================

    /**
     * 数字字面量:
     *   十进制: 123, 3.14, 1_000
     *   十六进制: 0xFF
     *   二进制: 0b1010
     *   八进制: 0o777
     *   f 后缀: 2f (float)
     */
    private readNumber(): Token {
        let numStr = '';
        let hasDot = false;
        let hasExp = false;
        let isFloat = false;

        // 处理 0x / 0b / 0o 前缀
        if (this.scanner.peek() === '0') {
            numStr += this.scanner.advance();
            const next = this.scanner.peek().toLowerCase();
            if (next === 'x' || next === 'b' || next === 'o') {
                numStr += this.scanner.advance();
                // 读取十六进制/二进制/八进制数字
                while (!this.scanner.isAtEnd) {
                    const ch = this.scanner.peek();
                    if (next === 'x' && this.isHexDigit(ch)) {
                        numStr += this.scanner.advance();
                    } else if (next === 'b' && (ch === '0' || ch === '1' || ch === '_')) {
                        numStr += this.scanner.advance();
                    } else if (next === 'o' && ((ch >= '0' && ch <= '7') || ch === '_')) {
                        numStr += this.scanner.advance();
                    } else if (ch === '_') {
                        numStr += this.scanner.advance();
                    } else {
                        break;
                    }
                }
                // 移除下划线
                const clean = numStr.replace(/_/g, '');
                const prefix = next as string;
                return this.makeToken(TokenType.NumberLiteral, clean, clean);
            }
        }

        // 十进制数字
        while (!this.scanner.isAtEnd) {
            const ch = this.scanner.peek();

            if (this.isDigit(ch) || ch === '_') {
                numStr += this.scanner.advance();
            } else if (ch === '.' && !hasDot && !hasExp) {
                // 小数部分
                hasDot = true;
                numStr += this.scanner.advance();
            } else if ((ch === 'e' || ch === 'E') && !hasExp) {
                // 指数部分
                hasExp = true;
                numStr += this.scanner.advance();
                // 可选的 + / -
                if (this.scanner.peek() === '+' || this.scanner.peek() === '-') {
                    numStr += this.scanner.advance();
                }
            } else if (ch === 'f' || ch === 'F') {
                // float 后缀
                isFloat = true;
                this.scanner.advance();
                break;
            } else {
                break;
            }
        }

        const clean = numStr.replace(/_/g, '');
        return this.makeToken(TokenType.NumberLiteral, clean, clean);
    }

    // ============================================================
    // 标识符 / 关键字
    // ============================================================

    private readIdentifierOrKeyword(): Token {
        let text = '';
        while (!this.scanner.isAtEnd) {
            const ch = this.scanner.peek();
            if (this.isIdentifierPart(ch)) {
                text += ch;
                this.scanner.advance();
            } else {
                break;
            }
        }

        // 检查关键字
        const keywordType = lookupKeyword(text);
        if (keywordType !== undefined) {
            return this.makeToken(keywordType, text);
        }

        return this.makeToken(TokenType.Identifier, text, text);
    }

    // ============================================================
    // 运算符 / 分隔符 — 贪婪匹配
    // ============================================================

    private readOperatorOrPunctuator(): Token {
        const ch = this.scanner.peek();

        // 尝试 3 字符运算符
        if (ch === '=' && this.scanner.peekAhead(1) === '=' && this.scanner.peekAhead(2) === '?') {
            // ==?
            this.scanner.skipN(3);
            return this.makeToken(TokenType.MultiWayEq, '==?');
        }

        if (ch === '.' && this.scanner.peekAhead(1) === '.' && this.scanner.peekAhead(2) === '.') {
            // ...
            this.scanner.skipN(3);
            return this.makeToken(TokenType.Spread, '...');
        }

        if (ch === '=' && this.scanner.peekAhead(1) === '>' ) {
            // =>
            this.scanner.skipN(2);
            return this.makeToken(TokenType.Arrow, '=>');
        }

        // 尝试 2 字符运算符
        const ch2 = this.scanner.peekAhead(1);
        const twoChar = ch + ch2;

        const twoCharMap: Record<string, TokenType> = {
            '++': TokenType.PlusPlus,
            '--': TokenType.MinusMinus,
            '+=': TokenType.PlusEquals,
            '-=': TokenType.MinusEquals,
            '*=': TokenType.StarEquals,
            '/=': TokenType.SlashEquals,
            '%=': TokenType.PercentEquals,
            '==': TokenType.EqualsEquals,
            '!=': TokenType.NotEquals,
            '===': TokenType.StrictEquals,  // === 实际上需要3字符，但 == 已经匹配了，这里只处理 !==
            '<=': TokenType.LessThanEquals,
            '>=': TokenType.GreaterThanEquals,
            '&&': TokenType.AndAnd,
            '||': TokenType.OrOr,
            '<<': TokenType.LessThanLessThan,
            '>>': TokenType.GreaterThanGreaterThan,
        };

        const strictNotEq = ch === '!' && ch2 === '=' && this.scanner.peekAhead(2) === '=';
        if (strictNotEq) {
            this.scanner.skipN(3);
            return this.makeToken(TokenType.StrictNotEquals, '!==');
        }

        if (ch === '=' && ch2 === '=' && this.scanner.peekAhead(2) === '=') {
            this.scanner.skipN(3);
            return this.makeToken(TokenType.StrictEquals, '===');
        }

        if (twoCharMap[twoChar]) {
            this.scanner.skipN(2);
            return this.makeToken(twoCharMap[twoChar], twoChar);
        }

        // 单字符
        const singleCharMap: Record<string, TokenType> = {
            '+': TokenType.Plus,
            '-': TokenType.Minus,
            '*': TokenType.Star,
            '/': TokenType.Slash,
            '%': TokenType.Percent,
            '=': TokenType.Equals,
            '<': TokenType.LessThan,
            '>': TokenType.GreaterThan,
            '!': TokenType.Bang,
            '&': TokenType.Ampersand,
            '|': TokenType.Pipe,
            '^': TokenType.Caret,
            '~': TokenType.Tilde,
            '(': TokenType.LeftParen,
            ')': TokenType.RightParen,
            '[': TokenType.LeftBracket,
            ']': TokenType.RightBracket,
            '{': TokenType.LeftBrace,
            '}': TokenType.RightBrace,
            ',': TokenType.Comma,
            ';': TokenType.Semicolon,
            '.': TokenType.Dot,
            ':': TokenType.Colon,
            '?': TokenType.QuestionMark,
            '@': TokenType.At,
        };

        if (singleCharMap[ch]) {
            this.scanner.advance();
            return this.makeToken(singleCharMap[ch], ch);
        }

        // 无法识别的字符 — Error token
        this.scanner.advance();
        return this.errorToken(`Unexpected character: '${ch}'`);
    }

    // ============================================================
    // Token 构造辅助方法
    // ============================================================

    /**
     * 创建标准 token
     */
    private makeToken(type: TokenType, lexeme: string, value?: string | number | boolean | null): Token {
        const token: Token = {
            type,
            lexeme,
            value,
            span: this.tokenSpan(),
            leadingTrivia: [...this.pendingComments],
            trailingTrivia: [],
            flags: TokenFlags.None,
        };

        // 清空待处理的注释缓冲区
        this.pendingComments.length = 0;

        return token;
    }

    /**
     * 创建错误 token
     */
    private errorToken(message: string): Token {
        const token: Token = {
            type: TokenType.Error,
            lexeme: this.scanner.extractToken(),
            span: this.tokenSpan(),
            leadingTrivia: [...this.pendingComments],
            trailingTrivia: [],
            flags: TokenFlags.HasError,
            errorMessage: message,
        };
        this.pendingComments.length = 0;
        return token;
    }

    /**
     * 获取当前 token 的跨度
     */
    private tokenSpan(): SourceSpan {
        return createSpan(
            this.scanner.tokenStartLocation,
            this.scanner.currentLocation,
        );
    }

    // ============================================================
    // 字符分类辅助方法
    // ============================================================

    private isDigit(ch: string): boolean {
        return ch >= '0' && ch <= '9';
    }

    private isHexDigit(ch: string): boolean {
        return (ch >= '0' && ch <= '9') ||
            (ch >= 'a' && ch <= 'f') ||
            (ch >= 'A' && ch <= 'F');
    }

    private isIdentifierStart(ch: string): boolean {
        return (ch >= 'a' && ch <= 'z') ||
            (ch >= 'A' && ch <= 'Z') ||
            ch === '_' ||
            ch > '\x7F'; // Unicode 字符
    }

    private isIdentifierPart(ch: string): boolean {
        return this.isIdentifierStart(ch) || this.isDigit(ch);
    }
}
