import { useEffect, useState } from "react";
import { getFirebase } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader, Edit2, Trash2 } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description: string;
  locationText: string;
  quantity: string;
  imageUrl?: string;
  status: "available" | "reserved";
}

interface Request {
  id: string;
  listingId: string;
  receiverName: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  requestedAt?: string;
}

export default function DonorDashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"donor" | "receiver" | null>(null);
  const [checking, setChecking] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);

  useEffect(() => {
    const { db, auth } = getFirebase();
    const uid = auth?.currentUser?.uid;

    if (db && uid) {
      getDoc(doc(db, "users", uid))
        .then((s) => {
          const data = s.data() as any;
          setRole(data?.role || null);
        })
        .catch(() => setRole(null))
        .finally(() => setChecking(false));

      setLoadingListings(true);
      const listingsQuery = query(
        collection(db, "listings"),
        where("donorId", "==", uid)
      );
      const unsubListings = onSnapshot(
        listingsQuery,
        (snap) => {
          const data: Listing[] = [];
          snap.forEach((d) => data.push({ id: d.id, ...(d.data() as any) }));
          setListings(data);
          setLoadingListings(false);
        },
        (error) => {
          console.error("Error fetching listings:", error);
          setLoadingListings(false);
        }
      );

      setLoadingRequests(true);
      const requestsQuery = query(
        collection(db, "requests"),
        where("listingId", "in", []) 
      );

      getDoc(doc(db, "users", uid)).then((userSnap) => {
        if (userSnap.exists()) {
          const listingsRef = query(
            collection(db, "requests")
          );
          const unsubRequests = onSnapshot(
            listingsRef,
            (snap) => {
              const data: Request[] = [];
              snap.forEach((d) => {
                const req = d.data() as any;
                if (req.listingId) {
                  getDoc(doc(db, "listings", req.listingId)).then((listingSnap) => {
                    if (listingSnap.exists() && listingSnap.data().donorId === uid) {
                      data.push({ id: d.id, ...(d.data() as any) });
                      setRequests([...data]);
                    }
                  });
                }
              });
              setLoadingRequests(false);
            },
            (error) => {
              console.error("Error fetching requests:", error);
              setLoadingRequests(false);
            }
          );
          return unsubRequests;
        }
      });

      return () => {
        unsubListings();
      };
    } else {
      setChecking(false);
    }
  }, []);

  const handleAcceptRequest = async (requestId: string, listingId: string) => {
    const { db } = getFirebase();
    if (!db) return;

    setProcessingRequestId(requestId);
    try {
      // Get the listing details before deleting
      const listingSnap = await getDoc(doc(db, "listings", listingId));
      const listingData = listingSnap.data();

      // Update request with status and listing details
      await updateDoc(doc(db, "requests", requestId), {
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
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to accept request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const { db } = getFirebase();
    if (!db) return;

    setProcessingRequestId(requestId);
    try {
      await updateDoc(doc(db, "requests", requestId), {
        status: "rejected",
      });
      toast.success("Request rejected");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reject request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    const { db } = getFirebase();
    if (!db) return;

    if (!confirm("Are you sure you want to delete this listing?")) return;

    setDeletingListingId(listingId);
    try {
      await deleteDoc(doc(db, "listings", listingId));
      toast.success("Listing deleted successfully");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete listing");
    } finally {
      setDeletingListingId(null);
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
          Receivers cannot access the donor dashboard.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => navigate("/dashboard/receiver")}>
            Browse Listings
          </Button>
          <Button variant="outline" onClick={() => navigate("/my-requests")}>
            My Requests
          </Button>
        </div>
      </div>
    );
  }

  const activeListing = listings.filter((l) => l.status === "available").length;
  const reservedListings = listings.filter((l) => l.status === "reserved").length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const acceptedRequests = requests.filter((r) => r.status === "accepted").length;

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Donor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your food listings and incoming requests.
          </p>
        </div>
        <Button onClick={() => navigate("/create")}>Create Listing</Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Available Listings</div>
          <div className="text-2xl font-bold mt-1">{activeListing}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Reserved Listings</div>
          <div className="text-2xl font-bold mt-1">{reservedListings}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Pending Requests</div>
          <div className="text-2xl font-bold mt-1">{pendingRequests}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Accepted Requests</div>
          <div className="text-2xl font-bold mt-1">{acceptedRequests}</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">My Listings</h2>
          <Button size="sm" onClick={() => navigate("/create")}>
            New Listing
          </Button>
        </div>
        {loadingListings ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin text-muted-foreground" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No listings yet. Create your first food listing to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="rounded-lg border p-4 hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/listing/${listing.id}`)}
                  >
                    <div className="font-medium">{listing.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Qty: {listing.quantity} | {listing.locationText}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs rounded px-2 py-1 ${
                        listing.status === "available"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      }`}
                    >
                      {listing.status}
                    </span>
                    <button
                      onClick={() => navigate(`/listing/${listing.id}/edit`)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      title="Edit listing"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      disabled={deletingListingId === listing.id}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-muted-foreground hover:text-red-600 disabled:opacity-50"
                      title="Delete listing"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Food Requests</h2>
        {loadingRequests ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No requests yet. Once receivers request your food, they'll appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{request.receiverName}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Listing ID: {request.listingId.substring(0, 8)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Status:{" "}
                      <span
                        className={`${
                          request.status === "pending"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : request.status === "accepted"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>
                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleAcceptRequest(request.id, request.listingId)
                        }
                        disabled={processingRequestId === request.id}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingRequestId === request.id}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
