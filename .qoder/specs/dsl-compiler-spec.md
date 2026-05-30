# Collie DSL 编译器 — 架构设计 Spec v2

## 概述

设计 Collie（牧羊犬）编程语言编译器，将 `.cl` 源码编译为 TypeScript `.ts` 代码。纯 TypeScript 实现，零外部解析器依赖。

```
Collie 源码(.cl) → [Lexer] → Token流 → [Parser] → Collie AST → [Transformer] → TS AST → [CodeGen] → TypeScript 代码(.ts)
```

### 三阶段演进策略

| 阶段 | 范围 | 目标 |
|------|------|------|
| **Phase 1 (MVP)** | 变量声明、`fn` 函数(含多返回值)、基础表达式、`if`/`while`/`do-while`/`for` C-style + for-each、`return`/`break`/`continue` | 验证完整管线可用 |
| **Phase 2** | 位类型(`bit`/`byte`/`word`/`dword`)、`tribool`+`unset`、`enum`、`for-number`/`for-range`/`for!`/`for-map`、`switch`、`==?`、`continue(n)`、`label`、字符串插值、`list[T]`/`set[T]`/`map[K:V]`/`tuple`/`union` | 丰富类型和控制流 |
| **Phase 3** | `class`/`object` 系统、异常处理、`import`/`export` 模块、`assert` | 完整语言 |

---

## 1. Collie 语言设计 (基于官方文档)

### 1.1 类型系统

#### 基本类型

| Collie 类型 | 描述 | 编译为 TS |
|------------|------|-----------|
| `object` | 基类型，所有类型继承自它 | `object` |
| `none` | 空类型，`null` 是特殊对象 | `null` |
| `number` | 通用数字，可存整数或小数，可变精度 | `number` |
| `integer` | 高精度整数，自动扩容，精确表示任意大小 | `bigint` |
| `decimal` | 高精度浮点数，自动扩容，精确表示任意位小数 | `Decimal` (runtime) |
| `string` | 字符串，等价于 `character[]` | `string` |
| `char` | 2字节单字符 (不推荐直接使用) | `string` |
| `character` | 单字，1个 `char` 或 1个代理对 (UTF-16) | `string` |
| `bool` | 布尔类型，`true`/`false` | `boolean` |
| `tribool` | 三态布尔，`true`/`false`/`unset` [P2] | `boolean \| undefined` |
| `bit` | 1 bit [P2] | `number` |
| `byte` | 1 byte (8 bit) [P2] | `number` |
| `word` | 2 byte (16 bit), 大端序 [P2] | `number` |
| `dword` | 4 byte (32 bit), 大端序 [P2] | `number` |
| `float` | 32位浮动小数 | `number` |
| `double` | 64位浮动小数 | `number` |
| `+float`/`-float` | 有符号32位浮动小数 | `number` |
| `+double`/`-double` | 有符号64位浮动小数 | `number` |

#### 引用类型

| Collie 类型 | 描述 | 编译为 TS |
|------------|------|-----------|
| `list[T]` | 元素可重复的有序集合 [P2] | `Array<T>` |
| `set[T]` | 元素不可重复的无序集合 [P2] | `Set<T>` |
| `map[K: V]` | 字典类型 [P2] | `Map<K, V>` |
| `Tuple` | 命名元组：`(name: "Alice", age: 18)` [P2] | Object literal |
| `A \| B` | 联合类型 [P2] | `A \| B` |
| `buffer` | 字节数组，等价于 `byte[]` [P2] | `Uint8Array` |

注意：`string = character[]`，`buffer = byte[]`。这意味着一维字符数组天然支持所有字符串操作，一维字节数组天然支持所有 buffer 操作。

#### 枚举类型 [P2]

```
enum Season { Spring, Summer, Autumn, Winter }
enum Season(string name) : string {
    Spring(name='春') = 'spring',
    Summer(name='夏') = 'summer',
}
```

### 1.2 变量声明

```collie
// 显式指定类型
number num = 1;
string name = "Collie";

// 类型推断 (var 关键字)
var anotherNum = 1;          // 自动推断为 number
var list = [1, 2, 3];        // 自动推断为 list[number]

// 未初始化 (Phase 2)
number x;
```

