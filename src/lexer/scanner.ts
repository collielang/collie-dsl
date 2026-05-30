import { SourceLocation, createLocation } from '../common/source-location';

/**
 * 字符级扫描器 — 在源代码上进行字符级游走
 * 跟踪偏移、行号、列号，提供 peek/advance/skip 方法
 */
export class Scanner {
    private readonly source: string;
    private pos: number = 0;
    private line: number = 1;
    private column: number = 1;
    private readonly length: number;

    // 用于跟踪 token 起始位置
    private tokenStartOffset: number = 0;
    private tokenStartLine: number = 1;
    private tokenStartColumn: number = 1;

    constructor(source: string) {
        this.source = source;
        this.length = source.length;
    }

    // --- 基本位置查询 ---

    get isAtEnd(): boolean {
        return this.pos >= this.length;
    }

    get currentOffset(): number {
        return this.pos;
    }

    get currentLocation(): SourceLocation {
        return createLocation(this.pos, this.line, this.column);
    }

    // 获取 token 起始位置 (从上次 markTokenStart 开始)
    get tokenStartLocation(): SourceLocation {
        return createLocation(this.tokenStartOffset, this.tokenStartLine, this.tokenStartColumn);
    }

    // 获取从 token 起始位置到当前光标位置的字符长度
    get tokenLength(): number {
        return this.pos - this.tokenStartOffset;
    }

    // --- 标记 ---

    // 标记 token 起始位置
    markTokenStart(): void {
        this.tokenStartOffset = this.pos;
        this.tokenStartLine = this.line;
        this.tokenStartColumn = this.column;
    }

    // --- Lookahead ---

    // 查看当前字符 (不移光标)，EOF 返回 '\0'
    peek(): string {
        if (this.isAtEnd) return '\0';
        return this.source[this.pos];
    }

    // 查看前方第 n 个字符 (n=0 为当前，n=1 为下一个)
    peekAhead(n: number): string {
        const idx = this.pos + n;
        if (idx >= this.length) return '\0';
        return this.source[idx];
    }

    // --- 消费字符 ---

    // 消费并返回当前字符，前移光标
    advance(): string {
        if (this.isAtEnd) return '\0';
        const ch = this.source[this.pos];
        this.pos++;

        if (ch === '\n') {
            this.line++;
            this.column = 1;
        } else if (ch === '\r') {
            // 跳过 \r (Windows CRLF 统一处理为 \n)
            if (this.pos < this.length && this.source[this.pos] === '\n') {
                this.pos++; // 跳过 \n
            }
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }

        return ch;
    }

    // 仅前移 (不返回字符)
    skip(): void {
        this.advance();
    }

    // 跳过 n 个字符
    skipN(n: number): void {
        for (let i = 0; i < n; i++) {
            this.advance();
        }
    }

    // --- 匹配 ---

    // 如果当前字符匹配 expected，则消费并返回 true
    match(expected: string): boolean {
        if (this.isAtEnd) return false;
        if (this.source[this.pos] !== expected) return false;
        this.advance();
        return true;
    }

    // --- 子串提取 ---

    // 提取从 startOffset 到当前 pos 的文本
    extractFrom(startOffset: number): string {
        return this.source.substring(startOffset, this.pos);
    }

    // 提取 token 范围内的文本 (从 tokenStartOffset 到当前 pos)
    extractToken(): string {
        return this.source.substring(this.tokenStartOffset, this.pos);
    }

    // --- 逐行注释的整行文本提取 ---

    // 返回从当前位置到行尾的所有文本 (不含换行符)
    peekRestOfLine(): string {
        let end = this.pos;
        while (end < this.length && this.source[end] !== '\n' && this.source[end] !== '\r') {
            end++;
        }
        return this.source.substring(this.pos, end);
    }

    // 跳过到行尾 (含换行符)
    skipToEndOfLine(): void {
        while (!this.isAtEnd && this.peek() !== '\n' && this.peek() !== '\r') {
            this.advance();
        }
    }

    // --- 空白跳过 ---

    // 跳过所有空白字符 (空格、Tab)，返回跳过的字符数
    skipWhitespace(): number {
        let count = 0;
        while (!this.isAtEnd) {
            const ch = this.peek();
            if (ch === ' ' || ch === '\t') {
                this.advance();
                count++;
            } else {
                break;
            }
        }
        return count;
    }
}
