import { TokenType } from '../lexer/token';
import { ErrorNode } from './ast';
import { SourceSpan } from '../common/source-location';
import { DiagnosticBag } from '../common/diagnostics';

/**
 * 错误恢复 — 同步点定义和跳过逻辑
 */

// 语句起始关键字 (作为语法恢复的锚点)
export const SYNC_KEYWORDS: Set<TokenType> = new Set([
    TokenType.Fn,
    TokenType.Var,
    TokenType.If,
    TokenType.Else,
    TokenType.While,
    TokenType.For,
    TokenType.Do,
    TokenType.Return,
    TokenType.Break,
    TokenType.Continue,
    TokenType.Switch,
    TokenType.Enum,
    TokenType.Class,
    TokenType.Assert,
    TokenType.Import,
    TokenType.Export,
    // 类型关键字也是可能的语句起始 (变量声明)
    TokenType.NumberType,
    TokenType.IntegerType,
    TokenType.DecimalType,
    TokenType.StringType,
    TokenType.CharType,
    TokenType.CharacterType,
    TokenType.BoolType,
    TokenType.TriboolType,
    TokenType.BitType,
    TokenType.ByteType,
    TokenType.WordType,
    TokenType.DwordType,
    TokenType.FloatType,
    TokenType.DoubleType,
    TokenType.ObjectType,
    TokenType.None,
    TokenType.ListType,
    TokenType.SetType,
    TokenType.MapType,
    TokenType.BufferType,
]);

// 同步 token: 分离符和块结束
export const SYNC_TOKENS: Set<TokenType> = new Set([
    TokenType.Semicolon,
    TokenType.RightBrace,
    TokenType.EOF,
]);

/**
 * 判断 token 类型是否为同步点
 */
export function isSyncPoint(type: TokenType): boolean {
    return SYNC_KEYWORDS.has(type) || SYNC_TOKENS.has(type);
}

/**
 * 创建错误节点
 */
export function createErrorNode(message: string, span: SourceSpan): ErrorNode {
    return {
        kind: 'ErrorNode',
        message,
        span,
    };
}

/**
 * 报告解析错误并创建 ErrorNode
 */
export function reportError(
    diagnostics: DiagnosticBag,
    message: string,
    span: SourceSpan,
): ErrorNode {
    diagnostics.addError(message, span);
    return createErrorNode(message, span);
}