- `var` 是类型推断关键字（非 JS 的 `var`），编译为 `let`
- 分号必需

### 1.3 函数声明

```collie
// 基本函数
fn add(a: number, b: number): number {
    return a + b;
}

// 多返回值 (编译时隐式转换为元组)
fn getAge(): integer, string {
    return 18, "Alice";
}

// 无返回值
fn log(msg: string) {
    print(msg);
}

// Lambda [P2]
var double = (x: number): number => x * 2;
```

关键特性：
- 关键字 `fn`
- 参数必须有类型注解：`name: Type`
- 多返回值：`return value1, value2;`
- 多返回值类型声明：`: Type1, Type2`
- 分号必需

### 1.4 控制流

#### 条件语句

```collie
if (x > 0) {
    print("positive");
} else {
    print("zero or negative");
}

// switch [P2] (不需要 break)
switch (x) {
    case 1: print("one");
    case 2: print("two");
    default: print("other");
}
```

- 条件必须用括号包裹
- 否则编译为 TS 嵌套三元

#### 三元与多路条件

```collie
// 标准三元
var result = a ? 1 : 2;

// tribool 三元 [P2]
var result = a ? 1 : 2 : 3;
// a=true→1, a=false→2, a=unset→3

// 多路条件 [P2] (统一使用 ==?)
a ==? value1: expr1, value2: expr2, defaultExpr;
a ==? value1, value2: expr1, defaultExpr;  // value1或value2匹配时返回expr1
```

#### 循环

```collie
// C-style for [P1]
for (var i = 0; i < 10; i = i + 1) {
    print(i);
}

// for-each [P1]
for (item : array) { }    // 或 for (item in array)
for (item, index : array) { }  // 带索引

// for-map [P2]
for (key, value : map) { }
for (entry : map) { var key = entry.key; var value = entry.value; }

// for-number [P2]
for (5) { }               // 循环5次
for (i : 5) { }           // i 从 0 到 4

// for-range [P2]
for (i : 1, 5) { }        // i 从 1 到 4

// for-infinite [P2]
for! { }                   // 或 for (true) { }

// while / do-while [P1]
while (x < 10) { x = x + 1; }
do { x = x + 1; } while (x < 10);

// break / continue [P1]
break;
continue;

// label 跳转 [P2]
outer: for (i : 10) {
    for (j : 10) {
        if (i + j > 12) { continue outer; }
    }
}

// 跳过多次 [P2]
continue(5);
```

### 1.5 表达式

```
// 算术: + - * / % (Python 风格取模: -1 % 5 = 4)
// 比较: == != < > <= >=
// 逻辑: && || !
// 位运算 [P2]: & | ^ ~ << >>
// 赋值: = += -= *= /= %=
// 成员访问: obj.field, obj.method(), arr[index]
// Lambda [P2]: (x: number): number => x * 2
```

### 1.6 字面量

```collie
// 数字
42, 3.14, 0xFF, 0b1010, 0o777, 1_000_000, 2f       // float 后缀
Infinity, -Infinity, NaN

// 字符/字符串
'a', '中'                       // char 字面量
"hello", "Hello world!"        // string 字面量
"""                             // 多行字符串 (起止符号对齐)
    Hello,
    Collie!
"""
@"Hello, {name}!"              // 字符串插值 [P2]

// 布尔
true, false

// 空
null

// 三态 [P2]
unset

// 集合 [P2]
[1, 2, 3]                      // list 字面量
list(1, 2, 3)                  // 同上
set(1, 2, 3)                   // set 字面量
map({ apple: 5, banana: 6 })   // map 字面量
```

### 1.7 注释

```collie
// 单行注释
/*
 * 块注释 (支持嵌套: /* 内部 */ 外部继续)
 */
/** 文档注释 */
/...
段落注释 (支持到文件末尾或 .../ 结束)
.../
```

### 1.8 关键字清单

```
fn, var, if, else, for, while, do, return, break, continue,
switch, case, default, true, false, null, unset,
Tuple, enum, assert, new, class, extends, this, super,
import, export, public, private, protected, static,
object, none, number, integer, decimal,
string, char, character, bool, tribool,
bit, byte, word, dword, float, double,
list, set, map, buffer,
Infinity, NaN
```

---

## 2. Lexer（词法分析器）

