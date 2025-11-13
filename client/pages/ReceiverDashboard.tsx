import { useEffect, useState } from "react";
import { getFirebase } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader, Utensils, MapPin } from "lucide-react";
import { isListingExpired, calculateDistance } from "@/lib/utils";

interface Listing {
  id: string;
  title: string;
  quantity: string;
  category: "veg" | "non-veg";
  locationText: string;
  donorName: string;
  imageUrl?: string;
  description?: string;
  expiryDate?: string;
  latitude?: number;
  longitude?: number;
}

export default function ReceiverDashboard() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [role, setRole] = useState<"donor" | "receiver" | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "veg" | "non-veg">(
    "all"
  );
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

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
    } else {
      setChecking(false);
    }

    if (!db) return;

    setLoading(true);
    const q = query(
      collection(db, "listings"),
      where("status", "==", "available")
    );
    return onSnapshot(
      q,
      async (snap) => {
        const data: Listing[] = [];

        for (const d of snap.docs) {
          const listing = d.data() as any;

          // Auto-delete expired listings with no requests
          if (isListingExpired(listing.expiryDate)) {
            try {
              // Check if there are any non-rejected requests for this listing
              const requestsSnap = await getDoc(doc(db, "listings", d.id));
              if (requestsSnap.exists()) {
                await deleteDoc(doc(db, "listings", d.id));
                continue; // Skip adding to data array
              }
            } catch (error) {
              console.error("Error checking/deleting expired listing:", error);
            }
          }

          data.push({ id: d.id, ...listing });
        }

        setListings(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching listings:", error);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        () => {
          // Geolocation denied or unavailable
        }
      );
    }
  }, []);

  const getDistance = (listing: Listing): number | null => {
    if (
      !userLocation ||
      listing.latitude == null ||
      listing.longitude == null
    ) {
      return null;
    }
    return calculateDistance(
      userLocation.lat,
      userLocation.lon,
      listing.latitude,
      listing.longitude
    );
  };

  let filteredListings = listings;

  // Filter by category
  if (categoryFilter !== "all") {
    filteredListings = filteredListings.filter((l) => l.category === categoryFilter);
  }

  // Filter by distance
  if (distanceFilter !== null && userLocation) {
    filteredListings = filteredListings.filter((l) => {
      const dist = getDistance(l);
      return dist !== null && dist <= distanceFilter;
    });
  }

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
          Donors cannot request food. Create listings and manage requests instead.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => navigate("/create")}>Create Listing</Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            View Requests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Available Food Listings</h1>
          <p className="text-muted-foreground mt-1">
            Browse and request food donations near you.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/my-requests")}>
          My Requests
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <div className="text-sm font-medium mb-2">Filter by category:</div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "veg", "non-veg"] as const).map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                  categoryFilter === category
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted border-transparent"
                }`}
              >
                {category === "all" ? "All" : category === "veg" ? "Vegetarian" : "Non-Veg"}
              </button>
            ))}
          </div>
        </div>

        {userLocation && (
          <div>
            <div className="text-sm font-medium mb-2">Filter by distance:</div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setDistanceFilter(null)}
                className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                  distanceFilter === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted border-transparent"
                }`}
              >
                All distances
              </button>
              {[1, 2, 5, 10].map((km) => (
                <button
                  key={km}
                  onClick={() => setDistanceFilter(km)}
                  className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                    distanceFilter === km
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted border-transparent"
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-muted-foreground" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <Utensils className="size-12 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">No listings available yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back soon or adjust your filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <button
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
                className="text-left rounded-xl border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                {listing.imageUrl ? (
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <Utensils className="text-muted-foreground" size={32} />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-2">{listing.title}</h3>
                  {listing.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {listing.description}
                    </p>
                  )}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded capitalize">
                        {listing.category}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Quantity: {listing.quantity}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={12} />
                      {userLocation && listing.latitude && listing.longitude ? (
                        <span>{getDistance(listing)?.toFixed(1)} km away</span>
                      ) : (
                        <span className="line-clamp-1">{listing.locationText}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      by {listing.donorName}
                    </div>
                  </div>
                  <Button className="w-full mt-3" size="sm">
                    View & Request
                  </Button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
