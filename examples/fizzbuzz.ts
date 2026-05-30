function fizzbuzz(n: number): string {
    if (n % 15 === 0) {
        return "FizzBuzz";
    } else if (n % 3 === 0) {
        return "Fizz";
    } else if (n % 5 === 0) {
        return "Buzz";
    }
    return String(n);
}
function main() {
    console.log("FizzBuzz (1 to 30):");
    let i: number = 1;
    while (i <= 30) {
        let result: string = fizzbuzz(i);
        console.log(String(i) + ": " + result);
        i = i + 1;
    }
}
main();