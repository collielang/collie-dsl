import { Lexer } from './lexer/index';
import { Token } from './lexer/token';
import { Parser } from './parser/index';
import { Program } from './parser/ast';
import { Transformer } from './transformer/index';
import { DiagnosticBag } from './common/diagnostics';

/**
 * Compiler 编译流程编排器
 *
 * 4 阶段管道: Lexer → Parser → Transformer → Code Generator
 * Collie 源码 (.cl) → Token 序列 → Collie AST → TypeScript 源码 (.ts)
 */
export interface CompileResult {
    /** 生成的 TypeScript 代码 */
    code: string;
    /** 诊断信息(错误/警告) */
    diagnostics: DiagnosticBag;
    /** 编译是否成功(无错误) */
    success: boolean;
}

export class Compiler {
    private diagnostics: DiagnosticBag;

    constructor() {
        this.diagnostics = new DiagnosticBag();
    }

    /**
     * 编译 Collie 源码为 TypeScript
     */
    compile(source: string): CompileResult {
        this.diagnostics = new DiagnosticBag();

        // 阶段 1: Lexer
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();

        // 检查词法错误
        const lexErrors = tokens.filter(t => t.type === 'Error' as any);
        for (const err of lexErrors) {
            this.diagnostics.addError(
                err.errorMessage || 'Lexer error',
                err.span,
            );
        }

        if (lexErrors.length > 0 && !this.hasRecoverableTokens(tokens)) {
            return {
                code: '',
                diagnostics: this.diagnostics,
                success: false,
            };
        }

        // 阶段 2: Parser
        const parser = new Parser(tokens, this.diagnostics);
        const program = parser.parse();

        // 阶段 3: Transformer
        const transformer = new Transformer();
        const code = transformer.transform(program);

        // 阶段 4: Codegen (已在 transformer 中完成)

        return {
            code,
            diagnostics: this.diagnostics,
            success: this.diagnostics.getErrors().length === 0,
        };
    }

    /**
     * 检查是否有可恢复的 token
     */
    private hasRecoverableTokens(tokens: Token[]): boolean {
        return tokens.some(t => {
            const ttype = t.type as string;
            return ttype !== 'Error' && ttype !== 'EOF' &&
                   ttype !== 'Whitespace' && ttype !== 'Newline';
        });
    }

    /**
     * 仅做词法和语法分析(不生成代码)
     */
    analyze(source: string): { program: Program; diagnostics: DiagnosticBag } {
        this.diagnostics = new DiagnosticBag();
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens, this.diagnostics);
        const program = parser.parse();

        return { program, diagnostics: this.diagnostics };
    }
}

/**
 * 便捷函数: 快速编译 Collie 源码
 */
export function compile(source: string): CompileResult {
    const compiler = new Compiler();
    return compiler.compile(source);
}
