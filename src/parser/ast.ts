import { SourceSpan } from '../common/source-location';

// ============================================================
// AST 节点基础
// ============================================================

export interface AstNode {
    kind: SyntaxKind;
    span: SourceSpan;
}

export type SyntaxKind =
    // 顶层
    | 'Program'
    // 声明
    | 'VariableDeclaration'
    | 'MultiVariableDeclaration'
    | 'FunctionDeclaration'
    | 'Parameter'
    // 语句
    | 'BlockStatement'
    | 'IfStatement'
    | 'WhileStatement'
    | 'DoWhileStatement'
    | 'ForStatement'
    | 'ReturnStatement'
    | 'BreakStatement'
    | 'ContinueStatement'
    | 'ExpressionStatement'
    // 表达式
    | 'NumberLiteral'
    | 'StringLiteral'
    | 'MultiLineStringLiteral'
    | 'CharLiteral'
    | 'BooleanLiteral'
    | 'NullLiteral'
    | 'Identifier'
    | 'BinaryExpression'
    | 'UnaryExpression'
    | 'AssignmentExpression'
    | 'MemberAccessExpression'
    | 'IndexExpression'
    | 'CallExpression'
    | 'TernaryExpression'
    | 'GroupExpression'
    | 'MultiWayEqExpression'
    // 类型
    | 'IdentifierType'
    | 'ErrorNode'
;

// ============================================================
// 顶层
// ============================================================

export interface Program extends AstNode {
    kind: 'Program';
    statements: Statement[];
}

// ============================================================
// 声明
// ============================================================

export interface VariableDeclaration extends AstNode {
    kind: 'VariableDeclaration';
    varType: TypeAnnotation | null;  // null = var 推断
    name: Identifier;
    initializer: Expression;
}

/**
 * 多变量声明 (多返回值解构)
 * number q, r = divide(10, 3);
 * 编译为: const _tmp = divide(...); let q = _tmp[0]; let r = _tmp[1];
 */
export interface MultiVariableDeclaration extends AstNode {
    kind: 'MultiVariableDeclaration';
    varType: TypeAnnotation;         // 必须有显式类型
    names: Identifier[];             // 至少 2 个
    initializer: Expression;
}

export interface FunctionDeclaration extends AstNode {
    kind: 'FunctionDeclaration';
    name: Identifier;
    parameters: Parameter[];
    returnTypes: TypeAnnotation[];   // 0 = void, 1+ 个 = 多返回值
    body: BlockStatement;
}

export interface Parameter extends AstNode {
    kind: 'Parameter';
    name: Identifier;
    paramType: TypeAnnotation;
}

// ============================================================
// 语句
// ============================================================

export interface BlockStatement extends AstNode {
    kind: 'BlockStatement';
    statements: Statement[];
}

export interface IfStatement extends AstNode {
    kind: 'IfStatement';
    condition: Expression;
    consequent: Statement;
    alternate: Statement | null;
}

export interface WhileStatement extends AstNode {
    kind: 'WhileStatement';
    condition: Expression;
    body: Statement;
}

export interface DoWhileStatement extends AstNode {
    kind: 'DoWhileStatement';
    body: Statement;
    condition: Expression;
}

export interface ForStatement extends AstNode {
    kind: 'ForStatement';
    forKind: 'c-style' | 'each';
    // C-style
    init: Statement | Expression | null;
    condition: Expression | null;
    update: Expression | null;
    // for-each
    loopVariable: Identifier | null;
    indexVariable: Identifier | null;
    iterable: Expression | null;
    // 公共
    body: Statement;
}

export interface ReturnStatement extends AstNode {
    kind: 'ReturnStatement';
    values: Expression[];
}

export interface BreakStatement extends AstNode {
    kind: 'BreakStatement';
    label: Identifier | null;
}

export interface ContinueStatement extends AstNode {
    kind: 'ContinueStatement';
    label: Identifier | null;
}

export interface ExpressionStatement extends AstNode {
    kind: 'ExpressionStatement';
    expression: Expression;
}

// ============================================================
// 表达式
// ============================================================

