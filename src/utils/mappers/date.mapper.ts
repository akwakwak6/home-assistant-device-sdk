export function parseISODateWithMicroseconds(input: string): Date {
    const cleaned = input.replace(/\.(\d{3})\d*(?=[+-])/, ".$1");
    return new Date(cleaned);
}