### 2.1 Token 接口（丰富元数据）

```typescript
interface SourceLocation {
    offset: number    // 0-based 字节偏移
    line: number      // 1-based 行号
    column: number    // 1-based 列号 (UTF-16 code units)
}

interface SourceSpan {
    start: SourceLocation
    end: SourceLocation
}

interface CommentToken {
    text: string           // 注释内容 (不含定界符)
    isBlock: boolean       // true: /* */, false: //
    isDoc: boolean         // true: /** */
    isParagraph: boolean   // true: 段落注释
    span: SourceSpan
}

interface Token {
    type: TokenType
    lexeme: string              // 原始文本
    value?: string | number | boolean | null  // 解析后的值 (用于字面量)
    span: SourceSpan
    leadingTrivia: CommentToken[]     // 前置注释和空白
    trailingTrivia: CommentToken[]    // 后置注释
    flags: TokenFlags                 // 位标记
    errorMessage?: string             // 仅 Error token
}
```

### 2.2 TokenType 枚举 (完整)

**关键字**: `Fn`, `Var`, `If`, `Else`, `For`, `While`, `Do`, `Return`, `Break`, `Continue`, `Switch`, `Case`, `Default`, `True`, `False`, `Null`, `Unset`, `Tuple`, `Enum`, `Assert`, `New`, `Class`, `Extends`, `This`, `Super`, `Import`, `Export`, `Public`, `Private`, `Protected`, `Static`, `ObjectType`, `None`, `NumberType`, `IntegerType`, `DecimalType`, `StringType`, `CharType`, `CharacterType`, `BoolType`, `TriboolType`, `BitType`, `ByteType`, `WordType`, `DwordType`, `FloatType`, `DoubleType`, `ListType`, `SetType`, `MapType`, `BufferType`, `InfinityKw`, `NaNKw`

**字面量**: `NumberLiteral`, `StringLiteral`, `MultiLineStringLiteral`, `InterpolatedString`, `CharLiteral`

**标识符**: `Identifier`

**运算符**: `Plus`, `Minus`, `Star`, `Slash`, `Percent`, `PlusPlus`, `MinusMinus`, `Equals`, `PlusEquals`, `MinusEquals`, `StarEquals`, `SlashEquals`, `PercentEquals`, `EqualsEquals`, `NotEquals`, `StrictEquals`, `StrictNotEquals`, `LessThan`, `GreaterThan`, `LessThanEquals`, `GreaterThanEquals`, `AndAnd`, `OrOr`, `Bang`, `Ampersand`, `Pipe`, `Caret`, `Tilde`, `LessThanLessThan`, `GreaterThanGreaterThan`, `MultiWayEq` (`==?`), `Arrow` (`=>`), `Spread` (`...`)

**分隔符**: `LeftParen`, `RightParen`, `LeftBracket`, `RightBracket`, `LeftBrace`, `RightBrace`, `Comma`, `Semicolon`, `Dot`, `Colon`, `QuestionMark`, `At`

**特殊**: `Whitespace`, `Newline`, `Comment`, `Error`, `EOF`

### 2.3 Lexer 算法

逐字符扫描，1 字符 lookahead。核心循环 `nextToken()`:

1. 跳过空白字符 (空格、Tab、`\r`)
2. 遇到 `\n` → 产生 `Newline` token（行号递增）
3. 按首字符分发:
   - `/` → 检查注释: `//`, `/*`, `/**`, `/...`, `.../` → 读注释
   - `"` → `readString('"')`
   - `'` → `readCharLiteral()`
   - `@"` → `readInterpolatedString()` [P2]
   - `0-9` → `readNumber()`
   - `a-zA-Z_` → `readIdentifierOrKeyword()`
   - 运算符起始符 → 贪婪匹配(`==?` > `==` > `=`；`=>` > `=`；`...` > `.`)
   - 分隔符 → 直接产生 token
   - 其他 → Error token

### 2.4 特殊 Lexer 规则

**嵌套块注释**: 跟踪嵌套深度，`/*` 深度+1，`*/` 深度-1，深度归零时退出。

**段落注释**: 优先级最高。`/...` 开始，`.../` 结束，或到 EOF。段落注释内部不解析任何语法。

