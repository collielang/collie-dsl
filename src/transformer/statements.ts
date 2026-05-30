import {
    Statement, Expression, VariableDeclaration, MultiVariableDeclaration,
    IfStatement, WhileStatement,
    DoWhileStatement, ForStatement, ReturnStatement, BreakStatement,
    ContinueStatement, ExpressionStatement, BlockStatement,
    IdentifierType, ErrorNode, AssignmentExpression,
} from '../parser/ast';
import { mapType } from './types';
import { ExpressionTransformer } from './expressions';

/**
 * 语句转换器 — Collie 语句 → TypeScript 代码
 */
export class StatementTransformer {
    private indent: number;
    private exprTransformer: ExpressionTransformer;
    private transformDeclFn: ((decl: any) => string) | null;
    private multiTempCounter: number;

    constructor() {
        this.indent = 0;
        this.exprTransformer = new ExpressionTransformer();
        this.transformDeclFn = null;
        this.multiTempCounter = 0;
    }

    setDeclTransformer(fn: (decl: any) => string): void {
        this.transformDeclFn = fn;
    }

    setIndent(level: number): void {
        this.indent = level;
    }

    getIndent(): number {
        return this.indent;
    }

    transform(node: Statement): string {
        if (node.kind === 'ErrorNode') {
            return `${this.ind()}/* ERROR: ${(node as ErrorNode).message} */`;
        }

        switch (node.kind) {
            case 'VariableDeclaration':
                return this.transformVariableDeclaration(node as VariableDeclaration);
            case 'MultiVariableDeclaration':
                return this.transformMultiVariableDeclaration(node as MultiVariableDeclaration);
            case 'FunctionDeclaration':
                if (this.transformDeclFn) {
                    return this.transformDeclFn(node);
                }
                return `/* FunctionDeclaration */`;
            case 'BlockStatement':
                return this.transformBlock(node as BlockStatement);
            case 'IfStatement':
                return this.transformIf(node as IfStatement);
            case 'WhileStatement':
                return this.transformWhile(node as WhileStatement);
            case 'DoWhileStatement':
                return this.transformDoWhile(node as DoWhileStatement);
            case 'ForStatement':
                return this.transformFor(node as ForStatement);
            case 'ReturnStatement':
                return this.transformReturn(node as ReturnStatement);
            case 'BreakStatement':
                return this.transformBreak(node as BreakStatement);
            case 'ContinueStatement':
                return this.transformContinue(node as ContinueStatement);
            case 'ExpressionStatement':
                return this.transformExpressionStatement(node as ExpressionStatement);
            default:
                return `${this.ind()}/* TODO: ${(node as any).kind} */`;
        }
    }

    /**
     * 变量声明: TypeName name = expr; 或 var name = expr;
     */
    private transformVariableDeclaration(node: VariableDeclaration): string {
        const name = node.name.name;
        const init = this.exprTransformer.transform(node.initializer);

        if (node.varType) {
            const tsType = mapType((node.varType as IdentifierType).name);
            return `${this.ind()}let ${name}: ${tsType} = ${init};`;
        } else {
            // var → TypeScript 类型推断
            return `${this.ind()}let ${name} = ${init};`;
        }
    }

    /**
     * 多变量声明: TypeName id1, id2, ... = expr;
     * 编译为: const _multi0 = expr; let id1 = _multi0[0]; let id2 = _multi0[1];
     */
    private transformMultiVariableDeclaration(node: MultiVariableDeclaration): string {
        const tsType = mapType((node.varType as IdentifierType).name);
        const init = this.exprTransformer.transform(node.initializer);
        const tempVar = `_multi${this.multiTempCounter++}`;

        const lines: string[] = [];
        const ind = this.ind();

        // const _multiN = expr;
        lines.push(`${ind}const ${tempVar} = ${init};`);

        // let name1: type = _multiN[0]; ...
        for (let i = 0; i < node.names.length; i++) {
            const name = node.names[i].name;
            lines.push(`${ind}let ${name}: ${tsType} = ${tempVar}[${i}];`);
        }

        return lines.join('\n');
    }

    /**
     * 语句块 { ... }
     */
    transformBlock(node: BlockStatement): string {
        if (node.statements.length === 0) {
            return '{}';
        }

        const lines: string[] = ['{'];
        const savedIndent = this.indent;
        this.indent++;

        for (const stmt of node.statements) {
            // 对于嵌套函数声明，使用声明转换器
            if (stmt.kind === 'FunctionDeclaration' && this.transformDeclFn) {
                lines.push(this.transformDeclFn(stmt));
            } else {
                lines.push(this.transform(stmt));
            }
        }

        this.indent = savedIndent;
        lines.push(`${this.ind()}}`);
        return lines.join('\n');
    }

