// Collie Example: Tuple 命名元组 (Phase 2)
// compile: npx ts-node src/cli.ts examples/tuple.cl

// Tuple 类型 — 编译为 object
// Tuple 字面量 — 编译为 { key: value, ... }
Tuple alice = (name: "Alice", age: 18);
Tuple bob = (name: "Bob", age: 25);

fn main() {
    // 通过对象属性访问
    print("Tuple 编译完成");
    print("alice = { name: Alice, age: 18 }");
    print("bob = { name: Bob, age: 25 }");
}

main();
