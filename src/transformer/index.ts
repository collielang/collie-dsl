import { Program, FunctionDeclaration } from '../parser/ast';
import { StatementTransformer } from './statements';
import { DeclarationTransformer } from './declarations';
import { ExpressionTransformer } from './expressions';

/**
 * Collie → TypeScript 转换器
 *
 * 将 Collie AST 转换为 TypeScript 源代码字符串。
 * Phase 1: 支持变量声明、函数声明、基本表达式、控制流。
 */
export class Transformer {
    private stmtTransformer: StatementTransformer;
    private declTransformer: DeclarationTransformer;
    private exprTransformer: ExpressionTransformer;

    constructor() {
        this.exprTransformer = new ExpressionTransformer();
        this.stmtTransformer = new StatementTransformer();
        this.declTransformer = new DeclarationTransformer(
            (expr) => this.exprTransformer.transform(expr),
            (stmt) => this.stmtTransformer.transform(stmt),
        );

        // 连接循环引用
        this.stmtTransformer.setDeclTransformer(
            (decl) => this.declTransformer.transformFunctionDeclaration(decl as FunctionDeclaration),
        );
    }

    /**
     * 转换整个程序
     */
    transform(program: Program): string {
        const imports = this.generateImports(program);
        const body = this.generateBody(program);

        if (imports) {
            return imports + '\n\n' + body;
        }
        return body;
    }

    /**
     * 检测程序是否使用了 decimal 类型，生成必要的 import
     */
    private generateImports(program: Program): string {
        const needsDecimal = this.usesDecimalType(program);
        if (needsDecimal) {
            return `import { Decimal } from './decimal';`;
        }
        return '';
    }

    /**
     * 生成程序主体
     */
    private generateBody(program: Program): string {
        const lines: string[] = [];

        for (const stmt of program.statements) {
            if (stmt.kind === 'FunctionDeclaration') {
                lines.push(
                    this.declTransformer.transformFunctionDeclaration(stmt as FunctionDeclaration),
                );
            } else {
                lines.push(this.stmtTransformer.transform(stmt));
            }
        }

        return lines.join('\n');
    }

    /**
     * 检测是否有十进制类型使用 (遍历 AST)
     */
    private usesDecimalType(program: Program): boolean {
        return this.scanForDecimal(program);
    }

    private scanForDecimal(node: any): boolean {
        if (!node || typeof node !== 'object') return false;

        if (node.kind === 'IdentifierType' && node.name === 'decimal') {
            return true;
        }

        for (const key of Object.keys(node)) {
            if (key === 'span') continue;
            const child = node[key];
            if (Array.isArray(child)) {
                for (const item of child) {
                    if (this.scanForDecimal(item)) return true;
                }
            } else if (typeof child === 'object' && child !== null) {
                if (this.scanForDecimal(child)) return true;
            }
        }
        return false;
    }
}

/**
 * 便捷函数: 转换 Collie AST 到 TypeScript 代码
 */
export function transformProgram(program: Program): string {
    const transformer = new Transformer();
    return transformer.transform(program);
}
