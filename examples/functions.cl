// Collie Example: Functions
// compile: npx ts-node src/cli.ts examples/functions.cl

// 基本函数 — 单参数 + 单返回值
fn square(x: number): number {
    return x * x;
}

// 多参数函数
fn add(a: number, b: number): number {
    return a + b;
}

// 无返回值函数 (void)
fn greet(name: string) {
    print("Hello, " + name + "!");
}

// 多返回值函数
fn divide(a: number, b: number): number, number {
    number quotient = a / b;
    number remainder = a % b;
    return quotient, remainder;
}

// 递归函数
fn factorial(n: number): number {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

fn main() {
    greet("Collie");

    number sq = square(5);
    print("5^2 = " + string(sq));

    number sum = add(3, 7);
    print("3 + 7 = " + string(sum));

    // 验证多返回值解构
    number q, r = divide(10, 3);
    print("10 / 3 = " + string(q) + " ... " + string(r));

    number fact5 = factorial(5);
    print("5! = " + string(fact5));
}
