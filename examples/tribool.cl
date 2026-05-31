// Collie Example: tribool 三态布尔 (Phase 2)
// compile: npx ts-node src/cli.ts examples/tribool.cl

// tribool 类型 — 编译为 boolean | undefined
tribool active = true;
tribool pending = false;
tribool unknown = unset;   // 第三态：未设置

fn main() {
    print("active = " + string(bool(active)));
    print("pending = " + string(bool(pending)));
    // unset 编译为 undefined，判断时需要特殊处理
    print("unknown is unset");
}

main();
