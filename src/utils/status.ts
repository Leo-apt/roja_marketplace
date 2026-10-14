export function statusColor(s: string): string {
    if (/failed|disputed|mismatch|past due|negative/i.test(s)) return "bad";
    if (/held|pending|partial|awaiting|scheduled|unrecovered|submitted/i.test(s)) return "warn";
    if (/active|paid|cleared|ready|approved|complete|delivered|matched|recovered/i.test(s)) return "good";
    if (/trial|bundle/i.test(s)) return "purple";
    return "";
}