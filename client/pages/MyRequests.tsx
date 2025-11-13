import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirebase } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { Loader } from "lucide-react";

interface Request {
  id: string;
  listingId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  requestedAt?: string;
  listingTitle?: string;
  listingDescription?: string;
  listingQuantity?: string;
  listingExpiryDate?: string;
  acceptedAt?: string;
}

export default function MyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [role, setRole] = useState<"donor" | "receiver" | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const { db, auth } = getFirebase();
    const currentUid = auth?.currentUser?.uid;
    setUid(currentUid || null);

    if (db && currentUid) {
      getDoc(doc(db, "users", currentUid))
        .then((s) => {
          const data = s.data() as any;
          setRole(data?.role || null);
        })
        .catch(() => setRole(null))
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const { db } = getFirebase();
    if (!db || !uid) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "requests"), where("receiverId", "==", uid));
    return onSnapshot(
      q,
      (snap) => {
        const list: Request[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setRequests(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching requests:", error);
        setLoading(false);
      }
    );
  }, [uid]);

  if (checking) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (role === "donor") {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold">Receivers only</h1>
        <p className="text-muted-foreground mt-1">
          Donors cannot track personal requests. Manage your listing requests on the Dashboard.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back Home
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "accepted":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Requests</h1>
          <p className="text-muted-foreground mt-1">
            Track your food requests and their status.
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/receiver")}>
          Browse More
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <div className="mt-6 rounded-xl border p-8 text-center">
          <p className="text-muted-foreground">No requests yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Browse available donations to make your first request.
          </p>
          <Button className="mt-4" onClick={() => navigate("/dashboard/receiver")}>
            Browse Listings
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {request.listingTitle ? (
                    <>
                      <div className="text-lg font-semibold">{request.listingTitle}</div>
                      {request.listingQuantity && (
                        <div className="text-sm text-muted-foreground">
                          Quantity: {request.listingQuantity}
                        </div>
                      )}
                      {request.listingExpiryDate && (
                        <div className="text-sm text-muted-foreground">
                          Expires: {new Date(request.listingExpiryDate).toLocaleString()}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Listing ID: {request.listingId.substring(0, 12)}...
                    </div>
                  )}
                  <div className="mt-3 text-sm">
                    Status:{" "}
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-medium ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  {request.requestedAt && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Requested: {new Date(request.requestedAt).toLocaleDateString()}
                    </div>
                  )}
                  {request.acceptedAt && (
                    <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                      Accepted: {new Date(request.acceptedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {request.status === "pending" && (
                  <div className="text-xs text-muted-foreground">
                    Waiting for donor response...
                  </div>
                )}
                {request.status === "accepted" && (
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Accepted
                  </div>
                )}
                {request.status === "rejected" && (
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                    ✗ Rejected
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => navigate(`/listing/${request.listingId}`)}
              >
                View Listing
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
