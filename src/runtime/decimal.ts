/**
 * Collie `decimal` Type — 运行时常量
 *
 * Collie 的 decimal 类型映射为 TypeScript 中封装了小数值运算的 Decimal 类。
 * Phase 1: 简单封装，后续可实现完整的任意精度小数运算。
 */
export class Decimal {
    readonly value: number;

    constructor(value: number | string | Decimal) {
        if (value instanceof Decimal) {
            this.value = value.value;
        } else {
            this.value = Number(value);
        }
    }

    static from(value: number | string): Decimal {
        return new Decimal(value);
    }

    add(other: number | Decimal): Decimal {
        const rhs = other instanceof Decimal ? other.value : other;
        return new Decimal(this.value + rhs);
    }

    sub(other: number | Decimal): Decimal {
        const rhs = other instanceof Decimal ? other.value : other;
        return new Decimal(this.value - rhs);
    }

    mul(other: number | Decimal): Decimal {
        const rhs = other instanceof Decimal ? other.value : other;
        return new Decimal(this.value * rhs);
    }

    div(other: number | Decimal): Decimal {
        const rhs = other instanceof Decimal ? other.value : other;
        return new Decimal(this.value / rhs);
    }

    eq(other: number | Decimal): boolean {
        const rhs = other instanceof Decimal ? other.value : other;
        return this.value === rhs;
    }

    lt(other: number | Decimal): boolean {
        const rhs = other instanceof Decimal ? other.value : other;
        return this.value < rhs;
    }

    gt(other: number | Decimal): boolean {
        const rhs = other instanceof Decimal ? other.value : other;
        return this.value > rhs;
    }

    toString(): string {
        return String(this.value);
    }

    toNumber(): number {
        return this.value;
    }

    valueOf(): number {
        return this.value;
    }
}
