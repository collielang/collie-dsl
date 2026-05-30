import { Token, TokenType } from '../lexer/token';
import { Lexer } from '../lexer/index';
import { Program, Statement } from './ast';
import { ExpressionParser } from './grammar/expressions';
import { StatementParser } from './grammar/statements';
import { DeclarationParser } from './grammar/declarations';
import { DiagnosticBag } from '../common/diagnostics';
import { SourceSpan } from '../common/source-location';

/**
 * Parser — 语法分析器主入口
 *
 * 将 Token 序列解析为 Collie AST。
 * 使用递归下降解析语句/声明，Pratt 算法解析表达式。
 */
export class Parser {
    private tokens: Token[];
    private diagnostics: DiagnosticBag;
    private exprParser: ExpressionParser;
    private stmtParser: StatementParser;
    private declParser: DeclarationParser;

    constructor(tokens: Token[], diagnostics: DiagnosticBag) {
        this.tokens = tokens;
        this.diagnostics = diagnostics;
        this.exprParser = new ExpressionParser(tokens, diagnostics);
        this.stmtParser = new StatementParser(tokens, this.exprParser, diagnostics);
        this.declParser = new DeclarationParser(tokens, this.exprParser, this.stmtParser, diagnostics);
    }

    /**
     * 从源码解析 (便捷方法)
     */
    static fromSource(source: string): { program: Program; diagnostics: DiagnosticBag } {
        const diagnostics = new DiagnosticBag();
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens, diagnostics);
        const program = parser.parse();
        return { program, diagnostics };
    }

    /**
     * 解析整个程序
     */
    parse(): Program {
        const statements: Statement[] = [];

        while (true) {
            const token = this.stmtParser.current();
            if (!token || token.type === TokenType.EOF) {
                break;
            }

            // 根据 token 类型分派到声明或语句
            if (token.type === TokenType.Fn) {
                this.declParser.setPosition(this.stmtParser.getPosition());
                const decl = this.declParser.parseFunctionDeclaration();
                this.stmtParser.setPosition(this.declParser.getPosition());
                statements.push(decl);
            } else {
                const stmt = this.stmtParser.parseStatement();
                statements.push(stmt);
            }
        }

        return {
            kind: 'Program',
            statements,
            span: this.programSpan(statements),
        };
    }

    /**
     * 获取诊断信息
     */
    getDiagnostics(): DiagnosticBag {
        return this.diagnostics;
    }

    private programSpan(statements: Statement[]): SourceSpan {
        if (statements.length === 0) {
            const lastToken = this.tokens[this.tokens.length - 1];
            return {
                start: { offset: 0, line: 1, column: 1 },
                end: lastToken?.span.end || { offset: 0, line: 1, column: 1 },
            };
        }
        return {
            start: statements[0].span.start,
            end: statements[statements.length - 1].span.end,
        };
    }
}
