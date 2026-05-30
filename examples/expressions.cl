// Collie Example: Expressions & Operators
// compile: npx ts-node src/cli.ts examples/expressions.cl
// run: node examples/expressions.ts

fn main() {
    number a = 10;
    number b = 3;

    // 算术运算: + - * / %
    number add = a + b;
    number sub = a - b;
    number mul = a * b;
    number div = a / b;
    number mod = a % b;

    print("a + b = " + string(add));
    print("a - b = " + string(sub));
    print("a * b = " + string(mul));
    print("a / b = " + string(div));
    print("a % b = " + string(mod));

    // 比较运算: == != < > <= >=
    bool eq = a == b;
    bool neq = a != b;
    bool lt = a < b;
    bool gt = a > b;
    bool le = a <= b;
    bool ge = a >= b;

    // 逻辑运算: && ||
    bool and = (a > 0) && (b > 0);
    bool or = (a > 100) || (b < 10);

    // 三元表达式
    number max = a > b ? a : b;
    print("max = " + string(max));

    // 一元运算符: - !
    number neg = -a;
    bool flag = true;
    bool not = !flag;
    print("neg = " + string(neg));
    print("not true = " + string(bool(not)));

    // 成员访问 (示意)
    // obj.field;
}

main();
