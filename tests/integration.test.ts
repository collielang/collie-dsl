import { Compiler, compile } from '../src/compiler';

describe('Compiler 集成测试', () => {
    describe('变量声明', () => {
        it('number 类型', () => {
            const result = compile('number x = 42;');
            expect(result.success).toBe(true);
            expect(result.code).toContain('let x: number = 42');
        });

        it('var 类型推断', () => {
            const result = compile('var x = 42;');
            expect(result.success).toBe(true);
            expect(result.code).toContain('let x = 42');
        });

        it('字符串', () => {
            const result = compile('string name = "Collie";');
            expect(result.success).toBe(true);
            expect(result.code).toContain('let name: string = "Collie"');
        });

        it('bool 类型', () => {
            const result = compile('bool flag = true;');
            expect(result.success).toBe(true);
            expect(result.code).toContain('let flag: boolean = true');
        });
    });

    describe('函数声明', () => {
        it('基本函数', () => {
            const source = `fn add(a: number, b: number): number {
    return a + b;
}`;
            const result = compile(source);
            expect(result.success).toBe(true);
            const code = result.code;
            expect(code).toContain('function add');
            expect(code).toContain('a: number');
            expect(code).toContain('b: number');
            expect(code).toContain(': number');
            expect(code).toContain('return a + b');
        });

        it('无返回值函数', () => {
            const source = `fn log(msg: string) {
    print(msg);
}`;
            const result = compile(source);
            expect(result.success).toBe(true);
            expect(result.code).toContain('function log(msg: string)');
            expect(result.code).not.toContain(': void');
            // print → console.log
            expect(result.code).toContain('console.log(msg)');
        });

        it('多返回值函数', () => {
            const source = `fn getPair(): string, integer {
    return "hello", 42;
}`;
            const result = compile(source);
            expect(result.success).toBe(true);
            expect(result.code).toContain(': [string, bigint]');
            expect(result.code).toContain('return ["hello", 42]');
        });
    });

    describe('控制流', () => {
        it('if-else', () => {
            const source = `if (x > 0) {
    x = 1;
} else {
    x = 0;
}`;
            const result = compile(source);
            expect(result.success).toBe(true);
            expect(result.code).toContain('if (x > 0)');
            expect(result.code).toContain('else');
        });

        it('while', () => {
            const source = `while (x < 10) {
    x = x + 1;
}`;
            const result = compile(source);
            expect(result.success).toBe(true);
            expect(result.code).toContain('while (x < 10)');
        });

        it('do-while', () => {
            const source = `do {
    x = x + 1;
} while (x < 10);`;
            const result = compile(source);
            expect(result.success).toBe(true);
            expect(result.code).toContain('do {');
            expect(result.code).toContain('while (x < 10)');
        });

        it('C-style for', () => {
            const source = `for (var i = 0; i < 10; i = i + 1) {
    print(i);
}`;
            const result = compile(source);
            expect(result.success).toBe(true);
            expect(result.code).toContain('for (let i = 0; i < 10; i = i + 1)');
        });

        it('for-each', () => {
            const source = `for (item : items) {
    print(item);
}`;
            const result = compile(source);
            expect(result.success).toBe(true);
            expect(result.code).toContain('for (const item of items)');
        });
    });

    describe('表达式', () => {
        it('二元运算', () => {
            const result = compile('number x = 1 + 2 * 3;');
            expect(result.success).toBe(true);
            expect(result.code).toContain('1 + 2 * 3');
        });

        it('三元表达式', () => {
            const result = compile('number x = a ? 1 : 2;');
            expect(result.success).toBe(true);
            expect(result.code).toContain('a ? 1 : 2');
        });

        it('成员访问', () => {
            const result = compile('number x = obj.field;');
            expect(result.success).toBe(true);
            expect(result.code).toContain('obj.field');
        });

        it('函数调用', () => {
            const result = compile('number x = add(1, 2);');
            expect(result.success).toBe(true);
            expect(result.code).toContain('add(1, 2)');
        });
    });

    describe('完整程序', () => {
        it('阶乘函数', () => {
            const source = `fn factorial(n: number): number {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}`;
            const result = compile(source);
            expect(result.success).toBe(true);
            const code = result.code;
            expect(code).toContain('function factorial(n: number): number');
            expect(code).toContain('if (n <= 1)');
            expect(code).toContain('return 1');
            expect(code).toContain('return n * factorial(n - 1)');
        });

        it('多语句程序', () => {
            const source = `number x = 1;
var y = x + 2;
if (x > 0) {
    x = x + 1;
}`;
            const result = compile(source);
            expect(result.success).toBe(true);
            const code = result.code;
            expect(code).toContain('let x: number = 1');
            expect(code).toContain('let y = x + 2');
            expect(code).toContain('if (x > 0)');
        });
    });

    describe('API 映射 (Collie → TypeScript)', () => {
        it('print → console.log', () => {
            const result = compile('print("hello");');
            expect(result.success).toBe(true);
            expect(result.code).toContain('console.log("hello")');
        });

        it('print 保留在复杂表达式中', () => {
            const source = `fn greet(name: string) {
    print("Hello, " + name);
}`;
            const result = compile(source);
            expect(result.success).toBe(true);
            expect(result.code).toContain('console.log(');
        });

        it('type 转换: number() → Number()', () => {
            const result = compile('number x = number("42");');
            expect(result.success).toBe(true);
            expect(result.code).toContain('Number(');
        });

        it('type 转换: string() → String()', () => {
            const result = compile('string s = string(42);');
            expect(result.success).toBe(true);
            expect(result.code).toContain('String(');
        });

        it('type 转换: bool() → Boolean()', () => {
            const result = compile('bool b = bool(1);');
            expect(result.success).toBe(true);
            expect(result.code).toContain('Boolean(');
        });

        it('type 转换: integer() → BigInt()', () => {
            const result = compile('integer i = integer("9007199254740993");');
            expect(result.success).toBe(true);
            expect(result.code).toContain('BigInt(');
        });

        it('decimal() → new Decimal()', () => {
            const result = compile('decimal d = decimal("3.14159");');
            expect(result.success).toBe(true);
            // 生成 import
            expect(result.code).toContain("import { Decimal } from './decimal.ts'");
            expect(result.code).toContain('new Decimal(');
        });

        it('自定义函数名不受映射影响', () => {
            const result = compile('number x = myPrint(42);');
            expect(result.success).toBe(true);
            expect(result.code).toContain('myPrint(42)');
        });
    });

    describe('错误处理', () => {
        it('词法错误', () => {
            const result = compile('number x = @@@;');
            expect(result.success).toBe(false);
            expect(result.diagnostics.getErrors().length).toBeGreaterThan(0);
        });

        it('语法错误', () => {
            const result = compile('number x = ;');
            expect(result.success).toBe(false);
            expect(result.diagnostics.getErrors().length).toBeGreaterThan(0);
        });
    });

    describe('Phase 2: Enum', () => {
        it('基本枚举 — 编译为 const 对象 + type 别名', () => {
            const source = `enum Season { Spring, Summer, Autumn, Winter }`;
            const result = compile(source);
            expect(result.success).toBe(true);
            // const 对象模式
            expect(result.code).toContain('const Season = {');
            expect(result.code).toContain('Spring: 0');
            expect(result.code).toContain('Summer: 1');
            expect(result.code).toContain('Autumn: 2');
            expect(result.code).toContain('Winter: 3');
            expect(result.code).toContain('} as const;');
            // type 别名
            expect(result.code).toContain('type Season = (typeof Season)[keyof typeof Season];');
        });

        it('枚举成员带值', () => {
            const source = `enum Code { A = 1, B = 2 }`;
            const result = compile(source);
            expect(result.success).toBe(true);
            expect(result.code).toContain('const Code = {');
            expect(result.code).toContain('A: 1');
            expect(result.code).toContain('B: 2');
            expect(result.code).toContain('} as const;');
            expect(result.code).toContain('type Code = (typeof Code)[keyof typeof Code];');
        });

        it('枚举成员混合自动递增和显式值', () => {
            const source = `enum Mixed { A, B = 10, C }`;
            const result = compile(source);
            expect(result.success).toBe(true);
            expect(result.code).toContain('A: 0');
            expect(result.code).toContain('B: 10');
            expect(result.code).toContain('C: 11');
        });
    });

    describe('Phase 2: Tribool', () => {
        it('tribool 类型 → boolean | undefined', () => {
            const result = compile('tribool t = true;');
            expect(result.success).toBe(true);
            expect(result.code).toContain('let t: boolean | undefined = true');
        });

        it('unset → undefined', () => {
            const result = compile('tribool t = unset;');
            expect(result.success).toBe(true);
            expect(result.code).toContain('let t: boolean | undefined = undefined');
        });
    });

    describe('Phase 2: Tuple', () => {
        it('Tuple 类型 → object', () => {
            const result = compile('Tuple person = (name: "Alice", age: 18);');
            expect(result.success).toBe(true);
            expect(result.code).toContain('let person: object = {');
            expect(result.code).toContain('name: "Alice"');
            expect(result.code).toContain('age: 18');
        });
    });

    describe('Phase 2: Spread', () => {
        it('spread 前缀表达式', () => {
            const result = compile('var x = ...args;');
            expect(result.success).toBe(true);
            expect(result.code).toContain('let x = ...args');
        });
    });
});
