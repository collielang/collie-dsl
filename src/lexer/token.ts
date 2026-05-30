import { SourceSpan } from '../common/source-location';

// ============================================================
// TokenType 枚举 — 完整词汇表 (Phase 1-3 所有 token)
// ============================================================

export enum TokenType {
    // --- 关键字 ---
    Fn = 'Fn',
    Var = 'Var',
    If = 'If',
    Else = 'Else',
    For = 'For',
    While = 'While',
    Do = 'Do',
    Return = 'Return',
    Break = 'Break',
    Continue = 'Continue',
    Switch = 'Switch',
    Case = 'Case',
    Default = 'Default',
    True = 'True',
    False = 'False',
    Null = 'Null',
    Unset = 'Unset',
    In = 'In',
    Tuple = 'Tuple',
    Enum = 'Enum',
    Assert = 'Assert',
    New = 'New',
    Class = 'Class',
    Extends = 'Extends',
    This = 'This',
    Super = 'Super',
    Import = 'Import',
    Export = 'Export',
    Public = 'Public',
    Private = 'Private',
    Protected = 'Protected',
    Static = 'Static',

    // 类型关键字
    ObjectType = 'ObjectType',
    None = 'None',
    NumberType = 'NumberType',
    IntegerType = 'IntegerType',
    DecimalType = 'DecimalType',
    StringType = 'StringType',
    CharType = 'CharType',
    CharacterType = 'CharacterType',
    BoolType = 'BoolType',
    TriboolType = 'TriboolType',
    BitType = 'BitType',
    ByteType = 'ByteType',
    WordType = 'WordType',
    DwordType = 'DwordType',
    FloatType = 'FloatType',
    DoubleType = 'DoubleType',
    ListType = 'ListType',
    SetType = 'SetType',
    MapType = 'MapType',
    BufferType = 'BufferType',

    // 特殊关键字
    InfinityKw = 'InfinityKw',
    NaNKw = 'NaNKw',

    // --- 字面量 ---
    NumberLiteral = 'NumberLiteral',
    StringLiteral = 'StringLiteral',
    MultiLineStringLiteral = 'MultiLineStringLiteral',
    InterpolatedString = 'InterpolatedString',
    CharLiteral = 'CharLiteral',

    // --- 标识符 ---
    Identifier = 'Identifier',

    // --- 运算符 ---
    Plus = 'Plus',
    Minus = 'Minus',
    Star = 'Star',
    Slash = 'Slash',
    Percent = 'Percent',
    PlusPlus = 'PlusPlus',
    MinusMinus = 'MinusMinus',
    Equals = 'Equals',
    PlusEquals = 'PlusEquals',
    MinusEquals = 'MinusEquals',
    StarEquals = 'StarEquals',
    SlashEquals = 'SlashEquals',
    PercentEquals = 'PercentEquals',
    EqualsEquals = 'EqualsEquals',
    NotEquals = 'NotEquals',
    StrictEquals = 'StrictEquals',
    StrictNotEquals = 'StrictNotEquals',
    LessThan = 'LessThan',
    GreaterThan = 'GreaterThan',
    LessThanEquals = 'LessThanEquals',
    GreaterThanEquals = 'GreaterThanEquals',
    AndAnd = 'AndAnd',
    OrOr = 'OrOr',
    Bang = 'Bang',
    Ampersand = 'Ampersand',
    Pipe = 'Pipe',
    Caret = 'Caret',
    Tilde = 'Tilde',
    LessThanLessThan = 'LessThanLessThan',
    GreaterThanGreaterThan = 'GreaterThanGreaterThan',
    MultiWayEq = 'MultiWayEq',   // ==?
    Arrow = 'Arrow',             // =>
    Spread = 'Spread',           // ...

    // --- 分隔符 ---
    LeftParen = 'LeftParen',
    RightParen = 'RightParen',
    LeftBracket = 'LeftBracket',
    RightBracket = 'RightBracket',
    LeftBrace = 'LeftBrace',
    RightBrace = 'RightBrace',
    Comma = 'Comma',
    Semicolon = 'Semicolon',
    Dot = 'Dot',
    Colon = 'Colon',
    QuestionMark = 'QuestionMark',
    At = 'At',

