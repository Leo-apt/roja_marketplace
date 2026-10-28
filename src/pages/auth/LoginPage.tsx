import { useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { btn, Field, TextInput } from "@/components/catalog/FormBits";
import { Alert, AuthShell, PasswordField } from "@/components/auth/AuthShell";

export default function LoginPage() {
    const { login } = useAuth();
    const st = useLocation().state as { registered?: boolean; email?: string } | null;
    const [email, setEmail] = useState(st?.email ?? "");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const em = email.trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(em)) return setError("Enter a valid email address");
        if (!password) return setError("Password is required");
        setError("");
        setLoading(true);
        try {
            await login(em, password); // PublicOnly redirects to Overview once the user is set
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
            setLoading(false);
        }
    };

    return (
        <AuthShell title="Sign in" subtitle="Log in to continue to the ROJA console.">
            {error && <Alert kind="error">{error}</Alert>}
            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
                <Field label="Email" required>
                    <TextInput type="email" autoComplete="email" value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
                <button type="submit" disabled={loading} className={`${btn.brand} w-full disabled:opacity-60`}>
                    {loading ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </AuthShell>
    );
}