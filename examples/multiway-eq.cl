// Collie Example: ==? 多路匹配运算符
// compile: npx ts-node src/cli.ts examples/multiway-eq.cl
// run: node examples/multiway-eq.ts

fn main() {
    // ========================================
    // 基本用法：score 匹配到对应等级
    // ========================================
    number score = 85;
    string grade = score ==? 90: "A", 80: "B", 70: "C", 60: "D", "F";
    print("score: " + string(score) + " -> grade: " + grade);

    // ========================================
    // OR 值匹配：多个值对应同一个结果
    // ========================================
    number day = 6;
    string type = day ==? 1, 2, 3, 4, 5: "工作日", 0, 6: "周末", "未知";
    print("day " + string(day) + " -> " + type);

    // ========================================
    // 默认值在前置表达式中 (tribool 场景)
    // 注意：默认值必须在 case 列表的最后
    // ========================================
    bool flag = false;
    number val = flag ==? true: 1, 2;
    print("flag=" + string(bool(flag)) + " -> val=" + string(val));

    // ========================================
    // 换行 + 行内注释
    // ========================================
    number num = 3;
    string result = num ==?
        1: "一",          // 数字 1
        2: "二",          // 数字 2
        3: "三",          // 数字 3
        "其它";            // 默认值

    print("num=" + string(num) + " -> " + result);

    // ========================================
    // 复杂表达式作为匹配值
    // ========================================
    number threshold = 50;
    number value = 75;
    string range = value ==? threshold: "刚好在阈值", "不在阈值";
    print("value=" + string(value) + " -> " + range);

    // ========================================
    // ==? 作为赋值右侧的一部分（类似 switch 表达式）
    // ========================================
    number magic = 42;
    string msg = "答案是 " + (magic ==? 42: "生命的意义", 7: "幸运数字", "不知道");
    print(msg);
}

main();