**数字字面量**: 支持 `0x` (十六进制), `0b` (二进制), `0o` (八进制), `_` (分隔符), `f` (float 后缀), `Infinity`, `-Infinity` (作为单个字面量值)，`NaN`。

**错误处理**: Lexer 永不抛异常。所有错误产生 `TokenType.Error` 并跳过到下一个可识别边界。

### 2.5 注释附着逻辑

- 注释暂存到 `pendingComments[]` 缓冲区
- 当下一个非注释 token 产生时，排入该 token 的 `leadingTrivia`
- 同行尾随注释 → 前一个 token 的 `trailingTrivia`

---

## 3. Parser（语法分析器）

### 3.1 解析策略

- **语句级**: 递归下降，`peek → dispatch → parse<X>Statement()`
- **表达式级**: Pratt 算法（Top-Down Operator Precedence）
- **类型注解**: 独立子解析器

### 3.2 Phase 1 EBNF 语法

```ebnf
Program           ::= Statement* EOF

Statement         ::= VariableDeclaration
                    | FunctionDeclaration
                    | IfStatement
                    | WhileStatement
                    | DoWhileStatement
                    | ForStatement
                    | ReturnStatement
                    | BreakStatement
                    | ContinueStatement
                    | ExpressionStatement
                    | BlockStatement

VariableDeclaration ::= TypeAnnotation IDENTIFIER '=' Expression ';'
                      | 'var' IDENTIFIER '=' Expression ';'

TypeAnnotation     ::= IDENTIFIER     (* Phase 1: 仅标识符类型 *)

FunctionDeclaration ::= 'fn' IDENTIFIER '(' Parameters? ')' (':' ReturnType)? BlockStatement

Parameters         ::= Parameter (',' Parameter)*
Parameter          ::= IDENTIFIER ':' TypeAnnotation

ReturnType         ::= TypeAnnotation
                    | TypeAnnotation (',' TypeAnnotation)+   (* 多返回值 *)

BlockStatement     ::= '{' Statement* '}'

IfStatement        ::= 'if' '(' Expression ')' Statement ('else' Statement)?

WhileStatement     ::= 'while' '(' Expression ')' Statement

DoWhileStatement   ::= 'do' Statement 'while' '(' Expression ')' ';'

ForStatement       ::= ForCStyle | ForEach

ForCStyle          ::= 'for' '(' (Expression | VariableDeclaration)? ';'
                                 Expression? ';'
                                 Expression? ')'
                       Statement

ForEach            ::= 'for' '(' IDENTIFIER (',' IDENTIFIER)? (':' | 'in') Expression ')'
                       Statement

ReturnStatement    ::= 'return' ExpressionList? ';'
ExpressionList     ::= Expression (',' Expression)*

BreakStatement     ::= 'break' IDENTIFIER? ';'
ContinueStatement  ::= 'continue' IDENTIFIER? ';'

ExpressionStatement ::= Expression ';'

(* === 表达式 (Pratt Parser) === *)

Expression         ::= AssignmentExpression

AssignmentExpression ::= TernaryExpression
                      |  TernaryExpression '=' Expression
                      |  TernaryExpression ('+=' | '-=' | '*=' | '/=' | '%=') Expression

TernaryExpression  ::= LogicalOrExpression ('?' Expression ':' Expression)?

LogicalOrExpression  ::= LogicalAndExpression ('||' LogicalAndExpression)*
LogicalAndExpression ::= EqualityExpression ('&&' EqualityExpression)*
EqualityExpression   ::= ComparisonExpression (('==' | '!=') ComparisonExpression)*
ComparisonExpression ::= AdditiveExpression (('<' | '>' | '<=' | '>=') AdditiveExpression)*
AdditiveExpression   ::= MultiplicativeExpression (('+' | '-') MultiplicativeExpression)*
MultiplicativeExpression ::= UnaryExpression (('*' | '/' | '%') UnaryExpression)*
UnaryExpression      ::= ('!' | '-' | '++' | '--') UnaryExpression
                      |  PostfixExpression

PostfixExpression    ::= PrimaryExpression
                      |  PostfixExpression '++'
                      |  PostfixExpression '--'
                      |  PostfixExpression '(' Arguments? ')'
                      |  PostfixExpression '[' Expression ']'
                      |  PostfixExpression '.' IDENTIFIER

PrimaryExpression    ::= NumberLiteral | StringLiteral | CharLiteral
                      |  'true' | 'false' | 'null'
                      |  IDENTIFIER
                      |  '(' Expression ')'

Arguments           ::= Expression (',' Expression)*
```

