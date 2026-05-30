// Collie Example: All Operators
// compile: npx ts-node src/cli.ts examples/operators.cl
// run: node examples/operators.ts

fn main() {
    number a = 10;
    number b = 3;

    // ========================================
    // 算术运算: + - * / %
    // ========================================
    number add = a + b;
    number sub = a - b;
    number mul = a * b;
    number div = a / b;
    number mod = a % b;

    print("加法: " + string(add));
    print("减法: " + string(sub));
    print("乘法: " + string(mul));
    print("除法: " + string(div));
    print("取模: " + string(mod));

    // ========================================
    // 比较运算: == != < > <= >=
    // Collie 的 == 等价于 TypeScript 的 ===（严格相等，无隐式类型转换）
    // ========================================
    bool eq = a == 10;
    bool ne = a != 5;
    bool lt = a < 20;
    bool gt = a > 0;
    bool le = a <= 10;
    bool ge = a >= 10;

    print("等于: " + string(bool(eq)));
    print("不等于: " + string(bool(ne)));
    print("小于: " + string(bool(lt)));
    print("大于: " + string(bool(gt)));

    // ========================================
    // 位运算: & | ^ ~ << >>
    // ========================================
    number and = a & b;
    number or = a | b;
    number xor = a ^ b;
    number notBits = ~a;
    number shl = a << 2;
    number shr = a >> 1;

    print("位与: " + string(and));
    print("位或: " + string(or));
    print("位异或: " + string(xor));
    print("位取反: " + string(notBits));
    print("左移: " + string(shl));
    print("右移: " + string(shr));

    // ========================================
    // 逻辑运算: && || !
    // ========================================
    bool and2 = (a > 0) && (b > 0);
    bool or2 = (a > 100) || (b < 10);
    bool not2 = !(a > 100);

    print("逻辑与: " + string(bool(and2)));
    print("逻辑或: " + string(bool(or2)));
    print("逻辑非: " + string(bool(not2)));

    // ========================================
    // 自增自减: ++ --
    // ========================================
    number x = 5;
    number preInc = ++x;
    number postInc = x++;
    number preDec = --x;
    number postDec = x--;

    print("前缀++: " + string(preInc));
    print("后缀++: " + string(postInc));
    print("前缀--: " + string(preDec));
    print("后缀--: " + string(postDec));

    // ========================================
    // 复合赋值: += -= *= /= %=
    // ========================================
    number y = 10;
    y += 5;
    print("+= : " + string(y));
    y -= 3;
    print("-= : " + string(y));
    y *= 2;
    print("*= : " + string(y));
    y /= 4;
    print("/= : " + string(y));
    y %= 5;
    print("%= : " + string(y));

    // ========================================
    // 三元表达式
    // ========================================
    number max = a > b ? a : b;
    print("max = " + string(max));
}

main();
