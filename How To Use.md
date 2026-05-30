## 如何使用

### 方式一：命令行 (CLI)

```bash
# 编译 .cl 文件，输出同名 .ts
npx ts-node src/cli.ts 你的文件.cl

# 指定输出文件
npx ts-node src/cli.ts 你的文件.cl output.ts

# 只查看生成的代码(不写文件)
npx ts-node src/cli.ts 你的文件.cl --ast
```

你也可以试试项目自带的例子：

```bash
npx ts-node src/cli.ts examples/factorial.cl --ast
```

输出结果：

```typescript
function factorial(n: number): number {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}
function main() {
    let result: number = factorial(5);
    print(result);
}
```

### 方式二：API 调用

```typescript
import { compile } from 'collie-dsl';

const { code, success, diagnostics } = compile(`
    fn hello(name: string): string {
        return "Hello, " + name;
    }
`);

if (success) {
    console.log(code);
} else {
    console.error(diagnostics.getErrors());
}
```

### 方式三：分阶段使用

```typescript
import { Lexer, Parser, Transformer } from 'collie-dsl';

// 阶段 1: 词法分析
const tokens = new Lexer(source).tokenize();

// 阶段 2: 语法分析
const { program } = Parser.fromSource(source);

// 阶段 3: 代码生成
const code = new Transformer().transform(program);
```
