// Collie Example: 枚举 (Phase 2)
// compile: npx ts-node src/cli.ts examples/enum.cl
// run: node examples/enum.ts

// 简单枚举 — 编译为 const 对象 + type 别名
// => const Season = { Spring: 0, Summer: 1, Autumn: 2, Winter: 3 } as const;
enum Season { Spring, Summer, Autumn, Winter }

// 带值枚举
// => const StatusCode = { OK: 200, NotFound: 404, ServerError: 500 } as const;
enum StatusCode { OK = 200, NotFound = 404, ServerError = 500 }

fn main() {
    // 访问枚举成员
    print("Spring = " + string(Season.Spring));
    print("Summer = " + string(Season.Summer));
    print("OK Status = " + string(StatusCode.OK));
    print("Not Found = " + string(StatusCode.NotFound));
}

main();
