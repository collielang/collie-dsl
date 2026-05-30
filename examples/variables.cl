// Collie Example: Variable Declarations
// compile: npx ts-node src/cli.ts examples/variables.cl
// run: node examples/variables.ts

fn main() {
    // 显式类型声明
    number x = 42;
    number pi = 3.14159;
    integer big = 9007199254740993;
    decimal price = decimal("19.99");
    string name = "Collie";
    char initial = 'C';
    bool flag = true;
    bool done = false;

    // var 类型推断
    var inferred = x + 10;
    var message = "Hello, " + name;
    var condition = x > 0 && flag;

    // 输出验证
    print("x = " + string(x));
    print("name = " + name);
    print("flag = " + string(bool(flag)));
    print("inferred = " + string(inferred));
}

main();
