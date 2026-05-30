function fibonacci(n: number): number {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}
function printFibonacci(count: number) {
    let i: number = 0;
    while (i < count) {
        let fib: number = fibonacci(i);
        console.log("F(" + String(i) + ") = " + String(fib));
        i = i + 1;
    }
}
function main() {
    console.log("Fibonacci Sequence:");
    printFibonacci(10);
}