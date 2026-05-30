import { Lexer } from '../../src/lexer/index';
import { TokenType } from '../../src/lexer/token';

function tokenTypes(tokens: ReturnType<Lexer['tokenize']>): string[] {
    return tokens.map(t => t.type);
}

function tokenLexemes(tokens: ReturnType<Lexer['tokenize']>): string[] {
    return tokens.map(t => t.lexeme);
}

function nonTriviaTokens(tokens: ReturnType<Lexer['tokenize']>): string[] {
    return tokens
        .filter(t => t.type !== TokenType.Newline && t.type !== TokenType.EOF)
        .map(t => t.type);
}

describe('Lexer', () => {
    describe('基础 token', () => {
        it('空输入只产生 EOF', () => {
            const lexer = new Lexer('');
            const types = tokenTypes(lexer.tokenize());
            expect(types).toEqual([TokenType.EOF]);
        });

        it('空白输入', () => {
            const lexer = new Lexer('   \t  ');
            const types = tokenTypes(lexer.tokenize());
            expect(types).toEqual([TokenType.EOF]);
        });
    });

    describe('分隔符', () => {
        it('基础分隔符', () => {
            const lexer = new Lexer('(){}[],.;:?@');
            const types = nonTriviaTokens(lexer.tokenize());
            expect(types).toEqual([
                TokenType.LeftParen, TokenType.RightParen,
                TokenType.LeftBrace, TokenType.RightBrace,
                TokenType.LeftBracket, TokenType.RightBracket,
                TokenType.Comma, TokenType.Dot, TokenType.Semicolon,
                TokenType.Colon, TokenType.QuestionMark, TokenType.At,
            ]);
        });
    });

    describe('运算符', () => {
        it('算术运算符', () => {
            const lexer = new Lexer('+ - * / %');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.Plus, TokenType.Minus, TokenType.Star,
                TokenType.Slash, TokenType.Percent,
            ]);
        });

        it('复合赋值运算符', () => {
            const lexer = new Lexer('= += -= *= /= %=');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.Equals, TokenType.PlusEquals, TokenType.MinusEquals,
                TokenType.StarEquals, TokenType.SlashEquals, TokenType.PercentEquals,
            ]);
        });

        it('比较运算符', () => {
            const lexer = new Lexer('== != < > <= >=');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.EqualsEquals, TokenType.NotEquals,
                TokenType.LessThan, TokenType.GreaterThan,
                TokenType.LessThanEquals, TokenType.GreaterThanEquals,
            ]);
        });

        it('逻辑运算符', () => {
            const lexer = new Lexer('&& || !');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.AndAnd, TokenType.OrOr, TokenType.Bang,
            ]);
        });

        it('自增自减', () => {
            const lexer = new Lexer('++ --');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.PlusPlus, TokenType.MinusMinus,
            ]);
        });

        it('严格相等', () => {
            const lexer = new Lexer('=== !==');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.StrictEquals, TokenType.StrictNotEquals,
            ]);
        });

        it('位运算符', () => {
            const lexer = new Lexer('& | ^ ~ << >>');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.Ampersand, TokenType.Pipe, TokenType.Caret,
                TokenType.Tilde, TokenType.LessThanLessThan, TokenType.GreaterThanGreaterThan,
            ]);
        });

        it('多路条件和箭头', () => {
            const lexer = new Lexer('==? =>');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.MultiWayEq, TokenType.Arrow,
            ]);
        });

        it('展开运算符', () => {
            const lexer = new Lexer('...');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.Spread,
            ]);
        });
    });

    describe('关键字', () => {
        it('控制流关键字', () => {
            const lexer = new Lexer('fn var if else for while do return break continue');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.Fn, TokenType.Var,
                TokenType.If, TokenType.Else,
                TokenType.For, TokenType.While, TokenType.Do,
                TokenType.Return, TokenType.Break, TokenType.Continue,
            ]);
        });

        it('字面量关键字', () => {
            const lexer = new Lexer('true false null unset');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.True, TokenType.False, TokenType.Null, TokenType.Unset,
            ]);
        });

        it('类型关键字', () => {
            const lexer = new Lexer('number integer decimal string char character bool');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.NumberType, TokenType.IntegerType, TokenType.DecimalType,
                TokenType.StringType, TokenType.CharType, TokenType.CharacterType,
                TokenType.BoolType,
            ]);
        });

        it('位类型关键字', () => {
            const lexer = new Lexer('bit byte word dword');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.BitType, TokenType.ByteType, TokenType.WordType, TokenType.DwordType,
            ]);
        });
    });

    describe('标识符', () => {
        it('简单标识符', () => {
            const lexer = new Lexer('foo bar123 _private');
            const tokens = lexer.tokenize();
            const ids = tokens.filter(t => t.type === TokenType.Identifier);
            expect(ids.map(t => t.lexeme)).toEqual(['foo', 'bar123', '_private']);
        });
    });

    describe('数字字面量', () => {
        it('十进制整数', () => {
            const lexer = new Lexer('42 0 123');
            const tokens = lexer.tokenize().filter(t => t.type === TokenType.NumberLiteral);
            expect(tokens.map(t => t.value)).toEqual(['42', '0', '123']);
        });

        it('十进制小数', () => {
            const lexer = new Lexer('3.14 .5 2.0');
            const tokens = lexer.tokenize().filter(t => t.type === TokenType.NumberLiteral);
            expect(tokens.map(t => t.value)).toEqual(['3.14', '.5', '2.0']);
        });

        it('下划线分隔', () => {
            const lexer = new Lexer('1_000_000');
            const tokens = lexer.tokenize().filter(t => t.type === TokenType.NumberLiteral);
            expect(tokens[0].value).toBe('1000000');
        });

        it('十六进制', () => {
            const lexer = new Lexer('0xFF 0x1A');
            const tokens = lexer.tokenize().filter(t => t.type === TokenType.NumberLiteral);
            expect(tokens.map(t => t.value)).toEqual(['0xFF', '0x1A']);
        });

        it('二进制', () => {
            const lexer = new Lexer('0b1010 0b0');
            const tokens = lexer.tokenize().filter(t => t.type === TokenType.NumberLiteral);
            expect(tokens.map(t => t.value)).toEqual(['0b1010', '0b0']);
        });

        it('八进制', () => {
            const lexer = new Lexer('0o777 0o10');
            const tokens = lexer.tokenize().filter(t => t.type === TokenType.NumberLiteral);
            expect(tokens.map(t => t.value)).toEqual(['0o777', '0o10']);
        });

        it('float 后缀', () => {
            const lexer = new Lexer('2f 3.14f');
            const tokens = lexer.tokenize().filter(t => t.type === TokenType.NumberLiteral);
            expect(tokens.map(t => t.value)).toEqual(['2', '3.14']);
        });

        it('Infinity 和 NaN', () => {
            const lexer = new Lexer('Infinity NaN');
            expect(nonTriviaTokens(lexer.tokenize())).toEqual([
                TokenType.InfinityKw, TokenType.NaNKw,
            ]);
        });
    });

    describe('字符串字面量', () => {
        it('双引号字符串', () => {
            const lexer = new Lexer('"hello world"');
            const tokens = lexer.tokenize().filter(t => t.type === TokenType.StringLiteral);
            expect(tokens[0].value).toBe('hello world');
        });

        it('转义字符', () => {
            const lexer = new Lexer('"hello\\nworld\\ttest"');
            const tokens = lexer.tokenize().filter(t => t.type === TokenType.StringLiteral);
            expect(tokens[0].value).toBe('hello\nworld\ttest');
        });

        it('多行字符串', () => {
            const lexer = new Lexer('"""hello\nworld"""');
            const tokens = lexer.tokenize().filter(t => t.type === TokenType.MultiLineStringLiteral);
            expect(tokens[0].value).toBe('hello\nworld');
        });

        it('未闭合字符串产生 Error', () => {
            const lexer = new Lexer('"unterminated');
            const tokens = lexer.tokenize();
            expect(tokens.some(t => t.type === TokenType.Error)).toBe(true);
        });
    });

    describe('字符字面量', () => {
        it('单字符', () => {
            const lexer = new Lexer("'a' '9'");
            const tokens = lexer.tokenize().filter(t => t.type === TokenType.CharLiteral);
            expect(tokens.map(t => t.value)).toEqual(['a', '9']);
        });

        it('转义字符', () => {
            const lexer = new Lexer("'\\n' '\\t'");
            const tokens = lexer.tokenize().filter(t => t.type === TokenType.CharLiteral);
            expect(tokens.map(t => t.value)).toEqual(['\n', '\t']);
        });
    });

    describe('注释', () => {
        it('单行注释', () => {
            const lexer = new Lexer('number x = 1; // this is a comment\nnumber y = 2;');
            const tokens = lexer.tokenize().filter(t =>
                t.type !== TokenType.Newline && t.type !== TokenType.EOF
            );
            const types = tokens.map(t => t.type);
            // 注释应该被跳过，不影响 token 序列
            expect(types).toEqual([
                TokenType.NumberType, TokenType.Identifier, TokenType.Equals,
                TokenType.NumberLiteral, TokenType.Semicolon,
                TokenType.NumberType, TokenType.Identifier, TokenType.Equals,
                TokenType.NumberLiteral, TokenType.Semicolon,
            ]);
        });

        it('块注释', () => {
            const lexer = new Lexer('number /* comment */ x');
            const types = nonTriviaTokens(lexer.tokenize());
            expect(types).toEqual([
                TokenType.NumberType, TokenType.Identifier,
            ]);
        });

        it('嵌套块注释', () => {
            const lexer = new Lexer('number /* outer /* inner */ still outer */ x');
            const types = nonTriviaTokens(lexer.tokenize());
            expect(types).toEqual([
                TokenType.NumberType, TokenType.Identifier,
            ]);
        });

        it('文档注释', () => {
            const lexer = new Lexer('/** doc comment */ number x');
            const types = nonTriviaTokens(lexer.tokenize());
            expect(types).toEqual([
                TokenType.NumberType, TokenType.Identifier,
            ]);
        });

        it('注释附着到 token', () => {
            const lexer = new Lexer('// leading comment\nnumber x');
            const tokens = lexer.tokenize();
            // 找到 number 关键字，检查其 leadingTrivia
            const numToken = tokens.find(t => t.type === TokenType.NumberType);
            expect(numToken).toBeDefined();
            expect(numToken!.leadingTrivia.length).toBeGreaterThan(0);
            expect(numToken!.leadingTrivia[0].text).toContain('leading comment');
        });
    });

    describe('token 位置信息', () => {
        it('基本位置', () => {
            const lexer = new Lexer('number x = 42;');
            const tokens = lexer.tokenize().filter(t => t.type !== TokenType.EOF);
            expect(tokens[0].span.start.line).toBe(1);
            expect(tokens[0].span.start.column).toBe(1);
            expect(tokens[0].type).toBe(TokenType.NumberType);
        });

        it('多行位置', () => {
            const lexer = new Lexer('number x = 1;\nnumber y = 2;');
            const tokens = lexer.tokenize();
            const secondNum = tokens.filter(t =>
                t.type === TokenType.NumberType && t.span.start.line > 1
            );
            expect(secondNum.length).toBe(1);
            expect(secondNum[0].span.start.line).toBe(2);
        });
    });

    describe('错误恢复', () => {
        it('无法识别的字符产生 Error', () => {
            const lexer = new Lexer('number x = $test;');
            const tokens = lexer.tokenize();
            const errorTokens = tokens.filter(t => t.type === TokenType.Error);
            expect(errorTokens.length).toBeGreaterThan(0);
            // 但仍然应产生后续的合法 token
            expect(tokens.some(t => t.type === TokenType.Identifier)).toBe(true);
        });
    });

    describe('完整程序', () => {
        it('简单函数定义', () => {
            const source = `fn add(a: number, b: number): number {
    return a + b;
}`;
            const lexer = new Lexer(source);
            const types = nonTriviaTokens(lexer.tokenize());
            expect(types).toEqual([
                TokenType.Fn, TokenType.Identifier,
                TokenType.LeftParen,
                TokenType.Identifier, TokenType.Colon, TokenType.NumberType,
                TokenType.Comma,
                TokenType.Identifier, TokenType.Colon, TokenType.NumberType,
                TokenType.RightParen,
                TokenType.Colon, TokenType.NumberType,
                TokenType.LeftBrace,
                TokenType.Return, TokenType.Identifier, TokenType.Plus,
                TokenType.Identifier, TokenType.Semicolon,
                TokenType.RightBrace,
            ]);
        });

        it('多返回值函数', () => {
            const source = 'fn getPair(): string, integer { return "hello", 42; }';
            const lexer = new Lexer(source);
            const types = nonTriviaTokens(lexer.tokenize());
            expect(types).toContain(TokenType.StringType);
            expect(types).toContain(TokenType.IntegerType);
            expect(types).toContain(TokenType.Comma);
        });
    });
});