export interface NumberLiteral extends AstNode {
    kind: 'NumberLiteral';
    value: string;        // 保持原始字符串
    numKind: number;
}

export interface StringLiteral extends AstNode {
    kind: 'StringLiteral';
    value: string;
}

export interface MultiLineStringLiteral extends AstNode {
    kind: 'MultiLineStringLiteral';
    value: string;
}

export interface CharLiteral extends AstNode {
    kind: 'CharLiteral';
    value: string;
}

export interface BooleanLiteral extends AstNode {
    kind: 'BooleanLiteral';
    value: boolean;
}

export interface NullLiteral extends AstNode {
    kind: 'NullLiteral';
}

export interface Identifier extends AstNode {
    kind: 'Identifier';
    name: string;
}

export type BinaryOperator = '+' | '-' | '*' | '/' | '%' |
    '==' | '!=' | '<' | '>' | '<=' | '>=' |
    '&' | '|' | '^' | '<<' | '>>' |
    '&&' | '||';

export type UnaryOperator = '-' | '!' | '++' | '--' | '~';

export type AssignmentOperator = '=' | '+=' | '-=' | '*=' | '/=' | '%=';

export interface BinaryExpression extends AstNode {
    kind: 'BinaryExpression';
    operator: BinaryOperator;
    left: Expression;
    right: Expression;
}

export interface UnaryExpression extends AstNode {
    kind: 'UnaryExpression';
    operator: UnaryOperator;
    operand: Expression;
    isPrefix: boolean;
}

export interface AssignmentExpression extends AstNode {
    kind: 'AssignmentExpression';
    operator: AssignmentOperator;
    left: Expression;
    right: Expression;
}

export interface MemberAccessExpression extends AstNode {
    kind: 'MemberAccessExpression';
    object: Expression;
    member: Identifier;
}

export interface IndexExpression extends AstNode {
    kind: 'IndexExpression';
    object: Expression;
    index: Expression;
}

export interface CallExpression extends AstNode {
    kind: 'CallExpression';
    callee: Expression;
    arguments: Expression[];
}

export interface TernaryExpression extends AstNode {
    kind: 'TernaryExpression';
    condition: Expression;
    trueBranch: Expression;
    falseBranch: Expression;
}

export interface GroupExpression extends AstNode {
    kind: 'GroupExpression';
    expression: Expression;
}

// ==? 多路匹配
export interface MultiWayEqCase {
    /** 要匹配的值列表 (OR关系，用逗号连接) */
    values: Expression[];
    /** 匹配成功时的结果表达式 */
    result: Expression;
}

export interface MultiWayEqExpression extends AstNode {
    kind: 'MultiWayEqExpression';
    /** ==? 左侧的被匹配表达式 */
    subject: Expression;
    /** 匹配 case 列表 (至少 1 个) */
    cases: MultiWayEqCase[];
    /** 默认值 (可选) */
    defaultCase: Expression | null;
}

// ============================================================
// 类型注解
// ============================================================

export interface IdentifierType extends AstNode {
    kind: 'IdentifierType';
    name: string;
}

export type TypeAnnotation = IdentifierType;

// ============================================================
// 联合类型
// ============================================================

export type Statement =
    | VariableDeclaration
    | MultiVariableDeclaration
    | FunctionDeclaration
    | IfStatement
    | WhileStatement
    | DoWhileStatement
    | ForStatement
    | ReturnStatement
    | BreakStatement
    | ContinueStatement
    | ExpressionStatement
    | BlockStatement
    | ErrorNode;

export type Expression =
    | NumberLiteral
    | StringLiteral
    | MultiLineStringLiteral
    | CharLiteral
    | BooleanLiteral
    | NullLiteral
    | Identifier
    | BinaryExpression
    | UnaryExpression
    | AssignmentExpression
    | MemberAccessExpression
    | IndexExpression
    | CallExpression
    | TernaryExpression
    | GroupExpression
    | MultiWayEqExpression
    | ErrorNode;

// ============================================================
// 错误节点
// ============================================================

export interface ErrorNode extends AstNode {
    kind: 'ErrorNode';
    message: string;
}
