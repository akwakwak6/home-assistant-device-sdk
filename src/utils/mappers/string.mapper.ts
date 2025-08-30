export function toCamelCase(str: string) {
    return str.replace(/[_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^(.)/, (m) => m.toLowerCase());
}

export function toPascalCase(str: string) {
    return str.replace(/[_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^(.)/, (m) => m.toUpperCase());
}

export function toUpperCase(str: string) {
    return str.replace(/[\s-]+/g, "_").toUpperCase();
}
