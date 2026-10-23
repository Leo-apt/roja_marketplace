// Tools > Process: placeholder until the real process data is connected.
import EmptyState from "@/components/shared/EmptyState";

export default function ToolsDocuments() {
    return (
        <section className="overflow-hidden rounded-xl border border-line bg-white">
            <EmptyState title="No processes yet" message="Running processes will show up here." />
        </section>
    );
}