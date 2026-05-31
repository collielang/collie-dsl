// Collie Example: 展开运算符 ... (Phase 2)
// compile: npx ts-node src/cli.ts examples/spread.cl

fn main() {
    // 展开一个标识符
    var x = 42;
    var y = ...x;

    print("spread 编译完成");
}

main();