    /**
     * if (condition) consequent else alternate
     */
    private transformIf(node: IfStatement): string {
        const cond = this.exprTransformer.transform(node.condition);
        const cons = this.wrapInBlockIfNeeded(node.consequent);

        let result = `${this.ind()}if (${cond}) ${cons}`;

        if (node.alternate) {
            // 处理 else if 链
            if (node.alternate.kind === 'IfStatement') {
                const elseIfStr = this.transformIfInline(node.alternate as IfStatement);
                result += ` else ${elseIfStr}`;
            } else {
                const alt = this.wrapInBlockIfNeeded(node.alternate);
                result += ` else ${alt}`;
            }
        }

        return result;
    }

    /**
     * else if 内联(不带缩进前缀)
     */
    private transformIfInline(node: IfStatement): string {
        const cond = this.exprTransformer.transform(node.condition);
        const cons = this.wrapInBlockIfNeeded(node.consequent);

        let result = `if (${cond}) ${cons}`;

        if (node.alternate) {
            if (node.alternate.kind === 'IfStatement') {
                result += ` else ${this.transformIfInline(node.alternate as IfStatement)}`;
            } else {
                const alt = this.wrapInBlockIfNeeded(node.alternate);
                result += ` else ${alt}`;
            }
        }

        return result;
    }

    /**
     * while (condition) body
     */
    private transformWhile(node: WhileStatement): string {
        const cond = this.exprTransformer.transform(node.condition);
        const body = this.wrapInBlockIfNeeded(node.body);
        return `${this.ind()}while (${cond}) ${body}`;
    }

    /**
     * do body while (condition);
     */
    private transformDoWhile(node: DoWhileStatement): string {
        const body = this.wrapInBlockIfNeeded(node.body);
        const cond = this.exprTransformer.transform(node.condition);
        const result = `${this.ind()}do ${body} while (${cond});`;
        return result;
    }

    /**
     * for 语句 — C-style 和 for-each
     */
    private transformFor(node: ForStatement): string {
        if (node.forKind === 'each') {
            return this.transformForEach(node);
        }
        return this.transformForCStyle(node);
    }

    private transformForCStyle(node: ForStatement): string {
        let initStr = '';
        if (node.init) {
            if (node.init.kind === 'VariableDeclaration') {
                const vd = node.init as VariableDeclaration;
                const name = vd.name.name;
                const init = this.exprTransformer.transform(vd.initializer);
                if (vd.varType) {
                    const tsType = mapType((vd.varType as IdentifierType).name);
                    initStr = `let ${name}: ${tsType} = ${init}`;
                } else {
                    initStr = `let ${name} = ${init}`;
                }
            } else {
                initStr = this.exprTransformer.transform(node.init as Expression);
            }
        }

        const condStr = node.condition
            ? this.exprTransformer.transform(node.condition)
            : '';

        const updateStr = node.update
            ? this.exprTransformer.transform(node.update)
            : '';

        const body = this.wrapInBlockIfNeeded(node.body);

        return `${this.ind()}for (${initStr}; ${condStr}; ${updateStr}) ${body}`;
    }

    private transformForEach(node: ForStatement): string {
        const loopVar = node.loopVariable!.name;
        const iterable = this.exprTransformer.transform(node.iterable!);

        let forHeader: string;
        if (node.indexVariable) {
            // for-each with index: 需要有 index 追踪
            // 策略: for (const [idx, item] of iterable.entries())
            const idxVar = node.indexVariable.name;
            forHeader = `const [${idxVar}, ${loopVar}] of ${iterable}.entries()`;
        } else {
            forHeader = `const ${loopVar} of ${iterable}`;
        }

        const body = this.wrapInBlockIfNeeded(node.body);
        return `${this.ind()}for (${forHeader}) ${body}`;
    }

    /**
     * return [values];
     */
    private transformReturn(node: ReturnStatement): string {
        if (node.values.length === 0) {
            return `${this.ind()}return;`;
        }

        if (node.values.length === 1) {
            const val = this.exprTransformer.transform(node.values[0]);
            return `${this.ind()}return ${val};`;
        }

        // 多返回值: return [a, b, c];
        const vals = node.values.map(v => this.exprTransformer.transform(v)).join(', ');
        return `${this.ind()}return [${vals}];`;
    }

    /**
     * break;
     */
    private transformBreak(_node: BreakStatement): string {
        return `${this.ind()}break;`;
    }

    /**
     * continue;
     */
    private transformContinue(_node: ContinueStatement): string {
        return `${this.ind()}continue;`;
    }

    /**
     * expression;
     */
    private transformExpressionStatement(node: ExpressionStatement): string {
        const expr = this.exprTransformer.transform(node.expression);
        return `${this.ind()}${expr};`;
    }

    /**
     * 如果不是块语句则包装成块
     */
    private wrapInBlockIfNeeded(stmt: Statement): string {
        if (stmt.kind === 'BlockStatement') {
            return this.transform(stmt);
        }
        // 单语句 → 放在同一行或下一行缩进
        const savedIndent = this.indent;
        this.indent++;
        const body = this.transform(stmt);
        this.indent = savedIndent;
        return `{\n${body}\n${this.ind()}}`;
    }

    private ind(): string {
        return '    '.repeat(this.indent);
    }
}
