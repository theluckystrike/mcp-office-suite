import { DISCLAIMER, clauseVariables, fillVariables, promptFor } from "./library.js";
function paragraphs(body) {
    return body.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
}
export function assemble(o) {
    // `client` is a convenience alias for the {{client}} variable; an explicit value wins.
    const values = { ...(o.client ? { client: o.client } : {}), ...o.values };
    const filled = [];
    const unfilled = [];
    const blocks = [
        { type: "heading", level: 1, text: o.title },
        { type: "para", text: DISCLAIMER },
    ];
    const md = [`# ${o.title}`, "", DISCLAIMER, ""];
    if (o.client) {
        blocks.push({ type: "para", text: `Client: ${o.client}` });
        md.push(`Client: ${o.client}`, "");
    }
    // D-R37: number every included clause first, so a cross-reference can be rendered as the
    // number the reader will actually see, and an unresolvable one can be dropped instead of
    // shipped. A round-8 contract cited "the Change Requests clause" and "the Dispute
    // Resolution clause", neither of which was in the document.
    const numberOf = new Map();
    o.clauses.forEach((c, i) => numberOf.set(c.id, { n: i + 1, title: c.title }));
    const resolved_references = [];
    const missing_references = [];
    o.clauses.forEach((c, i) => {
        const heading = `${i + 1}. ${c.title}`;
        blocks.push({ type: "heading", level: 2, text: heading });
        md.push(`## ${heading}`, "");
        for (const p of paragraphs(c.body)) {
            const r = fillVariables(p, values);
            for (const v of r.filled)
                if (!filled.includes(v))
                    filled.push(v);
            for (const v of r.unfilled)
                if (!unfilled.includes(v))
                    unfilled.push(v);
            blocks.push({ type: "para", text: r.text });
            md.push(r.text, "");
        }
        for (const ref of c.references ?? []) {
            const target = numberOf.get(ref);
            if (target) {
                const line = `See also clause ${target.n} (${target.title}).`;
                resolved_references.push({ clause: c.id, refers_to: ref, as: line });
                blocks.push({ type: "para", text: line });
                md.push(line, "");
            }
            else {
                missing_references.push({ clause: c.id, refers_to: ref });
            }
        }
    });
    if (unfilled.length) {
        blocks.push({ type: "heading", level: 2, text: "Open items" });
        blocks.push({ type: "para", text: "Each bracketed item below is a fact this document still needs. Replace every one before signing." });
        blocks.push({ type: "bullets", ordered: false, items: unfilled.map(promptFor) });
        md.push("## Open items", "", "Each bracketed item below is a fact this document still needs. Replace every one before signing.", "");
        for (const v of unfilled)
            md.push(`- ${promptFor(v)}`);
        md.push("");
    }
    return { blocks, markdown: md.join("\n"), filled, unfilled, resolved_references, missing_references };
}
/** Every variable the given clauses use, with whether a value was supplied. */
export function variableReport(clauses, values) {
    const map = new Map();
    for (const c of clauses) {
        for (const v of clauseVariables(c)) {
            const list = map.get(v) ?? [];
            list.push(c.id);
            map.set(v, list);
        }
    }
    return [...map.entries()].map(([variable, ids]) => ({
        variable,
        value: values[variable],
        clauses: ids,
    }));
}
