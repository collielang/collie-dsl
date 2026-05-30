import { Parser } from '../../src/parser/index';

function parse(source: string) {
    const { program, diagnostics } = Parser.fromSource(source);
    return { program, diagnostics };
}

describe('Parser', () => {
    describe('变量声明', () => {
        it('显式类型声明', () => {
            const { program } = parse('number x = 42;');
            expect(program.statements.length).toBe(1);
            const stmt = program.statements[0];
            expect(stmt.kind).toBe('VariableDeclaration');
            if (stmt.kind === 'VariableDeclaration') {
                expect(stmt.varType).not.toBeNull();
                expect(stmt.varType!.kind).toBe('IdentifierType');
                expect((stmt.varType as any).name).toBe('number');
                expect(stmt.name.name).toBe('x');
                expect(stmt.initializer.kind).toBe('NumberLiteral');
            }
        });

        it('var 类型推断', () => {
            const { program } = parse('var x = 42;');
            expect(program.statements.length).toBe(1);
            const stmt = program.statements[0];
            expect(stmt.kind).toBe('VariableDeclaration');
            if (stmt.kind === 'VariableDeclaration') {
                expect(stmt.varType).toBeNull();
                expect(stmt.name.name).toBe('x');
            }
        });

        it('字符串变量', () => {
            const { program } = parse('string name = "Collie";');
            const stmt = program.statements[0];
            expect(stmt.kind).toBe('VariableDeclaration');
            if (stmt.kind === 'VariableDeclaration') {
                expect(stmt.initializer.kind).toBe('StringLiteral');
            }
        });
    });

    describe('函数声明', () => {
        it('基本函数', () => {
            const source = `fn add(a: number, b: number): number {
    return a + b;
}`;
            const { program } = parse(source);
            expect(program.statements.length).toBe(1);
            const fn = program.statements[0];
            expect(fn.kind).toBe('FunctionDeclaration');
            if (fn.kind === 'FunctionDeclaration') {
                expect(fn.name.name).toBe('add');
                expect(fn.parameters.length).toBe(2);
                expect(fn.returnTypes.length).toBe(1);
                expect(fn.body.kind).toBe('BlockStatement');
            }
        });

        it('无返回值函数', () => {
            const source = `fn log(msg: string) {
    print(msg);
}`;
            const { program } = parse(source);
            const fn = program.statements[0];
            expect(fn.kind).toBe('FunctionDeclaration');
            if (fn.kind === 'FunctionDeclaration') {
                expect(fn.returnTypes.length).toBe(0);
            }
        });

        it('多返回值函数', () => {
            const source = `fn getPair(): string, integer {
    return "hello", 42;
}`;
            const { program } = parse(source);
            const fn = program.statements[0];
            expect(fn.kind).toBe('FunctionDeclaration');
            if (fn.kind === 'FunctionDeclaration') {
                expect(fn.returnTypes.length).toBe(2);
                expect((fn.returnTypes[0] as any).name).toBe('string');
                expect((fn.returnTypes[1] as any).name).toBe('integer');
            }
        });
    });

    describe('表达式', () => {
        it('二元运算', () => {
            const { program } = parse('number x = 1 + 2 * 3;');
            const stmt = program.statements[0];
            expect(stmt.kind).toBe('VariableDeclaration');
            if (stmt.kind === 'VariableDeclaration') {
                expect(stmt.initializer.kind).toBe('BinaryExpression');
            }
        });

        it('函数调用', () => {
            const source = `fn main() {
    print("hello");
}`;
            const { program } = parse(source);
            const fn = program.statements[0];
            if (fn.kind === 'FunctionDeclaration') {
                const call = fn.body.statements[0];
                expect(call.kind).toBe('ExpressionStatement');
            }
        });

        it('三元表达式', () => {
            const { program } = parse('number x = a ? 1 : 2;');
            const stmt = program.statements[0];
            if (stmt.kind === 'VariableDeclaration') {
                expect(stmt.initializer.kind).toBe('TernaryExpression');
            }
        });

        it('成员访问', () => {
            const { program } = parse('number x = obj.field;');
            const stmt = program.statements[0];
            if (stmt.kind === 'VariableDeclaration') {
                expect(stmt.initializer.kind).toBe('MemberAccessExpression');
            }
        });

        it('比较运算符', () => {
            const { program } = parse('bool b = a == b && c > d;');
            const stmt = program.statements[0];
            if (stmt.kind === 'VariableDeclaration') {
                expect(stmt.initializer.kind).toBe('BinaryExpression');
            }
        });
    });

    describe('控制流', () => {
        it('if-else', () => {
            const source = `if (x > 0) {
    x = 1;
} else {
    x = 0;
}`;
            const { program } = parse(source);
            const stmt = program.statements[0];
            expect(stmt.kind).toBe('IfStatement');
            if (stmt.kind === 'IfStatement') {
                expect(stmt.condition.kind).toBe('BinaryExpression');
                expect(stmt.consequent.kind).toBe('BlockStatement');
                expect(stmt.alternate).not.toBeNull();
            }
        });

        it('while', () => {
            const source = `while (x < 10) {
    x = x + 1;
}`;
            const { program } = parse(source);
            const stmt = program.statements[0];
            expect(stmt.kind).toBe('WhileStatement');
        });

        it('do-while', () => {
            const source = `do {
    x = x + 1;
} while (x < 10);`;
            const { program } = parse(source);
            const stmt = program.statements[0];
            expect(stmt.kind).toBe('DoWhileStatement');
        });

        it('C-style for', () => {
            const source = `for (var i = 0; i < 10; i = i + 1) {
    print(i);
}`;
            const { program } = parse(source);
            const stmt = program.statements[0];
            expect(stmt.kind).toBe('ForStatement');
            if (stmt.kind === 'ForStatement') {
                expect(stmt.forKind).toBe('c-style');
            }
        });

        it('for-each', () => {
            const source = `for (item : items) {
    print(item);
}`;
            const { program } = parse(source);
            const stmt = program.statements[0];
            expect(stmt.kind).toBe('ForStatement');
            if (stmt.kind === 'ForStatement') {
                expect(stmt.forKind).toBe('each');
                expect(stmt.loopVariable).not.toBeNull();
            }
        });

        it('return', () => {
            const source = `fn foo(): number { return 42; }`;
            const { program } = parse(source);
            const fn = program.statements[0];
            if (fn.kind === 'FunctionDeclaration') {
                const ret = fn.body.statements[0];
                expect(ret.kind).toBe('ReturnStatement');
                if (ret.kind === 'ReturnStatement') {
                    expect(ret.values.length).toBe(1);
                }
            }
        });
    });

    describe('完整程序', () => {
        it('多语句程序', () => {
            const source = `number x = 1;
var y = x + 2;
if (x > 0) {
    x = x + 1;
}`;
            const { program } = parse(source);
            expect(program.statements.length).toBe(3);
        });

        it('函数+控制流', () => {
            const source = `fn factorial(n: number): number {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}`;
            const { program } = parse(source);
            expect(program.statements.length).toBe(1);
            const fn = program.statements[0];
            expect(fn.kind).toBe('FunctionDeclaration');
        });
    });

    describe('错误恢复', () => {
        it('错误 token 后继续解析', () => {
            const source = `number x = @@@;
var y = 2;`;
            const { program, diagnostics } = parse(source);
            // 应该有错误，但至少解析出 var y 语句
            const errs = diagnostics.getErrors();
            expect(errs.length).toBeGreaterThan(0);
            expect(program.statements.length).toBeGreaterThanOrEqual(1);
        });
    });
});
