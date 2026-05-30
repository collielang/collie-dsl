# Collie DSL

**牧羊犬编程语言** — 一种编译到 TypeScript 的领域特定语言。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-81%20passed-brightgreen.svg)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Collie 是一门静态类型的编程语言，拥有丰富的基类型系统。编译器将 Collie 源码 (`.cl`) 编译为 TypeScript 代码 (.ts)，采用纯手写递归下降 + Pratt 解析器实现，不依赖任何解析器生成工具。

---

## 快速开始

### 安装

```bash
git clone <repo-url> collie-dsl
cd collie-dsl
npm install
npm run build
```

### 编译 .cl 文件

```bash
# 编译到同名的 .ts 文件
npx ts-node src/cli.ts example.cl

# 指定输出文件名
npx ts-node src/cli.ts example.cl output.ts

# 查看生成的 TypeScript 代码
npx ts-node src/cli.ts example.cl --ast
```

### API 调用

```typescript
import { compile } from 'collie-dsl';

const result = compile('number x = 42;');
console.log(result.code);       // "let x: number = 42;"
console.log(result.success);    // true
console.log(result.diagnostics.getErrors()); // []
```

---

## 语言特性 (Phase 1)

### 类型系统

| Collie 类型  | TypeScript   | 说明           |
|-------------|-------------|---------------|
| `number`    | `number`    | 双精度浮点数   |
| `integer`   | `bigint`    | 任意精度整数   |
| `decimal`   | `Decimal`   | 任意精度小数   |
| `string`    | `string`    | 字符串        |
| `char`      | `string`    | 单字符 (UTF-16) |
| `character` | `string`    | Unicode 字符   |
| `bool`      | `boolean`   | 布尔类型       |
| `object`    | `object`    | 基类型         |
| `none`      | `void`      | 空类型         |

### 变量声明

```collie
// 显式类型声明
number x = 42;
string name = "Collie";
bool flag = true;

// var 类型推断
var y = x + 10;
```

### 函数

```collie
// 基本函数
fn add(a: number, b: number): number {
    return a + b;
}

// 无返回值
fn log(msg: string) {
    print(msg);
}

// 多返回值
fn getPair(): string, integer {
    return "hello", 42;
}
// 编译为 → function getPair(): [string, bigint] { return ["hello", 42]; }
```

### 控制流

```collie
// if-else
if (x > 0) {
    x = x + 1;
} else {
    x = 0;
}

// while
while (x < 10) {
    x = x + 1;
}

// do-while
do {
    x = x + 1;
} while (x < 10);

// C-style for
for (var i = 0; i < 10; i = i + 1) {
    print(i);
}

// for-each
for (item : items) {
    print(item);
}
// 编译为 → for (const item of items) { ... }
```

### 表达式

```collie
// 算术运算: + - * / %
1 + 2 * 3

// 比较运算: == != < > <= >=
a == b && c > d

// 三元表达式
a ? 1 : 2

// 成员访问
obj.field

// 函数调用
add(1, 2)
```

---

## 编译器架构

```
Collie 源码 (.cl)
       ↓
  ┌─────────┐
  │  Lexer  │  词法分析 — 贪婪匹配操作符, 嵌套块注释, 多格式数字字面量
  └────┬────┘
       ↓  Token[]
  ┌─────────┐
  │ Parser  │  语法分析 — 递归下降 (语句) + Pratt (表达式), 错误恢复
  └────┬────┘
       ↓  Collie AST
  ┌─────────────┐
  │ Transformer │  语义变换 — Collie AST → TypeScript 代码
  └──────┬──────┘
       ↓  TS 代码字符串
  ┌──────────┐
  │ Codegen  │  代码生成 — 添加导入、运行时支持
  └────┬─────┘
       ↓
TypeScript 输出 (.ts)
```

### 项目结构

