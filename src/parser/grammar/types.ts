import { TokenType, Token, isTypeToken } from '../../lexer/token';
import { IdentifierType, TypeAnnotation } from '../ast';

/**
 * 类型注解解析器
 *
 * Phase 1: 仅支持标识符类型 (如 number, string, integer, bool 等)
 */
export class TypeParser {
    private tokens: Token[];
    private pos: number;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.pos = 0;
    }

    setPosition(pos: number): void {
        this.pos = pos;
    }

    getPosition(): number {
        return this.pos;
    }

    /**
     * 解析类型注解: IDENTIFIER (类型名)
     * 返回 null 表示当前位置不是一个类型注解
     */
    parseTypeAnnotation(): TypeAnnotation | null {
        const token = this.current();
        if (!token) return null;

        if (isTypeToken(token.type)) {
            this.advance();
            return {
                kind: 'IdentifierType',
                name: token.lexeme,
                span: token.span,
            };
        }

        return null;
    }

    /**
     * 强制解析类型注解，失败返回 null（不影响错误恢复）
     */
    parseTypeAnnotationOrNull(): TypeAnnotation | null {
        return this.parseTypeAnnotation();
    }

    // --- Token 流操作 ---

    private current(): Token | null {
        if (this.pos >= this.tokens.length) return null;
        // 跳过 Newline
        let p = this.pos;
        while (p < this.tokens.length && this.tokens[p].type === TokenType.Newline) {
            p++;
        }
        if (p >= this.tokens.length) return null;
        return this.tokens[p];
    }

    private peek(): Token | null {
        if (this.pos + 1 >= this.tokens.length) return null;
        // 跳过 Newline
        let p = this.pos + 1;
        while (p < this.tokens.length && this.tokens[p].type === TokenType.Newline) {
            p++;
        }
        if (p >= this.tokens.length) return null;
        return this.tokens[p];
    }

    private advance(): Token | null {
        // 跳过 Newline
        while (this.pos < this.tokens.length && this.tokens[this.pos].type === TokenType.Newline) {
            this.pos++;
        }
        if (this.pos >= this.tokens.length) return null;
        return this.tokens[this.pos++];
    }

    private currentRaw(): Token | null {
        if (this.pos >= this.tokens.length) return null;
        return this.tokens[this.pos];
    }

    private advanceRaw(): Token | null {
        if (this.pos >= this.tokens.length) return null;
        return this.tokens[this.pos++];
    }
}
