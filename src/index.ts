/**
 * Collie DSL Compiler — 主入口
 *
 * 用法:
 *   import { compile, Parser, Lexer } from 'collie-dsl';
 *
 *   const result = compile('number x = 42;');
 *   console.log(result.code); // "let x: number = 42;"
 */
export { Lexer } from './lexer/index';
export { TokenType, Token, TokenFlags } from './lexer/token';
export { Parser } from './parser/index';
export { Program, Statement, Expression } from './parser/ast';
export { Transformer, transformProgram } from './transformer/index';
export { CodeGenerator } from './codegen/index';
export { Compiler, compile, CompileResult } from './compiler';
export { DiagnosticBag, DiagnosticSeverity } from './common/diagnostics';
