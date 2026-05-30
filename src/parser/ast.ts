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
    '&&' | '||';

export type UnaryOperator = '-' | '!' | '++' | '--';

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
    | ErrorNode;

// ============================================================
// 错误节点
// ============================================================

export interface ErrorNode extends AstNode {
    kind: 'ErrorNode';
    message: string;
}
