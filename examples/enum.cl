// Collie Example: 枚举 (Phase 2)
// compile: npx ts-node src/cli.ts examples/enum.cl

// 简单枚举 — 编译为 TypeScript enum
enum Season { Spring, Summer, Autumn, Winter }

// 带值枚举
enum StatusCode { OK = 200, NotFound = 404, ServerError = 500 }

fn main() {
    number spring = 0;
    number ok = 200;
    print("Spring = " + string(spring));
    print("OK Status = " + string(ok));
}

main();
