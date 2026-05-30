import { SourceSpan } from './source-location';

// 诊断严重级别
export enum DiagnosticSeverity {
    Error = 'error',
    Warning = 'warning',
    Note = 'note',
}

// 单条诊断信息
export interface Diagnostic {
    severity: DiagnosticSeverity;
    message: string;
    span: SourceSpan;
}

// 诊断收集器：贯穿所有阶段的错误/警告收集
export class DiagnosticBag {
    private diagnostics: Diagnostic[] = [];

    addError(message: string, span: SourceSpan): void {
        this.diagnostics.push({ severity: DiagnosticSeverity.Error, message, span });
    }

    addWarning(message: string, span: SourceSpan): void {
        this.diagnostics.push({ severity: DiagnosticSeverity.Warning, message, span });
    }

    addNote(message: string, span: SourceSpan): void {
        this.diagnostics.push({ severity: DiagnosticSeverity.Note, message, span });
    }

    hasErrors(): boolean {
        return this.diagnostics.some(d => d.severity === DiagnosticSeverity.Error);
    }

    getAll(): Diagnostic[] {
        return [...this.diagnostics];
    }

    getErrors(): Diagnostic[] {
        return this.diagnostics.filter(d => d.severity === DiagnosticSeverity.Error);
    }

    getWarnings(): Diagnostic[] {
        return this.diagnostics.filter(d => d.severity === DiagnosticSeverity.Warning);
    }
}
