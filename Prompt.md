这是一个新创建的空目录

我想写一个自定义的dsl，语法就像一门新的编程语言一样，然后最终编译成JS或者TS语言。语法设计好之后，如何去实现这个编译逻辑

我知道需要有词法分析，语法分析
我觉得ANTLR或者OHM-JS,我感觉好像有点复杂，能不能我们就简单的用TS来实现?
本质上也就是要把我的DSL提取出AST树，然后再将其转为 TS的AST树，最后再将TS的AST树反向生成ts代码即可

但是呢，我还是想让词法分析、语法分析尽可能的详细一些。我需要你做一些顶层设计，然后生成spec，然后接下来我们再逐个实现
词法分析的时候，可能需要尽可能的分析出来一些比较丰富的信息，供语法分析侧去使用

---

你的 DSL 大致长什么样？它是一门通用编程语言，还是面向特定领域（如配置、规则引擎、工作流）？
类似 TypeScript/Java，有变量、函数、类、控制流等完整语法
编译输出目标是什么？
输出标准 TypeScript 代码，可直接被 tsc 编译
目前想产出什么？是只做顶层架构设计还是立刻开始写代码？
先把编译器架构、词法/语法规则、各模块接口设计清楚

---

我写了一个我希望实现的基本数据类型文档：
类型请查阅相关文档：
https://collielang.github.io/collie/zh-Hans/docs/reference/data-type/primitive-data-type/base
https://collielang.github.io/collie/zh-Hans/docs/reference/data-type/primitive-data-type/none
https://collielang.github.io/collie/zh-Hans/docs/reference/data-type/primitive-data-type/character
https://collielang.github.io/collie/zh-Hans/docs/reference/data-type/primitive-data-type/numeric
https://collielang.github.io/collie/zh-Hans/docs/reference/data-type/primitive-data-type/logical
https://collielang.github.io/collie/zh-Hans/docs/reference/data-type/primitive-data-type/bitwise
https://collielang.github.io/collie/zh-Hans/docs/reference/data-type/primitive-data-type/enum

但是引用数据类型我还没有完全想好：
引用数据类型
https://collielang.github.io/collie/zh-Hans/docs/reference/data-type/reference-data-type/container/collection
https://collielang.github.io/collie/zh-Hans/docs/reference/data-type/reference-data-type/container/dictionary
https://collielang.github.io/collie/zh-Hans/docs/reference/data-type/reference-data-type/tuple
https://collielang.github.io/collie/zh-Hans/docs/reference/data-type/reference-data-type/union
https://collielang.github.io/collie/zh-Hans/docs/reference/data-type/reference-data-type/buffer

语法可以参考：
https://collielang.github.io/collie/zh-Hans/docs/reference/grammer/basic-grammer
其中可能有一些前后矛盾的，如果是这样，请你向我明确询问，我来给你明确的答案

主要想做的比较有特色的几点：
数字使用 number / integer / decimal 类型，像 Python 那样可以自动扩容，无需担心精度问题
函数调用可以返回多个值，而不需要把它一定要包在一个数组或者对象中（也可以理解为tuple的语法糖）

然后流程控制可以参考这个
https://collielang.github.io/collie/zh-Hans/docs/reference/grammer/control-flow

异常处理相关的，我还没有太多的想法，或许你可以给我一些建议
https://collielang.github.io/collie/zh-Hans/docs/reference/grammer/function

---

似乎网页无法访问，你可以直接将https://collielang.github.io/collie/zh-Hans/docs/替换为
E:\Project\CollieLang 牧羊犬编程语言\collie\document\i18n\zh-Hans\docusaurus-plugin-content-docs\current\ 直接在查看本地markdown文件

---

函数声明用 `function` 还是 `fn`？文档中流程控制部分用的是 `function`，基础语法部分也列了 `function` 为关键字，你希望最终使用哪个？
使用 `fn` 缩写，更简洁，如 Rust
数字类型文档用 `integer`（高精度整数），但函数文档里出现了 `int`（如 `int, string getAge()`），你希望用哪个作为整数类型名？
其他: number是数字类型，integer是任意精度的整数，decimal是任意精度的小数（不要像JS那样默认丢精度，内部支持自动根据存储的数字大小进行扩缩容实际使用的内存空间）
在字符类型文档中，`number('A')` 返回 65，但 `number('a')` 返回 113。按 ASCII 标准，`'a'` 应该是 97。这是文档笔误还是有意为之？
`number('a')` 应该返回 97（标准 ASCII）
文档只有 `object` 基类型，没有看到 `class` / `extends` / `new` 等类系统语法。类系统目前是否要纳入 DSL 编译器设计？
其他: 类系统也要纳入编译器设计，只是文档尚未完善（可能需要你帮我做一些设计，但我们可以先聚焦一块，逐块击破，不然目标太大了，不太容易实现）

---

文档中分号使用不一致，有的地方有分号有的没有。Collie 语言分号是必需的还是可选的？
每条语句必须以分号结尾
第一阶段编译器实现，你希望优先覆盖哪个范围？
<!-- 基础类型系统 + 变量声明 + fn 函数 + 多返回值 + 基本控制流(if/else/while/for) -->
<!-- 核心特性 + 位类型(bit/byte/word/dword) + 高级控制流(for-range/continue(n)/label) -->先只做最小可用集(变量+函数+if/while)，验证管线可行后再扩展
Collie 的多目条件运算符 `=?` 和 `?=` 语法比较独特，第一阶段是否需要支持？
其他: 这是 Collie 的特色语法，但和其他语法优先级相同（文档中写错了，实际 `=?` 和 `?=` 应该统一为 `==?` 这一种）
