import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getFirebase } from "@/lib/firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import { MapPin, Loader, Trash2, Edit } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description?: string;
  quantity: string;
  locationText: string;
  latitude?: number;
  longitude?: number;
  category: "veg" | "non-veg";
  status: "available" | "reserved";
  donorId: string;
  donorName: string;
  imageUrl?: string;
  expiryDate?: string;
  createdAt?: string;
}

interface AcceptedRequest {
  donorPhone?: string;
  donorEmail?: string;
  listingExpiryDate?: string;
  listingTitle?: string;
  listingDescription?: string;
  listingQuantity?: string;
  listingCategory?: string;
  listingLocationText?: string;
  listingLatitude?: number;
  listingLongitude?: number;
  listingImageUrl?: string;
}

export default function FoodPostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"donor" | "receiver" | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [acceptedRequest, setAcceptedRequest] = useState<AcceptedRequest | null>(null);
  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { db, auth } = getFirebase();
      if (auth?.currentUser) setMyUid(auth.currentUser.uid);

      if (!db || !id) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "listings", id));
        if (snap.exists()) {
          setListing({ id, ...(snap.data() as any) });
        }

        const uid = auth?.currentUser?.uid;
        if (uid) {
          try {
            const us = await getDoc(doc(db, "users", uid));
            const userData = us.data() as any;
            setRole(userData?.role || null);
            setReceiverName(userData?.name || "");

            // Check for existing request from this receiver
            const requestsQuery = query(
              collection(db, "requests"),
              where("listingId", "==", id),
              where("receiverId", "==", uid)
            );
            const requestsSnap = await getDocs(requestsQuery);

            if (!requestsSnap.empty) {
              setHasExistingRequest(true);
              // Get the request details
              const req = requestsSnap.docs[0].data();
              if (req.status === "accepted") {
                // Fetch donor contact info
                let donorId = "";
                if (snap.exists()) {
                  donorId = snap.data().donorId;
                }

                if (donorId) {
                  const donorDoc = await getDoc(doc(db, "users", donorId));
                  if (donorDoc.exists()) {
                    const donorData = donorDoc.data();
                    setAcceptedRequest({
                      donorPhone: donorData.phone,
                      donorEmail: donorData.email,
                      listingExpiryDate: req.listingExpiryDate,
                      listingTitle: req.listingTitle,
                      listingDescription: req.listingDescription,
                      listingQuantity: req.listingQuantity,
                      listingCategory: req.listingCategory,
                      listingLocationText: req.listingLocationText,
                      listingLatitude: req.listingLatitude,
                      listingLongitude: req.listingLongitude,
                      listingImageUrl: req.listingImageUrl,
                    });
                  }
                }
              }
            }
          } catch {
            setRole(null);
          }
        }
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load listing");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [id]);

  const requestFood = async () => {
    const { db, auth } = getFirebase();
    if (!db || !id || !listing) {
      toast("Unavailable right now");
      return;
    }
    
    if (role !== "receiver") {
      toast.error("Only receivers can request food");
      return;
    }
    
    if (auth?.currentUser?.uid === listing.donorId) {
      toast.error("You cannot request your own listing");
      return;
    }

    if (listing.status !== "available") {
      toast.error("This listing is no longer available");
      return;
    }

    if (hasExistingRequest) {
      toast.error("You already have a request for this listing");
      return;
    }

    setRequesting(true);
    try {
      await addDoc(collection(db, "requests"), {
        listingId: id,
        receiverId: auth?.currentUser?.uid || null,
        receiverName: receiverName || auth?.currentUser?.displayName || "Anonymous",
        status: "pending",
        requestedAt: new Date().toISOString(),
      });
      toast.success("Request sent to donor");
      setHasExistingRequest(true);
      navigate("/my-requests");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send request");
    } finally {
      setRequesting(false);
    }
  };

  const deleteListing = async () => {
    const { db } = getFirebase();
    if (!db || !id) return;

    if (!confirm("Are you sure you want to delete this listing?")) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, "listings", id));
      toast.success("Listing deleted");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete listing");
    } finally {
      setDeleting(false);
    }
  };

  const mapsHref = listing?.latitude && listing?.longitude
    ? `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`
    : null;

  const expiryTime = listing?.expiryDate 
    ? new Date(listing.expiryDate).toLocaleString()
    : null;

  // For accepted requests where listing was deleted, use data from request
  const displayListing = listing || (acceptedRequest ? {
    id: id || "",
    title: acceptedRequest.listingTitle || "Food Donation",
    description: acceptedRequest.listingDescription,
    quantity: acceptedRequest.listingQuantity,
    locationText: acceptedRequest.listingLocationText,
    latitude: acceptedRequest.listingLatitude,
    longitude: acceptedRequest.listingLongitude,
    category: acceptedRequest.listingCategory as any,
    status: "reserved" as const,
    donorId: "",
    donorName: "",
    imageUrl: acceptedRequest.listingImageUrl,
    expiryDate: acceptedRequest.listingExpiryDate,
  } : null);

  // Generate maps link and expiry time from display listing
  const displayMapsHref = displayListing?.latitude && displayListing?.longitude
    ? `https://www.google.com/maps?q=${displayListing.latitude},${displayListing.longitude}`
    : mapsHref;

  const displayExpiryTime = displayListing?.expiryDate
    ? new Date(displayListing.expiryDate).toLocaleString()
    : expiryTime;

  return (
    <div className="container py-10">
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !displayListing && !acceptedRequest ? (
        <div className="text-sm text-muted-foreground">Listing not found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            {displayListing?.imageUrl ? (
              <div className="aspect-video overflow-hidden rounded-xl border bg-muted/20">
                <img
                  src={displayListing.imageUrl}
                  alt={displayListing.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video overflow-hidden rounded-xl border bg-muted/20 flex items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
            <h1 className="mt-4 text-2xl font-bold">{displayListing?.title}</h1>
            {displayListing?.description && (
              <p className="text-muted-foreground mt-1">{displayListing.description}</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Quantity:</span>
                <div className="font-semibold">{displayListing?.quantity}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>
                <div className="font-semibold capitalize">{displayListing?.category}</div>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Location:</span>
                <div className="font-semibold">{displayListing?.locationText}</div>
              </div>
              {displayExpiryTime && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Expires:</span>
                  <div className="font-semibold">{displayExpiryTime}</div>
                </div>
              )}
            </div>
            {!acceptedRequest && listing?.status === "reserved" && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-100">
                  This listing has been reserved by another receiver.
                </p>
              </div>
            )}
          </div>
          <div className="rounded-xl border p-6">
            <div className="text-sm text-muted-foreground">Donor</div>
            <div className="font-semibold">{listing?.donorName || "Food Donor"}</div>

            {acceptedRequest && (
              <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="text-sm font-semibold text-green-800 dark:text-green-100 mb-3">
                  ✓ Request Accepted!
                </div>
                {acceptedRequest.donorPhone && (
                  <div className="text-xs mb-3">
                    <span className="text-muted-foreground">Phone:</span>
                    <div className="font-medium">{acceptedRequest.donorPhone}</div>
                  </div>
                )}
                {acceptedRequest.donorEmail && (
                  <div className="text-xs mb-3">
                    <span className="text-muted-foreground">Email:</span>
                    <div className="font-medium break-all">{acceptedRequest.donorEmail}</div>
                  </div>
                )}
                {acceptedRequest.listingExpiryDate && (
                  <div className="text-xs mb-3">
                    <span className="text-muted-foreground">Expires:</span>
                    <div className="font-medium">{new Date(acceptedRequest.listingExpiryDate).toLocaleString()}</div>
                  </div>
                )}
                {displayMapsHref && (
                  <a
                    href={displayMapsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <MapPin size={12} />
                    Open Location
                  </a>
                )}
              </div>
            )}

            {listing && role === "receiver" && myUid !== listing.donorId && listing.status === "available" && !hasExistingRequest ? (
              <Button
                className="mt-4 w-full"
                onClick={requestFood}
                disabled={requesting}
              >
                {requesting ? "Sending..." : "Request Food"}
              </Button>
            ) : role === "receiver" && hasExistingRequest && !acceptedRequest ? (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-100">
                  Your request is pending. Waiting for donor response.
                </p>
              </div>
            ) : !acceptedRequest && listing ? (
              <div className="mt-4 text-xs text-muted-foreground">
                {myUid === listing.donorId
                  ? "This is your listing."
                  : role === "donor"
                  ? "Donors cannot request food."
                  : listing.status === "reserved"
                  ? "This listing is no longer available."
                  : "Sign in as Receiver to request."}
              </div>
            ) : null}

            {listing && myUid === listing.donorId && (
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/listing/${listing.id}/edit`)}
                >
                  <Edit size={16} className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={deleteListing}
                  disabled={deleting}
                >
                  <Trash2 size={16} className="mr-1" />
                  {deleting ? "..." : "Delete"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