### 3.3 运算符优先级 (Pratt Binding Powers)

| 优先级 | 运算符 | 结合性 |
|--------|--------|--------|
| 1 | `=` `+=` `-=` `*=` `/=` `%=` | Right |
| 2 | `? :` (三元) | Right |
| 3 | `\|\|` | Left |
| 4 | `&&` | Left |
| 5 | `==` `!=` | Left |
| 6 | `<` `>` `<=` `>=` | Left |
| 7 | `+` `-` | Left |
| 8 | `*` `/` `%` | Left |
| 9 | `!` `-` `++` `--` (前缀) | Right |
| 10 | `++` `--` (后缀) `.` `()` `[]` | Left |

### 3.4 Collie AST 节点类型 (Phase 1)

```typescript
interface AstNode {
    kind: SyntaxKind
    span: SourceSpan
}

// 顶层
interface Program extends AstNode { kind: 'Program'; statements: Statement[] }

// 声明
interface VariableDeclaration extends AstNode {
    kind: 'VariableDeclaration'
    varType: TypeAnnotation | null  // null = var 推断
    name: Identifier
    initializer: Expression
}
interface FunctionDeclaration extends AstNode {
    kind: 'FunctionDeclaration'
    name: Identifier
    parameters: Parameter[]
    returnTypes: TypeAnnotation[]  // 多个=多返回值, 空=void
    body: BlockStatement
}

// 语句
interface BlockStatement extends AstNode { kind: 'BlockStatement'; statements: Statement[] }
interface IfStatement extends AstNode {
    kind: 'IfStatement'; condition: Expression
    consequent: Statement; alternate: Statement | null
}
interface WhileStatement extends AstNode {
    kind: 'WhileStatement'; condition: Expression; body: Statement
}
interface DoWhileStatement extends AstNode {
    kind: 'DoWhileStatement'; body: Statement; condition: Expression
}
interface ForStatement extends AstNode {
    kind: 'ForStatement'
    forKind: 'c-style' | 'each'
    init: Statement | Expression | null
    condition: Expression | null
    update: Expression | null
    loopVariable: Identifier | null     // for-each
    indexVariable: Identifier | null    // for-each with index
    iterable: Expression | null         // for-each
    body: Statement
}
interface ReturnStatement extends AstNode {
    kind: 'ReturnStatement'; values: Expression[]
}
interface BreakStatement extends AstNode {
    kind: 'BreakStatement'; label: Identifier | null
}
interface ContinueStatement extends AstNode {
    kind: 'ContinueStatement'; label: Identifier | null
}
interface ExpressionStatement extends AstNode {
    kind: 'ExpressionStatement'; expression: Expression
}

// 表达式
interface Identifier extends AstNode { kind: 'Identifier'; name: string }
interface NumberLiteral extends AstNode {
    kind: 'NumberLiteral'; value: number; raw: string
    numKind: 'integer' | 'decimal' | 'float' | 'hex' | 'binary' | 'octal'
}
interface StringLiteral extends AstNode { kind: 'StringLiteral'; value: string }
interface CharLiteral extends AstNode { kind: 'CharLiteral'; value: string }
interface BooleanLiteral extends AstNode { kind: 'BooleanLiteral'; value: boolean }
interface NullLiteral extends AstNode { kind: 'NullLiteral' }
interface BinaryExpression extends AstNode {
    kind: 'BinaryExpression'; operator: BinaryOperator
    left: Expression; right: Expression
}
interface UnaryExpression extends AstNode {
    kind: 'UnaryExpression'; operator: UnaryOperator
    operand: Expression; isPrefix: boolean
}
interface AssignmentExpression extends AstNode {
    kind: 'AssignmentExpression'; operator: AssignmentOperator
    left: Expression; right: Expression
}
interface CallExpression extends AstNode {
    kind: 'CallExpression'; callee: Expression; arguments: Expression[]
}
interface MemberAccessExpression extends AstNode {
    kind: 'MemberAccessExpression'; object: Expression; member: Identifier
}
interface IndexExpression extends AstNode {
    kind: 'IndexExpression'; object: Expression; index: Expression
}
interface TernaryExpression extends AstNode {
    kind: 'TernaryExpression'
    condition: Expression; trueBranch: Expression; falseBranch: Expression
}
interface GroupExpression extends AstNode {
    kind: 'GroupExpression'; expression: Expression
}

// 类型
type TypeAnnotation = IdentifierType
interface IdentifierType extends AstNode { kind: 'IdentifierType'; name: string }
interface Parameter extends AstNode {
    kind: 'Parameter'; name: Identifier; paramType: TypeAnnotation
}

// 错误
interface ErrorNode extends AstNode { kind: 'ErrorNode'; message: string }
```

