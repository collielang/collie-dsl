// Collie Example: Fibonacci Sequence
// compile: npx ts-node src/cli.ts examples/fibonacci.cl
// run: node examples/fibonacci.ts

// 递归计算第 n 项斐波那契数
fn fibonacci(n: number): number {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// 打印前 N 项斐波那契数
fn printFibonacci(count: number) {
    number i = 0;
    while (i < count) {
        number fib = fibonacci(i);
        print("F(" + string(i) + ") = " + string(fib));
        i = i + 1;
    }
}

fn main() {
    print("Fibonacci Sequence:");
    printFibonacci(10);
}

main();
