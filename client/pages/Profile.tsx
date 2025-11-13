import { useEffect, useState } from "react";
import { getFirebase } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { toast } from "sonner";

export default function Profile() {
  const { auth, db } = getFirebase();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"donor" | "receiver">("donor");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!auth || !db || !auth.currentUser) {
        setLoading(false);
        return;
      }
      const uid = auth.currentUser.uid;
      setEmail(auth.currentUser.email || "");
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as any;
        setName(data.name || auth.currentUser.displayName || "");
        setRole((data.role as any) || "donor");
        setPhone(data.phone || "");
      } else {
        await setDoc(ref, {
          name: auth.currentUser.displayName || "",
          email: auth.currentUser.email,
          role: "donor",
          phone: "",
          createdAt: serverTimestamp(),
        });
        setName(auth.currentUser.displayName || "");
        setRole("donor");
        setPhone("");
      }
      setLoading(false);
    };
    void run();
  }, [auth, db]);

  const save = async () => {
    const { auth, db } = getFirebase();
    if (!auth || !db || !auth.currentUser) {
      toast("Sign in to edit profile");
      return;
    }
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        name,
        phone,
        updatedAt: serverTimestamp(),
      });
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update profile");
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">Your Profile</h1>
      <p className="text-muted-foreground mt-1">
        View and edit your information.
      </p>

      {loading ? (
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="mt-6 max-w-md space-y-3">
          <div>
            <label className="text-sm">Full name</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">Email</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={email}
              readOnly
            />
          </div>
          <div>
            <label className="text-sm">Role</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={role}
              readOnly
            />
            <div className="mt-1 text-xs text-muted-foreground">
              Role is permanent after signup.
            </div>
          </div>
          <div>
            <label className="text-sm">Phone (shared on accept)</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +91 98765 43210"
            />
          </div>
          <Button onClick={save}>Save</Button>
        </div>
      )}
    </div>
  );
}
