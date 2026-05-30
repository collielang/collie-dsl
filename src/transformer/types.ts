/**
 * Collie → TypeScript 类型映射
 *
 * Phase 1 类型映射:
 *   number    → number
 *   integer   → bigint
 *   decimal   → Decimal (来自运行时库)
 *   string    → string
 *   char      → string
 *   character → string
 *   bool      → boolean
 *   object    → object
 *   none      → void
 *   tribool   → number | boolean | null  (Phase 2)
 */

const TYPE_MAP: Record<string, string> = {
    'number': 'number',
    'integer': 'bigint',
    'decimal': 'Decimal',
    'string': 'string',
    'char': 'string',
    'character': 'string',
    'bool': 'boolean',
    'object': 'object',
    'none': 'void',
    'float': 'number',
    'double': 'number',
};

/**
 * 将 Collie 类型名映射为 TypeScript 类型名
 */
export function mapType(collieType: string): string {
    return TYPE_MAP[collieType] || collieType;
}

/**
 * 将 Collie 类型注解转换为 TypeScript 类型字符串
 * 返回 null 表示 var 推断 (无类型注解)
 */
export function mapTypeAnnotation(name: string): string | null {
    if (!name) return null;
    return mapType(name);
}
