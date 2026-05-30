
## 类型

### 基类型（Base Type）

基类型是所有类型的基础，所有类型都会继承自它。

type: object

### 空类型（None Type）

空类型也是一个对象。

type: none

Collie 语言的空类型与其他语言有些差异， null 是一个特殊对象，也有其自身属性。

### 字符类型（Character Type）

char	2 byte	单个字符。主要用作框架的底层逻辑实现等，一般不建议直接使用 char 类型。
character	2 / 4 byte	单字，对字符串中的每一项来说。1 个 character 为 1 个 char 或 1 个 代理对（具体细节可参考 UTF-16 编码 ）
string	动态调整	字符串。等价于 character[], [character]
也就是说，character 组成的一维数组，天然支持所有 string 的操作方式，你可完全将其当作 string 对象使用。

Collie 使用的 Unicode 编码标准 为 UTF-16 编码。


### 数字类型（Numeric Type）

### 逻辑类型（Logical Type）

### 位类型（Bitwise Type）

### 枚举类型（Enum Type）


```collie

