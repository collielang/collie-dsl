// Collie Example: FizzBuzz
// compile: npx ts-node src/cli.ts examples/fizzbuzz.cl
// run: node examples/fizzbuzz.ts

fn fizzbuzz(n: number): string {
    if (n % 15 == 0) {
        return "FizzBuzz";
    } else if (n % 3 == 0) {
        return "Fizz";
    } else if (n % 5 == 0) {
        return "Buzz";
    }
    return string(n);
}

fn main() {
    print("FizzBuzz (1 to 30):");

    number i = 1;
    while (i <= 30) {
        string result = fizzbuzz(i);
        print(string(i) + ": " + result);
        i = i + 1;
    }
}

main();
