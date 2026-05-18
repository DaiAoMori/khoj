"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@phosphor-icons/react";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleRegister() {
        setError("");
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/auth/password/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (res.ok) {
                router.push("/");
            } else if (res.status === 409) {
                setError("An account with this email already exists.");
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || "Registration failed. Please try again.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col gap-4 w-[340px]">
                <div className="text-center font-bold text-2xl">Create your Khoj account</div>
                <Input
                    type="email"
                    placeholder="Email"
                    className="p-6 rounded-lg"
                    value={email}
                    autoFocus={true}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRegister(); }}
                />
                <Input
                    type="password"
                    placeholder="Password"
                    className="p-6 rounded-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRegister(); }}
                />
                <Input
                    type="password"
                    placeholder="Confirm password"
                    className="p-6 rounded-lg"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRegister(); }}
                />
                {error && (
                    <div className="text-red-500 text-sm text-center">
                        {error}{" "}
                        {error.includes("already exists") && (
                            <Link href="/" className="underline">
                                Sign in instead?
                            </Link>
                        )}
                    </div>
                )}
                <Button
                    variant="default"
                    className="p-6 rounded-lg font-bold"
                    onClick={handleRegister}
                    disabled={loading}
                >
                    {loading ? <Spinner className="h-5 w-5" /> : "Create account"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/" className="underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
