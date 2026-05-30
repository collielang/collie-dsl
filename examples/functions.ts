function square(x: number): number {
    return x * x;
}
function add(a: number, b: number): number {
    return a + b;
}
function greet(name: string) {
    console.log("Hello, " + name + "!");
}
function divide(a: number, b: number): [number, number] {
    let quotient: number = a / b;
    let remainder: number = a % b;
    return [quotient, remainder];
}
function factorial(n: number): number {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}
function main() {
    greet("Collie");
    let sq: number = square(5);
    console.log("5^2 = " + String(sq));
    let sum: number = add(3, 7);
    console.log("3 + 7 = " + String(sum));
    const _multi0 = divide(10, 3);
    let q: number = _multi0[0];
    let r: number = _multi0[1];
    console.log("10 / 3 = " + String(q) + " ... " + String(r));
    let fact5: number = factorial(5);
    console.log("5! = " + String(fact5));
}
main();