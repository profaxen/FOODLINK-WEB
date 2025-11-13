import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getFirebase } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"donor" | "receiver">("donor");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { auth } = getFirebase();
    if (!auth) {
      toast("Connect Firebase to enable authentication");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        if (name) await updateProfile(cred.user, { displayName: name });

        try {
          const { db } = getFirebase();
          if (db) {
            await setDoc(doc(db, "users", cred.user.uid), {
              role,
              name: name || cred.user.displayName || null,
              email: cred.user.email,
              createdAt: serverTimestamp(),
            });
          }
        } catch (e: any) {
          // Non-fatal: account is created, but profile save failed
          console.error("Failed to save user profile:", e);
        }

        toast.success("Account created");
        navigate("/");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back");
        navigate("/");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const signInGoogle = async () => {
    const { auth } = getFirebase();
    if (!auth) {
      toast("Connect Firebase to enable Google Sign‑In");
      return;
    }
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Signed in with Google");
      navigate("/");
    } catch (e: any) {
      toast.error(e?.message ?? "Google sign‑in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-md rounded-2xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <button
            className="text-sm text-primary hover:underline"
            onClick={() =>
              setMode((m) => (m === "signup" ? "login" : "signup"))
            }
          >
            {mode === "signup"
              ? "Have an account? Log in"
              : "New here? Sign up"}
          </button>
        </div>

        {mode === "signup" && (
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">I am a</div>
            <div className="grid grid-cols-2 gap-2">
              <RoleCard
                label="Donor"
                active={role === "donor"}
                onClick={() => setRole("donor")}
              />
              <RoleCard
                label="Receiver"
                active={role === "receiver"}
                onClick={() => setRole("receiver")}
              />
            </div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-sm">Full name</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          )}
          <div>
            <label className="text-sm">Email</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm">Password</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {mode === "signup" ? "Create account" : "Log in"}
          </Button>
        </form>

        {mode === "login" && (
          <div className="mt-2 text-right">
            <button
              className="text-xs text-primary hover:underline"
              onClick={async () => {
                const { auth } = getFirebase();
                if (!auth || !email) {
                  toast("Enter your email above, then click forgot password");
                  return;
                }
                try {
                  await sendPasswordResetEmail(auth, email);
                  toast.success("Password reset email sent");
                } catch (e: any) {
                  toast.error(e?.message ?? "Failed to send reset email");
                }
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        <div className="my-4 text-center text-xs text-muted-foreground">or</div>

        <Button
          variant="outline"
          className="w-full"
          onClick={signInGoogle}
          disabled={loading}
        >
          Continue with Google
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <a href="/terms" className="underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function RoleCard({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-lg border p-3 text-left text-sm transition-colors " +
        (active ? "border-primary bg-primary/5" : "hover:bg-accent")
      }
    >
      <div className="font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">
        {label === "Donor"
          ? "Post surplus food for pickup"
          : "Request food nearby"}
      </div>
    </button>
  );
}