### 3.5 for 循环歧义消除

`for (` 后有多种可能，解析策略：
1. 取下一个 token
2. 如果是类型名或 `var` 且后续是 `IDENTIFIER =` → C-style for (含声明初始化)
3. 如果是表达式且后续是 `;` → C-style for
4. 如果是 `IDENTIFIER ,` → for-each with index
5. 如果是 `IDENTIFIER :` 或 `IDENTIFIER in` → for-each
6. 如果是 `;` (空 init) → C-style for

### 3.6 错误恢复

- **同步点**: `;`, `}`, 语句起始关键字 (`fn`, `var`, `if`, `else`, `while`, `for`, `do`, `return`, `break`, `continue`)
- **错误节点**: 返回 `ErrorNode` 而非 null，保证 AST 结构完整
- **跳过策略**: 遇到无法解析的 token 时跳到下一个同步点

---

## 4. Transformer（转换器）

### 4.1 核心映射

#### 类型映射

| Collie 类型 | TS 类型 |
|------------|---------|
| `number` | `number` |
| `integer` | `bigint` |
| `decimal` | `Decimal` (import from runtime) |
| `string` | `string` |
| `char` | `string` |
| `character` | `string` |
| `bool` | `boolean` |
| `object` | `object` |
| `none` | `null` |
| `float` / `double` | `number` |

#### 声明映射

| Collie | TypeScript |
|--------|-----------|
| `number num = 1;` | `let num: number = 1;` |
| `var num = 1;` | `let num = 1;` |
| `fn add(a: number, b: number): number { ... }` | `function add(a: number, b: number): number { ... }` |
| `fn getAge(): integer, string { return 18, "Alice"; }` | `function getAge(): [bigint, string] { return [18n, "Alice"]; }` |

#### 多返回值处理

- Collie `fn foo(): T1, T2` → TS 返回类型 `[T1, T2]`
- Collie `return expr1, expr2;` → TS `return [expr1, expr2];`
- Collie 调用多返回值函数: `var name, age = getAge();` (Phase 2 解构语法)

#### 控制流映射

| Collie | TypeScript |
|--------|-----------|
| `if (c) { } else { }` | 直接映射 |
| `while (c) { }` | 直接映射 |
| `do { } while (c);` | 直接映射 |
| `for (var i = 0; i < n; i = i + 1) { }` | 直接映射 (`var`→`let`) |
| `for (item : array) { }` | `for (const item of array) { }` |
| `for (item in array) { }` | `for (const item of array) { }` |
| `for (item, index : array) { }` | `let _i = 0; for (const item of array) { const index = _i++; ... }` |
| `return;` | `return;` |
| `break;` | `break;` |
| `continue;` | `continue;` |

#### 字面量映射

| Collie | TS |
|--------|----|
| `42` (integer 推断) | `42` |
| `3.14` (decimal 推断) | `3.14` |
| `2f` | `2` (去除 f 后缀) |
| `0xFF` | `0xFF` |
| `0b1010` | `0b1010` |
| `0o777` | `0o777` |
| `1_000_000` | `1000000` (移除下划线) |
| `Infinity` | `Infinity` |
| `-Infinity` | `-Infinity` |
| `NaN` | `NaN` |
| `"hello"` | `'hello'` (单引号 TS 惯例) |
| `'a'` | `'a'` |
| `true` / `false` | `true` / `false` |
| `null` | `null` |

#### 取模运算

Collie 采用 Python 风格取模：`-1 % 5 = 4`。TS 原生 `%` 是截断除法的余数。处理方式：

