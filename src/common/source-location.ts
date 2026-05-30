// 源位置信息
export interface SourceLocation {
    offset: number;   // 0-based 字节偏移
    line: number;     // 1-based 行号
    column: number;   // 1-based 列号 (UTF-16 code units)
}

// 源跨度
export interface SourceSpan {
    start: SourceLocation;
    end: SourceLocation;
}

// 创建源位置
export function createLocation(offset: number, line: number, column: number): SourceLocation {
    return { offset, line, column };
}

// 创建源跨度
export function createSpan(start: SourceLocation, end: SourceLocation): SourceSpan {
    return { start, end };
}

// 从两个位置创建跨度
export function spanFromLocations(start: SourceLocation, end: SourceLocation): SourceSpan {
    return { start, end };
}

// 复制位置
export function cloneLocation(loc: SourceLocation): SourceLocation {
    return { offset: loc.offset, line: loc.line, column: loc.column };
}
