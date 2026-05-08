export interface JsonObjectParseResult {
    value?: Record<string, any>
    error?: string
}

export interface JsonValueParseResult {
    value?: unknown
    error?: string
}

export function parseJsonObject(value: string, label = 'JSON', fallback: Record<string, any> = {}): JsonObjectParseResult {
    if (!value.trim()) {
        return { value: fallback };
    }

    try {
        const result = JSON.parse(value) as unknown;
        if (result && typeof result === 'object' && !Array.isArray(result)) {
            return { value: result as Record<string, any> };
        }

        return { error: `${label} 必须是 JSON 对象` };
    } catch (error) {
        return { error: `${label} 不是合法 JSON` };
    }
}

export function parseJsonValue(value: string, label = 'JSON'): JsonValueParseResult {
    if (!value.trim()) {
        return { value: undefined };
    }

    try {
        return { value: JSON.parse(value) as unknown };
    } catch (error) {
        return { error: `${label} 不是合法 JSON` };
    }
}

export function formatJson(value: unknown) {
    return JSON.stringify(value || {}, null, 2);
}
