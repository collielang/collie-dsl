function main() {
    let x: number = 10;
    if (x > 100) {
        console.log("x is very large");
    } else if (x > 50) {
        console.log("x is large");
    } else if (x > 10) {
        console.log("x is medium");
    } else {
        console.log("x is small");
    }
    let count: number = 0;
    while (count < 5) {
        console.log("while: " + String(count));
        count = count + 1;
    }
    let n: number = 0;
    do {
        console.log("do-while: " + String(n));
        n = n + 1;
    } while (n < 3);
    for (let i = 0; i < 3; i = i + 1) {
        console.log("for i: " + String(i));
    }
    console.log("--- for-each demo ---");
}