    // --- 特殊 ---
    Whitespace = 'Whitespace',
    Newline = 'Newline',
    Comment = 'Comment',
    Error = 'Error',
    EOF = 'EOF',
}

// ============================================================
// Token 分类
// ============================================================

export type TokenCategory =
    | 'keyword'
    | 'type'
    | 'literal'
    | 'identifier'
    | 'operator'
    | 'punctuator'
    | 'comment'
    | 'whitespace'
    | 'newline'
    | 'error'
    | 'eof';

// ============================================================
// Token 标志位
// ============================================================

export enum TokenFlags {
    None = 0,
    HasError = 1 << 0,
    IsSynthetic = 1 << 1,   // 由解析器合成而非词法分析产生
    HasLeadingWhitespace = 1 << 2,
    PrecededByNewline = 1 << 3,
}

// ============================================================
// 注释 Token
// ============================================================

export interface CommentToken {
    text: string;               // 注释内容 (不含定界符)
    isBlock: boolean;           // true: /* */, false: //
    isDoc: boolean;             // true: /** */
    isParagraph: boolean;       // true: 段落注释
    span: SourceSpan;
}

// ============================================================
// Token 接口
// ============================================================

export interface Token {
    type: TokenType;
    lexeme: string;                             // 原始文本
    value?: string | number | boolean | null;   // 解析后的值 (用于字面量)
    span: SourceSpan;
    leadingTrivia: CommentToken[];               // 前置注释
    trailingTrivia: CommentToken[];              // 后置注释
    flags: TokenFlags;
    errorMessage?: string;                       // 仅 Error token
}

// ============================================================
// 辅助函数
// ============================================================

// 获取 TokenType 的分类
export function getTokenCategory(type: TokenType): TokenCategory {
    if (isKeyword(type)) return 'keyword';
    if (isTypeKeyword(type)) return 'type';
    if (isLiteral(type)) return 'literal';
    if (type === TokenType.Identifier) return 'identifier';
    if (isOperator(type)) return 'operator';
    if (isPunctuator(type)) return 'punctuator';
    if (type === TokenType.Comment) return 'comment';
    if (type === TokenType.Whitespace) return 'whitespace';
    if (type === TokenType.Newline) return 'newline';
    if (type === TokenType.Error) return 'error';
    if (type === TokenType.EOF) return 'eof';
    return 'error';
}

function isKeyword(type: TokenType): boolean {
    return type === TokenType.Fn || type === TokenType.Var ||
        type === TokenType.If || type === TokenType.Else ||
        type === TokenType.For || type === TokenType.While ||
        type === TokenType.Do || type === TokenType.Return ||
        type === TokenType.Break || type === TokenType.Continue ||
        type === TokenType.Switch || type === TokenType.Case ||
        type === TokenType.Default ||
        type === TokenType.True || type === TokenType.False ||
        type === TokenType.Null || type === TokenType.Unset ||
        type === TokenType.In ||
        type === TokenType.Tuple || type === TokenType.Enum ||
        type === TokenType.Assert || type === TokenType.New ||
        type === TokenType.Class || type === TokenType.Extends ||
        type === TokenType.This || type === TokenType.Super ||
        type === TokenType.Import || type === TokenType.Export ||
        type === TokenType.Public || type === TokenType.Private ||
        type === TokenType.Protected || type === TokenType.Static;
}

function isTypeKeyword(type: TokenType): boolean {
    return type === TokenType.ObjectType || type === TokenType.None ||
        type === TokenType.NumberType || type === TokenType.IntegerType ||
        type === TokenType.DecimalType || type === TokenType.StringType ||
        type === TokenType.CharType || type === TokenType.CharacterType ||
        type === TokenType.BoolType || type === TokenType.TriboolType ||
        type === TokenType.BitType || type === TokenType.ByteType ||
        type === TokenType.WordType || type === TokenType.DwordType ||
        type === TokenType.FloatType || type === TokenType.DoubleType ||
        type === TokenType.ListType || type === TokenType.SetType ||
        type === TokenType.MapType || type === TokenType.BufferType ||
        type === TokenType.Tuple ||
        type === TokenType.InfinityKw || type === TokenType.NaNKw;
}

