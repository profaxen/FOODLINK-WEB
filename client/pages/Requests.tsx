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
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import { Loader } from "lucide-react";

interface Request {
  id: string;
  listingId: string;
  receiverId: string;
  receiverName: string;
  status: "pending" | "accepted" | "rejected";
  requestedAt?: string;
  acceptedAt?: string;
  listingTitle?: string;
  listingDescription?: string;
  listingQuantity?: string;
  listingCategory?: string;
  listingLocationText?: string;
  listingLatitude?: number;
  listingLongitude?: number;
  listingImageUrl?: string;
  listingExpiryDate?: string;
}

interface ListingInfo {
  id: string;
  title: string;
}

export default function Requests() {
  const navigate = useNavigate();
  const { auth, db } = getFirebase();
  const [items, setItems] = useState<Request[]>([]);
  const [listingsById, setListingsById] = useState<Record<string, ListingInfo>>({});
  const [role, setRole] = useState<"donor" | "receiver" | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "history">("active");

  useEffect(() => {
    const uid = auth?.currentUser?.uid;
    if (db && uid) {
      getDoc(doc(db, "users", uid))
        .then((s) => {
          const data = s.data() as any;
          setRole(data?.role || null);
        })
        .catch(() => setRole(null))
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }

    if (!db || !uid) return;

    setLoading(true);
    const requestsRef = collection(db, "requests");
    const unsubscribe = onSnapshot(
      requestsRef,
      async (snap) => {
        const rows: Request[] = [];
        const neededListingIds = new Set<string>();

        snap.forEach((d) => {
          const data = d.data() as any;
          rows.push({ id: d.id, ...data });
          if (data.listingId) neededListingIds.add(data.listingId);
        });

        // Filter to only requests for this donor's listings
        const filteredRequests: Request[] = [];
        for (const req of rows) {
          if (neededListingIds.has(req.listingId)) {
            const listingDoc = await getDoc(doc(db, "listings", req.listingId));
            // Include request if: listing exists and belongs to this donor, OR request is accepted/rejected (listing may be deleted)
            if (listingDoc.exists() && (listingDoc.data() as any).donorId === uid) {
              filteredRequests.push(req);
            } else if ((req.status === "accepted" || req.status === "rejected") && req.listingTitle) {
              // For accepted/rejected requests, listing may be deleted, but we have the listing details saved
              filteredRequests.push(req);
            }
          }
        }

        setItems(filteredRequests);

        // Load listing titles
        const listingMap: Record<string, ListingInfo> = { ...listingsById };
        for (const lid of neededListingIds) {
          if (!listingMap[lid]) {
            try {
              const ls = await getDoc(doc(db, "listings", lid));
              if (ls.exists()) {
                const data = ls.data() as any;
                listingMap[lid] = { id: lid, title: data.title || "Untitled" };
              }
            } catch {
              // ignore
            }
          }
        }
        setListingsById(listingMap);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching requests:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [db, auth?.currentUser?.uid]);

  const updateStatus = async (reqId: string, status: Request["status"], listingId: string) => {
    if (!db) return;

    setProcessingId(reqId);
    try {
      if (status === "accepted") {
        // Get the listing details before deleting
        const listingSnap = await getDoc(doc(db, "listings", listingId));
        const listingData = listingSnap.data();

        // Update request with status and listing details
        await updateDoc(doc(db, "requests", reqId), {
          status: "accepted",
          acceptedAt: new Date().toISOString(),
          listingTitle: listingData?.title,
          listingDescription: listingData?.description,
          listingQuantity: listingData?.quantity,
          listingCategory: listingData?.category,
          listingLocationText: listingData?.locationText,
          listingLatitude: listingData?.latitude,
          listingLongitude: listingData?.longitude,
          listingImageUrl: listingData?.imageUrl,
          listingExpiryDate: listingData?.expiryDate,
        });
        // Delete the listing when request is accepted
        await deleteDoc(doc(db, "listings", listingId));
        toast.success("Request accepted and listing removed");
      } else {
        await updateDoc(doc(db, "requests", reqId), { status });
        toast.success(`Request ${status}`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update");
    } finally {
      setProcessingId(null);
    }
  };

  if (checking) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (role !== "donor") {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold">Donors only</h1>
        <p className="text-muted-foreground mt-1">
          Manage requests for your food listings here.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => navigate("/create")}>Create Listing</Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back Home
          </Button>
        </div>
      </div>
    );
  }

  const activeRequests = items.filter((r) => r.status === "pending");
  const historyRequests = items.filter((r) => r.status === "accepted" || r.status === "rejected");
  const pendingCount = activeRequests.length;
  const historyCount = historyRequests.length;
  const displayRequests = tab === "active" ? activeRequests : historyRequests;

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Food Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage requests from receivers for your listings.
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Active Requests</div>
          <div className="text-2xl font-bold mt-1">{pendingCount}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">History</div>
          <div className="text-2xl font-bold mt-1">{historyCount}</div>
        </div>
      </div>

      <div className="mt-6 flex gap-2 border-b">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Requests
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          History
        </button>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center justify-center py-12">
          <Loader className="animate-spin text-muted-foreground" />
        </div>
      ) : displayRequests.length === 0 ? (
        <div className="mt-6 rounded-xl border p-8 text-center">
          <p className="text-muted-foreground">
            {tab === "active"
              ? "No active requests."
              : "No request history yet."}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "active"
              ? "Create a food listing to start receiving requests from receivers."
              : "Accepted or rejected requests will appear here."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {displayRequests.map((request) => {
            const listing = listingsById[request.listingId];
            const displayTitle = request.listingTitle || listing?.title || request.listingId.substring(0, 12);
            return (
              <div
                key={request.id}
                className="rounded-lg border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-lg font-semibold">{displayTitle}</div>
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
                    <div className="mt-2 font-medium">From: {request.receiverName}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Status:{" "}
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          request.status === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                            : request.status === "accepted"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    {request.requestedAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Requested: {new Date(request.requestedAt).toLocaleDateString()}
                      </div>
                    )}
                    {request.acceptedAt && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Accepted: {new Date(request.acceptedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {request.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateStatus(request.id, "accepted", request.listingId)}
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? "Processing..." : "Accept"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(request.id, "rejected", request.listingId)}
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? "Processing..." : "Reject"}
                    </Button>
                  </div>
                )}

                {request.status === "accepted" && (
                  <div className="mt-3 p-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-100">
                      ✓ Request accepted. Coordinate pickup with the receiver.
                    </p>
                  </div>
                )}

                {request.status === "rejected" && (
                  <div className="mt-3 p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-100">
                      ✗ Request rejected.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
