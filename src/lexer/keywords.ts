import { TokenType } from './token';

/**
 * 关键字映射表: 标识符文本 → TokenType
 * Lexer 在读取标识符后，查此表决定是关键字还是普通标识符
 */
export const KEYWORDS: Map<string, TokenType> = new Map([
    // 控制流关键字
    ['fn', TokenType.Fn],
    ['var', TokenType.Var],
    ['if', TokenType.If],
    ['else', TokenType.Else],
    ['for', TokenType.For],
    ['while', TokenType.While],
    ['do', TokenType.Do],
    ['return', TokenType.Return],
    ['break', TokenType.Break],
    ['continue', TokenType.Continue],
    ['switch', TokenType.Switch],
    ['case', TokenType.Case],
    ['default', TokenType.Default],

    // 字面量关键字
    ['true', TokenType.True],
    ['false', TokenType.False],
    ['null', TokenType.Null],
    ['unset', TokenType.Unset],

    // 复合关键字
    ['in', TokenType.In],
    ['Tuple', TokenType.Tuple],
    ['enum', TokenType.Enum],
    ['assert', TokenType.Assert],
    ['new', TokenType.New],
    ['class', TokenType.Class],
    ['extends', TokenType.Extends],
    ['this', TokenType.This],
    ['super', TokenType.Super],
    ['import', TokenType.Import],
    ['export', TokenType.Export],
    ['public', TokenType.Public],
    ['private', TokenType.Private],
    ['protected', TokenType.Protected],
    ['static', TokenType.Static],

    // 类型关键字
    ['object', TokenType.ObjectType],
    ['none', TokenType.None],
    ['number', TokenType.NumberType],
    ['integer', TokenType.IntegerType],
    ['decimal', TokenType.DecimalType],
    ['string', TokenType.StringType],
    ['char', TokenType.CharType],
    ['character', TokenType.CharacterType],
    ['bool', TokenType.BoolType],
    ['tribool', TokenType.TriboolType],
    ['bit', TokenType.BitType],
    ['byte', TokenType.ByteType],
    ['word', TokenType.WordType],
    ['dword', TokenType.DwordType],
    ['float', TokenType.FloatType],
    ['double', TokenType.DoubleType],
    ['list', TokenType.ListType],
    ['set', TokenType.SetType],
    ['map', TokenType.MapType],
    ['buffer', TokenType.BufferType],

    // 特殊字面量
    ['Infinity', TokenType.InfinityKw],
    ['NaN', TokenType.NaNKw],
]);

/**
 * 判断一个标识符文本是否为关键字
 */
export function isKeyword(text: string): boolean {
    return KEYWORDS.has(text);
}

/**
 * 在关键字表中查找 TokenType
 */
export function lookupKeyword(text: string): TokenType | undefined {
    return KEYWORDS.get(text);
}
