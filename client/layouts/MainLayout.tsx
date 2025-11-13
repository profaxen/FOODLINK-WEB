import { Link, NavLink, useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFirebase, isGuestMode, setGuestMode } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function MainLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<"donor" | "receiver" | null>(null);

  useEffect(() => {
    const { auth, db } = getFirebase();
    if (!auth) return;
    return onAuthStateChanged(auth, async (u) => {
      setAuthed(!!u);
      if (u && db) {
        try {
          const s = await getDoc(doc(db, "users", u.uid));
          setRole(((s.data() as any)?.role as any) || null);
        } catch {
          setRole(null);
        }
      } else {
        setRole(null);
      }
    });
  }, []);

  const navLink = (
    to: string,
    label: string,
    opts?: { className?: string },
  ) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
          opts?.className,
        )
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div
              className="size-8 rounded-md bg-gradient-to-br from-emerald-400 to-lime-500 shadow-inner"
              aria-hidden
            />
            <span className="text-xl font-extrabold tracking-tight">
              FoodLink
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLink("/", "Home")}
            {role === "donor" && navLink("/requests", "Requests")}
            {role === "receiver" && navLink("/my-requests", "My Requests")}
            {navLink("/profile", "Profile")}
          </nav>
          <div className="flex items-center gap-2">
            {role === "donor" && location.pathname !== "/create" && (
              <Button asChild size="sm" variant="secondary">
                <Link to="/create">Create Listing</Link>
              </Button>
            )}
            {role === "receiver" &&
              location.pathname !== "/dashboard/receiver" && (
                <Button asChild size="sm" variant="secondary">
                  <Link to="/dashboard/receiver">Browse Listings</Link>
                </Button>
              )}
            {!authed ? (
              <Button asChild size="sm">
                <Link to="/auth">Sign In</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/profile">Account</Link>
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    const { auth } = getFirebase();
                    if (auth && auth.currentUser) {
                      await signOut(auth).catch(() => void 0);
                    }
                  }}
                >
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="container py-10 grid gap-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="size-6 rounded bg-gradient-to-br from-emerald-400 to-lime-500"
                aria-hidden
              />
              <span className="font-bold">FoodLink</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              Bridging surplus to need — connecting donors with receivers to
              reduce food waste and nourish communities.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div>
              <div className="text-sm font-semibold mb-2">Product</div>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    className="hover:text-foreground text-muted-foreground"
                    to="/dashboard/receiver"
                  >
                    Browse Listings
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-foreground text-muted-foreground"
                    to="/create"
                  >
                    Create Listing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold mb-2">Company</div>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    className="hover:text-foreground text-muted-foreground"
                    to="/contact"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-foreground text-muted-foreground"
                    to="/privacy"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-foreground text-muted-foreground"
                    to="/terms"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="md:text-right">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FoodLink. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
