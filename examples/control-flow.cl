// Collie Example: Control Flow
// compile: npx ts-node src/cli.ts examples/control-flow.cl
// run: node examples/control-flow.ts

fn main() {
    number x = 10;

    // if / else if / else
    if (x > 100) {
        print("x is very large");
    } else if (x > 50) {
        print("x is large");
    } else if (x > 10) {
        print("x is medium");
    } else {
        print("x is small");
    }

    // while 循环
    number count = 0;
    while (count < 5) {
        print("while: " + string(count));
        count = count + 1;
    }

    // do-while 循环 (至少执行一次)
    number n = 0;
    do {
        print("do-while: " + string(n));
        n = n + 1;
    } while (n < 3);

    // C-style for 循环
    for (var i = 0; i < 3; i = i + 1) {
        print("for i: " + string(i));
    }

    // for-each 循环
    print("--- for-each demo ---");
    // (需要 iterable 支持，示意)
}

main();