```typescript
// Collie: a % b
// TS: ((a % b) + b) % b
// 但当 b 为正且 a 为非负时，直接映射 a % b
```

简单方案：输出一个运行时 helper 函数 `mod(a, b)` 或内联表达式。

### 4.2 TS AST 类型 (简化版)

```typescript
type TsNode =
    | TsProgram | TsVariableDeclaration | TsFunctionDeclaration
    | TsParameter | TsBlock | TsIfStatement | TsWhileStatement
    | TsDoWhileStatement | TsForStatement | TsForOfStatement
    | TsReturnStatement | TsBreakStatement | TsContinueStatement
    | TsExpressionStatement | TsIdentifier | TsNumberLiteral
    | TsStringLiteral | TsBooleanLiteral | TsNullLiteral
    | TsBinaryExpression | TsUnaryExpression | TsAssignmentExpression
    | TsMemberAccessExpression | TsIndexExpression | TsCallExpression
    | TsTernaryExpression | TsArrayLiteral | TsObjectLiteral
    | TsArrowFunction | TsTypeAnnotation | TsUnionType
```

---

## 5. Code Generator（代码生成器）

### 5.1 IndentWriter

管理缩进状态和输出缓冲区的辅助类：

```
- indentLevel: number (初始 0)
- indentSize: number (默认 2 空格)
- output: string[]
- currentLine: string

方法:
- write(str): 追加到当前行
- writeLine(str?): 追加行并换行
- indent(): indentLevel++
- dedent(): indentLevel--
- beginBlock(): write('{'), indent, newLine
- endBlock(suffix?): dedent, write('}'), writeLine(suffix)
```

### 5.2 生成规则

- **分号**: 每个需要分号的语句后必然添加
- **括号**: if/while/for 条件自动加括号
- **字符串**: 编译为单引号 TS 字符串，转义特殊字符
- **空行**: 顶层声明间空行分隔
- **缩进**: 块内语句统一缩进

### 5.3 格式化选项

```typescript
interface CodeGenOptions {
    indentSize: number       // 默认 2
    useTabs: boolean         // 默认 false
    singleQuote: boolean     // 默认 true
}
```

---

## 6. 项目结构

```
collie-dsl/
├── package.json
├── tsconfig.json
├── jest.config.ts
│
├── src/
│   ├── index.ts                    # 公开 API: compile()
│   ├── compiler.ts                 # 管线编排
│   │
│   ├── lexer/
│   │   ├── index.ts                # Lexer 类入口
│   │   ├── token.ts                # TokenType 枚举, Token/Comment/SourceLocation 接口
│   │   ├── scanner.ts              # 字符级扫描器 (peek/advance/location)
│   │   └── keywords.ts             # Map<string, TokenType>
│   │
│   ├── parser/
│   │   ├── index.ts                # Parser 类入口
│   │   ├── ast.ts                  # Collie AST 节点定义
│   │   ├── grammar/
│   │   │   ├── expressions.ts      # Pratt 表达式解析
│   │   │   ├── statements.ts       # 语句解析
│   │   │   ├── declarations.ts     # fn, enum, class 声明解析
│   │   │   └── types.ts            # 类型注解解析
│   │   └── error-recovery.ts       # 错误恢复/同步点
│   │
│   ├── transformer/
│   │   ├── index.ts                # Transformer 主分发
│   │   ├── ts-ast.ts               # TS AST 节点定义
│   │   ├── types.ts                # Collie 类型 → TS 类型
│   │   ├── expressions.ts          # 表达式转换
│   │   ├── statements.ts           # 语句转换
│   │   └── declarations.ts         # 声明转换
│   │
│   ├── codegen/
│   │   ├── index.ts                # CodeGen 入口
│   │   ├── emitter.ts              # TS AST → 字符串
│   │   ├── indent-writer.ts        # 缩进写入器
│   │   └── formatting.ts           # 格式化规则
│   │
│   └── common/
│       ├── diagnostics.ts          # 诊断收集器
│       └── source-location.ts      # SourceLocation/SourceSpan
│
├── tests/
│   ├── lexer/
│   ├── parser/
│   ├── transformer/
│   ├── codegen/
│   └── integration/
│       └── fixtures/               # .cl → .ts 配对文件
│
└── examples/
    ├── hello.cl
    ├── variables.cl
    ├── functions.cl
    └── control-flow.cl
```

