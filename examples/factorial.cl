// Collie DSL Example — 阶乘计算
// 编译: npx ts-node src/cli.ts examples/factorial.cl
// 运行: node examples/factorial.ts

fn factorial(n: number): number {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

fn main() {
    number result = factorial(5);
    print(result);
}

main();
