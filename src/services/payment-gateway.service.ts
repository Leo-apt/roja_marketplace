import { apiCall } from "./auth.service";

export type GatewayMode = "sandbox" | "live";
export interface GatewayView { mode: GatewayMode; configured: boolean; publishableKey: string; secretMasked: string }
interface ApiGateway { mode: GatewayMode; configured: boolean; publishableKey?: string; secretKey?: string }

const toUi = (a: ApiGateway): GatewayView => ({
    mode: a.mode,
    configured: !!a.configured,
    publishableKey: a.publishableKey ?? "",
    secretMasked: a.secretKey ?? "", // already masked by the backend, e.g. ••••••••1234
});

export const gatewayService = {
    get: (mode: GatewayMode) =>
        apiCall<ApiGateway>(`/settings/payment-gateway/${mode}`).then((r) => toUi(r.data)),
    // secretKey is optional on update: leave it out to keep the saved one
    save: (mode: GatewayMode, p: { publishableKey: string; secretKey?: string }) =>
        apiCall<ApiGateway>(`/settings/payment-gateway/${mode}`, { method: "PUT", body: JSON.stringify(p) })
            .then((r) => toUi(r.data)),
};