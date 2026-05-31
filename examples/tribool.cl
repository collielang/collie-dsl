// Collie Example: tribool 三态布尔 (Phase 2)
// compile: npx ts-node src/cli.ts examples/tribool.cl
// run: node examples/tribool.ts

// tribool 类型 — 编译为 boolean | 'unset'
tribool active = true;
tribool pending = false;
tribool unknown = unset;   // 第三态：'unset'

fn check(value: tribool) {
    // unset 判断：三态布尔专门用于"未设置"场景
    if (value == unset) {
        print("  state: unset");
    } else if (value) {
        print("  state: true");
    } else {
        print("  state: false");
    }
}

fn main() {
    print("active:");
    check(active);

    print("pending:");
    check(pending);

    print("unknown:");
    check(unknown);
}

main();
