import {
    FunctionDeclaration, Parameter, IdentifierType,
    EnumDeclaration,
} from '../parser/ast';
import { mapType } from './types';

/**
 * 声明转换器 — Collie 声明 → TypeScript 代码
 */
export class DeclarationTransformer {
    private indent: number;
    private transformExpressionFn: (expr: any) => string;
    private transformStatementFn: (stmt: any) => string;

    constructor(
        transformExpr: (expr: any) => string,
        transformStmt: (stmt: any) => string,
    ) {
        this.indent = 0;
        this.transformExpressionFn = transformExpr;
        this.transformStatementFn = transformStmt;
    }

    setIndent(level: number): void {
        this.indent = level;
    }

    /**
     * fn name(params): returnType { body }
     */
    transformFunctionDeclaration(node: FunctionDeclaration): string {
        const name = node.name.name;
        const params = node.parameters
            .map(p => this.transformParameter(p))
            .join(', ');

        let returnTypeStr = '';
        if (node.returnTypes.length === 1) {
            const rt = node.returnTypes[0] as IdentifierType;
            returnTypeStr = `: ${mapType(rt.name)}`;
        } else if (node.returnTypes.length > 1) {
            const types = node.returnTypes
                .map(rt => mapType((rt as IdentifierType).name))
                .join(', ');
            returnTypeStr = `: [${types}]`;
        }
        // 0 returnTypes → void (no annotation)

        const body = this.transformStatementFn(node.body);

        return `${this.ind()}function ${name}(${params})${returnTypeStr} ${body}`;
    }

    /**
     * enum Name { Member1, Member2 = value, ... }
     *
     * 编译为 const 对象 + type 别名（兼容 Node.js v24 类型擦除模式）：
     *   const Name = { Member1: 0, Member2: 1 } as const;
     *   type Name = (typeof Name)[keyof typeof Name];
     */
    transformEnumDeclaration(node: EnumDeclaration): string {
        const ind = this.ind();
        const name = node.name.name;

        // 计算成员值（支持自动递增和显式赋值）
        let autoValue = 0;
        const memberEntries: string[] = [];
        for (const m of node.members) {
            const valStr = m.value
                ? this.transformExpressionFn(m.value)
                : String(autoValue);
            // 如果成员有显式值，尝试解析为数字以更新自动递增计数器
            if (m.value) {
                const numVal = Number(valStr);
                if (!Number.isNaN(numVal)) {
                    autoValue = numVal + 1;
                }
            } else {
                autoValue++;
            }
            memberEntries.push(`${ind}    ${m.name.name}: ${valStr}`);
        }

        const members = memberEntries.join(',\n');
        const constObj = `${ind}const ${name} = {\n${members}\n${ind}} as const;`;
        const typeAlias = `${ind}type ${name} = (typeof ${name})[keyof typeof ${name}];`;

        return `${constObj}\n${typeAlias}`;
    }

    private transformParameter(param: Parameter): string {
        const name = param.name.name;
        const pt = param.paramType as IdentifierType;
        const tsType = mapType(pt.name);
        return `${name}: ${tsType}`;
    }

    private ind(): string {
        return '    '.repeat(this.indent);
    }
}
