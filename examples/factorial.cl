// Collie Example: 阶乘计算
// compile: npx ts-node src/cli.ts examples/factorial.cl
// run: node examples/factorial.ts

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
