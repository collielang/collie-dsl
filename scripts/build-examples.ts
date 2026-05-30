#!/usr/bin/env npx ts-node

/**
 * 批量编译脚本 — 将 examples/ 目录下所有 .cl 文件编译为 .ts 文件
 *
 * 用法: npx ts-node scripts/build-examples.ts [--ast]
 *       --ast  只打印生成的 TypeScript 代码，不写入文件
 */
import * as fs from 'fs';
import * as path from 'path';

const EXAMPLES_DIR = path.resolve(__dirname, '../examples');

// 动态加载编译器
const { compile } = require('../src/compiler');

const args = process.argv.slice(2);
const astOnly = args.includes('--ast');

function main() {
    const clFiles = fs.readdirSync(EXAMPLES_DIR)
        .filter(f => f.endsWith('.cl'))
        .sort();

    if (clFiles.length === 0) {
        console.log('No .cl files found in examples/');
        process.exit(0);
    }

    console.log(`Found ${clFiles.length} Collie source file(s) in examples/\n`);

    let passed = 0;
    let failed = 0;

    for (const file of clFiles) {
        const inputPath = path.join(EXAMPLES_DIR, file);
        const outputPath = inputPath.replace(/\.cl$/, '.ts');

        const source = fs.readFileSync(inputPath, 'utf-8');
        const result = compile(source);

        if (astOnly) {
            console.log(`${'='.repeat(60)}`);
            console.log(`  ${file}`);
            console.log(`${'='.repeat(60)}`);
            console.log(result.code);
            console.log('');

            if (!result.success) {
                failed++;
                console.error(`  ERRORS:\n`);
                for (const err of result.diagnostics.getErrors()) {
                    const loc = err.span?.start || { line: 1, column: 1 };
                    console.error(`    Line ${loc.line}:${loc.column}  ${err.message}`);
                }
                console.error('');
            } else {
                passed++;
            }
        } else {
            if (result.success) {
                fs.writeFileSync(outputPath, result.code, 'utf-8');
                const lines = result.code.split('\n').length;
                console.log(`  OK  ${file}  →  ${path.basename(outputPath)}  (${lines} lines)`);
                passed++;
                // 如果使用了 decimal，复制运行时
                if (result.code.includes("import { Decimal } from './decimal.ts'")) {
                    const runtimeDest = path.join(EXAMPLES_DIR, 'decimal.ts');
                    if (!fs.existsSync(runtimeDest)) {
                        fs.copyFileSync(
                            path.resolve(__dirname, '../src/runtime/decimal.ts'),
                            runtimeDest,
                        );
                        console.log(`       runtime copied → examples/decimal.ts`);
                    }
                }
            } else {
                console.error(`  ERR ${file}  —  ${result.diagnostics.getErrors().length} error(s)`);
                for (const err of result.diagnostics.getErrors()) {
                    const loc = err.span?.start || { line: 1, column: 1 };
                    console.error(`        Line ${loc.line}:${loc.column}  ${err.message}`);
                }
                failed++;
            }
        }
    }

    console.log(`\n${'='.repeat(40)}`);
    console.log(`Results: ${passed} passed, ${failed} failed, ${clFiles.length} total`);
    console.log(`${'='.repeat(40)}`);

    process.exit(failed > 0 ? 1 : 0);
}

main();
