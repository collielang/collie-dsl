#!/usr/bin/env node

/**
 * Collie DSL 命令行编译器
 *
 * 用法: npx ts-node src/cli.ts <输入文件.cl> [输出文件.ts]
 * 示例: npx ts-node src/cli.ts example.cl output.ts
 *
 * 编译后:
 *   node src/cli.js <输入文件.cl> [输出文件.ts]
 */
import * as fs from 'fs';
import * as path from 'path';

// 使用 require 兼容 ts-node 和编译后的 js
let compile: (source: string) => { code: string; success: boolean; diagnostics: { getErrors(): { message: string; span: { start: { line: number; column: number } } }[] } };

try {
    const mod = require('./compiler');
    compile = mod.compile;
} catch {
    try {
        const mod = require('../src/compiler');
        compile = mod.compile;
    } catch {
        console.error('Error: Cannot load compiler module.');
        console.error('Run with: npx ts-node src/cli.ts <input.cl> [output.ts]');
        process.exit(1);
    }
}

function main() {
    const args = process.argv.slice(2);

    if (args.length < 1 || args[0] === '--help' || args[0] === '-h') {
        console.log('Collie DSL Compiler v0.1.0');
        console.log('');
        console.log('Usage: collie <input.cl> [output.ts]');
        console.log('');
        console.log('Options:');
        console.log('  --help, -h    Show this help message');
        console.log('  --ast          Print AST instead of generating code');
        console.log('');
        console.log('Examples:');
        console.log('  collie example.cl            # outputs to example.ts');
        console.log('  collie example.cl output.ts  # outputs to output.ts');
        console.log('  collie example.cl --ast      # print AST to stdout');
        process.exit(0);
    }

    const inputFile = args[0];

    // 检查文件是否存在
    if (!fs.existsSync(inputFile)) {
        console.error(`Error: File not found: ${inputFile}`);
        process.exit(1);
    }

    // 检查扩展名
    if (!inputFile.endsWith('.cl')) {
        console.warn(`Warning: Input file does not have .cl extension: ${inputFile}`);
    }

    // 读取源文件
    const source = fs.readFileSync(inputFile, 'utf-8');
    console.log(`Compiling ${inputFile}...`);

    // 编译
    const result = compile(source);

    // 检查错误
    const errors = result.diagnostics.getErrors();
    if (errors.length > 0) {
        console.error(`\n${errors.length} error(s) found:\n`);
        for (const err of errors) {
            const loc = err.span ? err.span.start : { line: 1, column: 1 };
            console.error(`  Line ${loc.line}, Column ${loc.column}: ${err.message}`);
        }
    }

    if (!result.success) {
        console.error('\nCompilation failed.');
        process.exit(1);
    }

    // 处理 --ast 选项
    if (args.includes('--ast')) {
        console.log('\n--- AST Output (TypeScript) ---\n');
        console.log(result.code);
        return;
    }

    // 确定输出文件
    let outputFile: string;
    if (args.length >= 2 && !args[1].startsWith('--')) {
        outputFile = args[1];
    } else {
        outputFile = inputFile.replace(/\.cl$/, '.ts');
    }

    // 写入输出
    fs.writeFileSync(outputFile, result.code, 'utf-8');
    console.log(`\nCompilation successful!`);
    console.log(`Output written to: ${outputFile}`);
    console.log(`Generated ${result.code.split('\n').length} lines of TypeScript code.`);
}

main();
