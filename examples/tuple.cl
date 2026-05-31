// Collie Example: Tuple 命名元组 (Phase 2)
// compile: npx ts-node src/cli.ts examples/tuple.cl
// run: node examples/tuple.ts

// Tuple 类型 — 编译为 object
// Tuple 字面量 — 编译为 { key: value, ... }
Tuple alice = (name: "Alice", age: 18);
Tuple bob = (name: "Bob", age: 25);

fn main() {
    // 通过字段名访问 Tuple 成员
    print("alice.name = " + string(alice.name));
    print("alice.age = " + string(alice.age));
    print("bob.name = " + string(bob.name));
    print("bob.age = " + string(bob.age));

    // 计算验证
    number totalAge = alice.age + bob.age;
    print("total age = " + string(totalAge));
}

main();
