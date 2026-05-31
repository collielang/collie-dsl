import {
    Expression, NumberLiteral, StringLiteral, MultiLineStringLiteral,
    CharLiteral, BooleanLiteral, NullLiteral, UnsetLiteral, Identifier,
    BinaryExpression, UnaryExpression, AssignmentExpression,
    CallExpression, MemberAccessExpression, IndexExpression,
    TernaryExpression, GroupExpression, MultiWayEqExpression,
    TupleExpression, SpreadExpression,
    ErrorNode,
} from '../parser/ast';
import { mapBuiltinFunction, isBuiltin, isConstructorCall } from './stdlib';

/**
 * 表达式转换器 — Collie 表达式 → TypeScript 代码
 */
export class ExpressionTransformer {
    transform(node: Expression): string {
        if (node.kind === 'ErrorNode') {
            return this.transformErrorNode(node as ErrorNode);
        }

        switch (node.kind) {
            case 'NumberLiteral':
                return this.transformNumberLiteral(node as NumberLiteral);
            case 'StringLiteral':
                return this.transformStringLiteral(node as StringLiteral);
            case 'MultiLineStringLiteral':
                return this.transformMultiLineString(node as MultiLineStringLiteral);
            case 'CharLiteral':
                return this.transformCharLiteral(node as CharLiteral);
            case 'BooleanLiteral':
                return this.transformBooleanLiteral(node as BooleanLiteral);
            case 'NullLiteral':
                return this.transformNullLiteral(node as NullLiteral);
            case 'UnsetLiteral':
                return "'unset'";
            case 'Identifier':
                return this.transformIdentifier(node as Identifier);
            case 'BinaryExpression':
                return this.transformBinaryExpression(node as BinaryExpression);
            case 'UnaryExpression':
                return this.transformUnaryExpression(node as UnaryExpression);
            case 'AssignmentExpression':
                return this.transformAssignmentExpression(node as AssignmentExpression);
            case 'CallExpression':
                return this.transformCallExpression(node as CallExpression);
            case 'MemberAccessExpression':
                return this.transformMemberAccess(node as MemberAccessExpression);
            case 'IndexExpression':
                return this.transformIndexExpression(node as IndexExpression);
            case 'TernaryExpression':
                return this.transformTernaryExpression(node as TernaryExpression);
            case 'GroupExpression':
                return this.transformGroupExpression(node as GroupExpression);
            case 'MultiWayEqExpression':
                return this.transformMultiWayEqExpression(node as MultiWayEqExpression);
            case 'TupleExpression': {
                const fields = (node as TupleExpression).fields
                    .map(f => `${f.name.name}: ${this.transform(f.value)}`)
                    .join(', ');
                return `{ ${fields} }`;
            }
            case 'SpreadExpression':
                return `...${this.transform((node as SpreadExpression).argument)}`;
            default:
                return `/* TODO: ${(node as any).kind} */ null`;
        }
    }

    private transformNumberLiteral(node: NumberLiteral): string {
        return node.value;
    }

    private transformStringLiteral(node: StringLiteral): string {
        // Collie 双引号字符串 → TypeScript 双引号字符串
        // value 字段已经包含转义处理后的内容
        return `"${node.value}"`;
    }

    private transformMultiLineString(node: MultiLineStringLiteral): string {
        // 多行字符串 → TypeScript 模板字面量
        return '`' + node.value + '`';
    }

    private transformCharLiteral(node: CharLiteral): string {
        // char → TypeScript string (单字符)
        return `"${node.value}"`;
    }

    private transformBooleanLiteral(node: BooleanLiteral): string {
        return node.value ? 'true' : 'false';
    }

    private transformNullLiteral(_node: NullLiteral): string {
        return 'null';
    }

    private transformIdentifier(node: Identifier): string {
        return node.name;
    }

    private transformBinaryExpression(node: BinaryExpression): string {
        const left = this.transform(node.left);
        const right = this.transform(node.right);

        // Collie == / != 映射为 TypeScript === / !==（Collie 默认严格相等）
        const opMap: Record<string, string> = {
            '==': '===',
            '!=': '!==',
        };
        let op = opMap[node.operator] || node.operator;

        return `${left} ${op} ${right}`;
    }

    private transformUnaryExpression(node: UnaryExpression): string {
        const operand = this.transform(node.operand);
        if (node.isPrefix) {
            return `${node.operator}${operand}`;
        } else {
            return `${operand}${node.operator}`;
        }
    }

    private transformAssignmentExpression(node: AssignmentExpression): string {
        const left = this.transform(node.left);
        const right = this.transform(node.right);
        return `${left} ${node.operator} ${right}`;
    }

    private transformCallExpression(node: CallExpression): string {
        const args = node.arguments.map(a => this.transform(a)).join(', ');

        // 检查是否为 Collie 内置函数调用
        let calleeStr: string;
        if (node.callee.kind === 'Identifier' && isBuiltin(node.callee.name)) {
            const mapped = mapBuiltinFunction(node.callee.name);
            if (isConstructorCall(node.callee.name)) {
                calleeStr = `new ${mapped}`;
            } else {
                calleeStr = mapped;
            }
        } else {
            calleeStr = this.transform(node.callee);
        }

        return `${calleeStr}(${args})`;
    }

    private transformMemberAccess(node: MemberAccessExpression): string {
        const obj = this.transform(node.object);
        return `${obj}.${node.member.name}`;
    }

    private transformIndexExpression(node: IndexExpression): string {
        const obj = this.transform(node.object);
        const idx = this.transform(node.index);
        return `${obj}[${idx}]`;
    }

    private transformTernaryExpression(node: TernaryExpression): string {
        const cond = this.transform(node.condition);
        const trueBr = this.transform(node.trueBranch);
        const falseBr = this.transform(node.falseBranch);
        return `${cond} ? ${trueBr} : ${falseBr}`;
    }

    private transformGroupExpression(node: GroupExpression): string {
        return `(${this.transform(node.expression)})`;
    }

    private transformMultiWayEqExpression(node: MultiWayEqExpression): string {
        const subject = this.transform(node.subject);

        // 构建 if-else 链
        let body = '';

        for (const c of node.cases) {
            const conditions = c.values
                .map(v => `_v === ${this.transform(v)}`)
                .join(' || ');
            body += `  if (${conditions}) return ${this.transform(c.result)};\n`;
        }

        if (node.defaultCase) {
            body += `  return ${this.transform(node.defaultCase)};\n`;
        } else {
            body += '  return undefined;\n';
        }

        return `(() => {\n  const _v = ${subject};\n${body}})()`;
    }

    private transformErrorNode(node: ErrorNode): string {
        return `/* ERROR: ${node.message} */ null`;
    }
}
