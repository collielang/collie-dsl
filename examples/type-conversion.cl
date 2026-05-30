// Collie Example: Type Conversion
// compile: npx ts-node src/cli.ts examples/type-conversion.cl
// run: node examples/type-conversion.ts

fn main() {
    // 数字类型转换
    integer bigInt = integer("9007199254740993");
    number num = number("42");
    decimal price = decimal("19.99");

    // 字符串转换
    string str = string(42);
    string piStr = string(3.14159);

    // 布尔转换
    bool truthy = bool(1);
    bool falsy = bool(0);

    // 打印验证
    print("integer: " + string(bigInt));
    print("number: " + string(num));
    print("decimal: " + string(price));
    print("str: " + str);
    print("bool(1): " + string(bool(truthy)));
    print("bool(0): " + string(bool(falsy)));
}

main();
