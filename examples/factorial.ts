function factorial(n: number): number {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}
function main() {
    let result: number = factorial(5);
    console.log(result);
}
main();