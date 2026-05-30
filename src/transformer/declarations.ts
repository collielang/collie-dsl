import {
    FunctionDeclaration, Parameter, IdentifierType,
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
