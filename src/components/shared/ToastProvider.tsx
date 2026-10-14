import { Toaster } from "sonner";

export function ToastProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <Toaster
                position="top-right"
                richColors
                closeButton
                duration={4000}
                toastOptions={{
                    style: {
                        fontSize: "16px",
                        padding: "12px 16px",
                    },
                }}
            />
        </>
    );
}