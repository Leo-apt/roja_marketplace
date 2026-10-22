import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { btn, Field, TextInput } from "@/components/catalog/FormBits";
import { Alert, AuthShell, PasswordField } from "@/components/auth/AuthShell";

export default function RegisterPage() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const em = email.trim().toLowerCase();
        const v: Record<string, string> = {};
        if (name.trim().length < 2) v.name = "Name must be at least 2 characters";
        if (!/^\S+@\S+\.\S+$/.test(em)) v.email = "Enter a valid email address";
        if (password.length < 6) v.password = "Password must be at least 6 characters";
        if (confirm !== password) v.confirm = "Passwords do not match";
        setErrors(v);
        setApiError("");
        if (Object.keys(v).length) return;
        setLoading(true);
        try {
            await register(name.trim(), em, password);
            nav("/login", { replace: true, state: { registered: true, email: em } });
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Registration failed");
            setLoading(false);
        }
    };

    return (
        <AuthShell title="Create account" subtitle="Register, then log in to access the console." skeletonFields={4}
            footer={<>Already registered? <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link></>}>
            {apiError && <Alert kind="error">{apiError}</Alert>}
            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
                <Field label="Name" required error={errors.name}>
                    <TextInput autoComplete="name" value={name} placeholder="Your name" onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Email" required error={errors.email}>
                    <TextInput type="email" autoComplete="email" value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <PasswordField label="Password" value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" />
                <PasswordField label="Confirm Password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
                <button type="submit" disabled={loading} className={`${btn.brand} w-full disabled:opacity-60`}>
                    {loading ? "Creating account…" : "Register"}
                </button>
            </form>
        </AuthShell>
    );
}