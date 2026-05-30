前往此目录查看：
E:\Project\CollieLang 牧羊犬编程语言\collie\document\i18n\zh-Hans\docusaurus-plugin-content-docs\current\

我写了一个我希望实现的基本数据类型文档：
类型请查阅相关文档：
/reference/data-type/primitive-data-type/base
/reference/data-type/primitive-data-type/none
/reference/data-type/primitive-data-type/character
/reference/data-type/primitive-data-type/numeric
/reference/data-type/primitive-data-type/logical
/reference/data-type/primitive-data-type/bitwise
/reference/data-type/primitive-data-type/enum

但是引用数据类型我还没有完全想好：
引用数据类型
/reference/data-type/reference-data-type/container/collection
/reference/data-type/reference-data-type/container/dictionary
/reference/data-type/reference-data-type/tuple
/reference/data-type/reference-data-type/union
/reference/data-type/reference-data-type/buffer

语法可以参考：
/reference/grammer/basic-grammer
其中可能有一些前后矛盾的，如果是这样，请你向我明确询问，我来给你明确的答案

主要想做的比较有特色的几点：
数字使用 number / integer / decimal 类型，像 Python 那样可以自动扩容，无需担心精度问题
函数调用可以返回多个值，而不需要把它一定要包在一个数组或者对象中（也可以理解为tuple的语法糖）

然后流程控制可以参考这个
/docs/reference/grammer/control-flow

异常处理相关的，我还没有太多的想法，或许你可以给我一些建议
/docs/reference/grammer/function
