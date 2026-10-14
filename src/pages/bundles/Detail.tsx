import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DetailShell } from "@/components/catalog/DetailBits";
import BundleSections from "@/components/catalog/BundleSections";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import type { Bundle } from "@/data/catalog";
import { bundlesService } from "@/services/bundles.service";

const BASE = "/catalog/bundles";

export default function BundlesDetail() {
    const { id } = useParams();
    const [b, setB] = useState<Bundle | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        let live = true;
        bundlesService.get(id)
            .then((r) => { if (live) setB(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id]);

    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!b || b.id !== id) return <LoadingBox />;
    return (
        <DetailShell backTo={BASE} editTo={`${BASE}/${b.id}/edit`}>
            <BundleSections b={b} />
        </DetailShell>
    );
}