export function isTypeToken(type: TokenType): boolean {
    return isTypeKeyword(type);
}

function isLiteral(type: TokenType): boolean {
    return type === TokenType.NumberLiteral ||
        type === TokenType.StringLiteral ||
        type === TokenType.MultiLineStringLiteral ||
        type === TokenType.InterpolatedString ||
        type === TokenType.CharLiteral;
}

function isOperator(type: TokenType): boolean {
    return type === TokenType.Plus || type === TokenType.Minus ||
        type === TokenType.Star || type === TokenType.Slash ||
        type === TokenType.Percent || type === TokenType.PlusPlus ||
        type === TokenType.MinusMinus || type === TokenType.Equals ||
        type === TokenType.PlusEquals || type === TokenType.MinusEquals ||
        type === TokenType.StarEquals || type === TokenType.SlashEquals ||
        type === TokenType.PercentEquals ||
        type === TokenType.EqualsEquals || type === TokenType.NotEquals ||
        type === TokenType.StrictEquals || type === TokenType.StrictNotEquals ||
        type === TokenType.LessThan || type === TokenType.GreaterThan ||
        type === TokenType.LessThanEquals || type === TokenType.GreaterThanEquals ||
        type === TokenType.AndAnd || type === TokenType.OrOr ||
        type === TokenType.Bang || type === TokenType.Ampersand ||
        type === TokenType.Pipe || type === TokenType.Caret ||
        type === TokenType.Tilde ||
        type === TokenType.LessThanLessThan ||
        type === TokenType.GreaterThanGreaterThan ||
        type === TokenType.MultiWayEq || type === TokenType.Arrow ||
        type === TokenType.Spread;
}

function isPunctuator(type: TokenType): boolean {
    return type === TokenType.LeftParen || type === TokenType.RightParen ||
        type === TokenType.LeftBracket || type === TokenType.RightBracket ||
        type === TokenType.LeftBrace || type === TokenType.RightBrace ||
        type === TokenType.Comma || type === TokenType.Semicolon ||
        type === TokenType.Dot || type === TokenType.Colon ||
        type === TokenType.QuestionMark || type === TokenType.At;
}

// 判断 token 是否可以在表达式中开始一个基本表达式
export function canStartExpression(type: TokenType): boolean {
    return type === TokenType.NumberLiteral ||
        type === TokenType.StringLiteral ||
        type === TokenType.CharLiteral ||
        type === TokenType.True || type === TokenType.False ||
        type === TokenType.Null || type === TokenType.Unset ||
        type === TokenType.Identifier ||
        type === TokenType.LeftParen ||
        type === TokenType.LeftBracket ||
        type === TokenType.Bang || type === TokenType.Minus ||
        type === TokenType.PlusPlus || type === TokenType.MinusMinus ||
        type === TokenType.Tilde ||
        type === TokenType.Spread ||
        isTypeKeywordStart(type);
}

// 判断 type token 是否可以作为类型注解开始
export function isTypeKeywordStart(type: TokenType): boolean {
    return isTypeKeyword(type);
}

// 判断是否为语句起始关键字
export function isStatementStartKeyword(type: TokenType): boolean {
    return type === TokenType.Fn || type === TokenType.Var ||
        type === TokenType.If || type === TokenType.While ||
        type === TokenType.For || type === TokenType.Do ||
        type === TokenType.Return || type === TokenType.Break ||
        type === TokenType.Continue || type === TokenType.Switch ||
        type === TokenType.Enum || type === TokenType.Class ||
        type === TokenType.Assert || type === TokenType.Import ||
        type === TokenType.Export ||
        isTypeKeywordStart(type);
}