---

## 7. Phase 1 实现顺序 (20 步)

| 步骤 | 内容 | 产出 |
|------|------|------|
| 0 | 项目脚手架 (package.json, tsconfig, jest) | 可构建的空项目 |
| 1 | `common/source-location.ts`, `common/diagnostics.ts` | 基础设施 |
| 2 | `lexer/token.ts` — TokenType 枚举, Token 接口 | 完整 Token 词汇表 |
| 3 | `lexer/scanner.ts` — 字符扫描器 | 字符级光标 |
| 4 | `lexer/keywords.ts` + `lexer/index.ts` — Lexer 主循环 | 完整词法分析器 |
| 5 | **Lexer 测试** | 词法分析验证 |
| 6 | `parser/ast.ts` — Collie AST 节点定义 | 完整 AST 类型 |
| 7 | `parser/error-recovery.ts` — 错误恢复 | 同步点/ErrorNode |
| 8 | `parser/grammar/types.ts` — 类型注解解析 | TypeAnnotation 解析 |
| 9 | `parser/grammar/expressions.ts` — Pratt 表达式解析 | 完整表达式解析 |
| 10 | `parser/grammar/statements.ts` — 语句解析 (if/while/for/return 等) | 所有语句解析 |
| 11 | `parser/grammar/declarations.ts` — fn 函数、变量声明解析 | 函数/变量解析 |
| 12 | `parser/index.ts` — Parser 主入口 `parseProgram()` | 完整语法分析器 |
| 13 | **Parser 测试** | 语法分析验证 |
| 14 | `transformer/ts-ast.ts` — TS AST 节点定义 | TS AST 类型 |
| 15 | `transformer/types.ts` — 类型映射 | Collie→TS 类型转换 |
| 16 | `transformer/expressions.ts` — 表达式转换 | 表达式转换 |
| 17 | `transformer/statements.ts` — 语句转换 | 语句转换 |
| 18 | `transformer/declarations.ts` + `transformer/index.ts` | 声明转换+编排 |
| 19 | `codegen/` — IndentWriter + Emitter + CodeGen | 代码生成 |
| 20 | `compiler.ts` + `index.ts` + **集成测试** | 完整管线 |

---

## 8. Phase 1 示例: 输入 → 输出

**输入 (hello.cl):**
```collie
fn add(a: number, b: number): number {
    return a + b;
}

fn getPerson(): string, integer {
    return "Alice", 18;
}

number x = 1;
var y = x + 2;

if (x > 0) {
    x = x + 1;
} else {
    x = 0;
}

while (x < 10) {
    x = x + 1;
}

for (var i = 0; i < 5; i = i + 1) {
    y = y + i;
}

for (item : items) {
    print(item);
}
```

**输出 (hello.ts):**
```typescript
function add(a: number, b: number): number {
    return a + b;
}

function getPerson(): [string, bigint] {
    return ['Alice', 18n];
}

let x: number = 1;
let y = x + 2;

if (x > 0) {
    x = x + 1;
} else {
    x = 0;
}

while (x < 10) {
    x = x + 1;
}

for (let i = 0; i < 5; i = i + 1) {
    y = y + i;
}

for (const item of items) {
    print(item);
}
```

---

## 9. 设计原则

1. **零外部解析器依赖**: 递归下降 + Pratt，纯 TS 手写，可调试
2. **丰富 Token 元数据**: 每个 token 带完整位置、注释、原始文本
3. **错误恢复不退出**: 产生 ErrorNode/ErrorToken，单次报告所有错误
4. **Collie AST 与 TS AST 分离**: 职责清晰，各自独立测试
5. **Phase 1 完整词汇表**: Lexer 一次性构建所有 token 类型，后续阶段只加 Parser 支持

---

## 10. 验证方式

1. **单元测试**: 每个 stage 独立测试 (vitest/jest)
2. **快照测试**: `.cl` 输入 → 完整管线 → 与 `.ts.expected` 比对
3. **二次编译验证**: 输出的 TS 代码能被 `tsc` 成功编译
4. **手动 CLI**: `npx ts-node src/index.ts examples/hello.cl`