```
collie-dsl/
├── src/
│   ├── index.ts               # 统一导出入口
│   ├── cli.ts                 # 命令行工具
│   ├── compiler.ts            # 编译流程编排器
│   ├── common/                # 共享基础设施
│   │   ├── diagnostics.ts     # 诊断/错误收集
│   │   └── source-location.ts # 源码位置追踪
│   ├── lexer/                 # 词法分析
│   │   ├── token.ts           # 70+ TokenType 枚举
│   │   ├── scanner.ts         # 字符扫描器
│   │   ├── keywords.ts        # 关键字映射
│   │   └── index.ts           # Lexer 主循环
│   ├── parser/                # 语法分析
│   │   ├── ast.ts             # AST 节点类型定义
│   │   ├── error-recovery.ts  # 错误恢复机制
│   │   ├── index.ts           # Parser 主入口
│   │   └── grammar/           # 语法规则
│   │       ├── expressions.ts # Pratt 表达式解析
│   │       ├── statements.ts  # 递归下降语句解析
│   │       ├── declarations.ts# 声明解析
│   │       └── types.ts       # 类型注解解析
│   ├── transformer/           # 代码变换
│   │   ├── index.ts           # Transformer 主入口
│   │   ├── expressions.ts     # 表达式变换
│   │   ├── statements.ts      # 语句变换
│   │   ├── declarations.ts    # 声明变换
│   │   └── types.ts           # 类型映射
│   ├── codegen/               # 代码生成
│   │   └── index.ts
│   └── runtime/               # 运行时库
│       └── decimal.ts         # Decimal 类型支持
├── tests/
│   ├── lexer/lexer.test.ts    # 词法测试 (41 用例)
│   ├── parser/parser.test.ts  # 语法测试 (20 用例)
│   └── integration.test.ts   # 集成测试 (20 用例)
├── examples/
│   └── factorial.cl           # 阶乘示例
├── package.json
└── tsconfig.json
```

---

## 测试

```bash
# 运行全部测试
npm test

# 运行特定测试套件
npx jest tests/lexer/lexer.test.ts --no-coverage
npx jest tests/parser/parser.test.ts --no-coverage
npx jest tests/integration.test.ts --no-coverage
```

测试覆盖：**81 个用例全部通过**:
- Lexer: 41 用例 (Token 生成、关键字、字面量、注释、位置追踪、错误恢复)
- Parser: 20 用例 (变量声明、函数声明、控制流、表达式、错误恢复)
- 集成: 20 用例 (端到端编译、完整程序、错误处理)

---

## 技术细节

### Lexer 特性
- 70+ Token 类型，完整覆盖 Phase 1-3 词汇表
- 多格式数字字面量 (十进制/十六进制/二进制/八进制, 下划线分隔, f 后缀)
- 嵌套块注释 (跟踪嵌套深度)
- 段落注释 (`/... ...`)
- 注释附着 (Doc 注释附着到后续声明)
- 多行字符串 (自动检测换行)
- Unicode 字符字面量 (含转义序列)
- 操作符贪婪匹配 (3→2→1 字符优先级)
- 错误 token 恢复，不阻塞后续解析

### Parser 特性
- 递归下降解析语句和声明
- Pratt 解析器处理表达式 (12 级优先级)
- for 循环歧义消解 (C-style vs for-each 自动识别)
- 多返回值支持 (逗号分隔 return，tuple 返回类型)
- 同步点错误恢复 (分号、闭合括号、语句起始关键字)
- ErrorNode 融入 AST，优雅降级

### Transformer 特性
- Collie 类型向 TypeScript 类型的一一映射
- 多返回值自动打包为数组/元组
- for-each 转换为 `for-of` 语法
- Decimal 类型自动检测并导入运行时库

---

## 路线图

- [x] Phase 1: 基础类型、变量、函数、控制流
- [ ] Phase 2: 枚举、位运算、Tribool、Tuple
- [ ] Phase 3: 类、继承、接口、泛型
- [ ] LSP 语言服务器
- [ ] VS Code 插件
- [ ] Collie 标准库

---

## License

MIT
