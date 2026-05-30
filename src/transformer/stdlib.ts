/**
 * Collie 标准库 → TypeScript API 映射
 *
 * Collie 内置函数/API 在编译时需要替换为对应的 TypeScript 等效调用。
 */

// Collie 内置函数 → TypeScript 函数名映射
const FUNCTION_MAP: Record<string, string> = {
    // I/O
    'print': 'console.log',
    'printLine': 'console.log',
    'println': 'console.log',

    // 类型转换 (类型关键字作为函数调用)
    'number': 'Number',
    'integer': 'BigInt',
    'string': 'String',
    'bool': 'Boolean',

    // 断言
    'assert': 'console.assert',
};

// Collie 类型转换函数 → TypeScript new 表达式
const CONSTRUCTOR_MAP: Record<string, string> = {
    'decimal': 'Decimal',   // decimal(x) → new Decimal(x)
};

/**
 * 检查是否为 Collie 内置函数
 */
export function isBuiltin(name: string): boolean {
    return name in FUNCTION_MAP || name in CONSTRUCTOR_MAP;
}

/**
 * 获取 Collie 内置函数的 TypeScript 映射名
 */
export function mapBuiltinFunction(name: string): string {
    return FUNCTION_MAP[name] || CONSTRUCTOR_MAP[name] || name;
}

/**
 * 是否需要使用 new 关键字
 */
export function isConstructorCall(name: string): boolean {
    return name in CONSTRUCTOR_MAP;
}

/**
 * 检查是否为 Collie 类型转换调用
 * 例如: number(x) → Number(x), string(x) → String(x)
 */
export function isTypeConversionCall(name: string): boolean {
    return name === 'number' || name === 'integer' ||
           name === 'string' || name === 'bool' ||
           name === 'decimal';
}
