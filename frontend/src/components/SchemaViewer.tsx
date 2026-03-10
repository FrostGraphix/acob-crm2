import React from 'react';

export function SchemaViewer({ data }: { data: any }) {
    if (!data) return <div className="text-gray-500 italic p-2 rounded bg-neutral-900 border border-neutral-800">No schema data available.</div>;

    const formattedJson = JSON.stringify(data, null, 2);

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 overflow-x-auto">
            <pre className="text-emerald-400 text-sm font-mono whitespace-pre-wrap break-all">
                {formattedJson}
            </pre>
        </div>
    );
}
