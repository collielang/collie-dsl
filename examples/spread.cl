// Collie Example: 展开运算符 ... (Phase 2)
// compile: npx ts-node src/cli.ts examples/spread.cl
// run: node examples/spread.ts

fn main() {
    // 展开运算符在函数参数中
    string msg = "ABC";
    print(...msg);  // 等价于 print("A", "B", "C")

    // 展开运算符作为前缀表达式
    var x = 42;
    print(string(x));
}

main();
