import type { GenerationRecord } from '../types';

export function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function generateCSV(records: GenerationRecord[]): string {
    // UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const headers = ['時間', '學生姓名', '特質', '風格', '字數設定', '評語'];

    const csvRows = records.map(record => {
        const date = new Date(record.generatedAt).toLocaleString('zh-TW');
        const traits = record.traits.join('、');
        const style = record.style === 'formal' ? '正式鼓勵' : '溫暖親切';
        // Escape quotes by doubling them, and wrap fields in quotes
        const escape = (text: string) => `"${String(text).replace(/"/g, '""')}"`;

        return [
            escape(date),
            escape(record.studentName),
            escape(traits),
            escape(style),
            escape(record.wordCount.toString()),
            escape(record.comment)
        ].join(',');
    });

    return BOM + [headers.join(','), ...csvRows].join('\n');
}

export function generateTXT(records: GenerationRecord[]): string {
    return records.map(record => {
        const date = new Date(record.generatedAt).toLocaleString('zh-TW');
        return `
========================================
學生：${record.studentName}
時間：${date}
特質：${record.traits.join('、')}
風格：${record.style === 'formal' ? '正式鼓勵' : '溫暖親切'}
----------------------------------------
${record.comment}
========================================
`;
    }).join('\n');
}
