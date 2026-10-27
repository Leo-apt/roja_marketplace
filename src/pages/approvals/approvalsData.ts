// Sample configuration releases and audit events. Replace with the API later.
export type ReleaseStatus = "Pending approval" | "Approved" | "Published" | "Rejected";
export interface Release { id: string; date: string; client: string; env: string; version: number; fingerprint: string; products: number; preparedBy: string; approvedBy: string; status: ReleaseStatus; reason: string }
export interface AuditEvent { id: string; date: string; actor: string; action: string; client: string; env: string; entity: string; note: string }

export const ME = "Taylor"; // sample signed-in approver

export const RELEASES: Release[] = [
    { id: "REL-0001", date: "2026-10-26", client: "Roja Main", env: "Web App", version: 4, fingerprint: "a41f09c2", products: 6, preparedBy: "Alex", approvedBy: "", status: "Pending approval", reason: "Add Wellness Plus to the catalog" },
    { id: "REL-0002", date: "2026-10-26", client: "Acme Corp", env: "Portal", version: 2, fingerprint: "77be10d4", products: 3, preparedBy: "Taylor", approvedBy: "", status: "Pending approval", reason: "Update Telehealth Basic customer price" },
    { id: "REL-0003", date: "2026-10-25", client: "Roja Main", env: "Mobile App", version: 3, fingerprint: "c90d3e18", products: 4, preparedBy: "Alex", approvedBy: "Taylor", status: "Approved", reason: "Enable the Care provider connection" },
    { id: "REL-0004", date: "2026-10-23", client: "Roja Main", env: "Web App", version: 3, fingerprint: "5d2a8b61", products: 5, preparedBy: "Jamie", approvedBy: "Taylor", status: "Published", reason: "Initial catalog release" },
    { id: "REL-0005", date: "2026-10-22", client: "Acme Corp", env: "Portal", version: 1, fingerprint: "e8801f77", products: 3, preparedBy: "Alex", approvedBy: "", status: "Rejected", reason: "Payments credential not verified" },
];

export const AUDIT: AuditEvent[] = [
    { id: "AUD-0008", date: "2026-10-26", actor: "Alex", action: "Configuration release requested", client: "Roja Main", env: "Web App", entity: "REL-0001", note: "Add Wellness Plus to the catalog" },
    { id: "AUD-0007", date: "2026-10-26", actor: "Taylor", action: "Configuration release requested", client: "Acme Corp", env: "Portal", entity: "REL-0002", note: "Update Telehealth Basic customer price" },
    { id: "AUD-0006", date: "2026-10-25", actor: "Taylor", action: "Configuration release approved", client: "Roja Main", env: "Mobile App", entity: "REL-0003", note: "Independent checker approved fingerprint c90d3e18" },
    { id: "AUD-0005", date: "2026-10-25", actor: "Alex", action: "Client product assignment drafted", client: "Roja Main", env: "Mobile App", entity: "ASG-roja-prod-MP-006", note: "Initial assignment" },
    { id: "AUD-0004", date: "2026-10-24", actor: "Jamie", action: "Provider payout draft created", client: "Roja Main", env: "Web App", entity: "PAY-001", note: "Invoice reviewed" },
    { id: "AUD-0003", date: "2026-10-23", actor: "Alex", action: "Credential reference registered", client: "Acme Corp", env: "Portal", entity: "CRD-PAY-01", note: "Metadata only; verification required" },
    { id: "AUD-0002", date: "2026-10-22", actor: "Taylor", action: "Configuration release rejected", client: "Acme Corp", env: "Portal", entity: "REL-0005", note: "Payments credential not verified" },
    { id: "AUD-0001", date: "2026-10-21", actor: "Master setup (sample)", action: "Initial catalog and environments seeded", client: "", env: "", entity: "MASTER", note: "All records are synthetic" },
];