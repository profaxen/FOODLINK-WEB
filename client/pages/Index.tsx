import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  HeartHandshake,
  Utensils,
  MapPin,
  ShieldCheck,
  Timer,
  Quote,
  Loader,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getFirebase } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, deleteDoc } from "firebase/firestore";
import { isListingExpired, calculateDistance } from "@/lib/utils";

interface Listing {
  id: string;
  title: string;
  quantity: string;
  locationText: string;
  category: "veg" | "non-veg";
  imageUrl?: string;
  donorName: string;
  status: "available" | "reserved";
  expiryDate?: string;
  latitude?: number;
  longitude?: number;
}

export default function Index() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"donor" | "receiver" | null>(null);
  const [checking, setChecking] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
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

  useEffect(() => {
    const { db, auth } = getFirebase();
    if (!db) return;

    setLoadingListings(true);
    const q = query(collection(db, "listings"), where("status", "==", "available"));
    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        const data: Listing[] = [];
        const uid = auth?.currentUser?.uid;

        for (const d of snap.docs) {
          const listing = d.data() as any;

          // Auto-delete expired listings
          if (isListingExpired(listing.expiryDate)) {
            try {
              await deleteDoc(d.ref);
              continue; // Skip adding to data array
            } catch (error) {
              console.error("Error deleting expired listing:", error);
            }
          }

          // If user is a donor, only show their own listings
          // If user is a receiver, show all listings
          // If not authenticated, show all listings
          if (role === "donor" && listing.donorId !== uid) {
            // Donor: exclude other donors' listings
            continue;
          }
          data.push({ id: d.id, ...listing });
        }
        setListings(data);
        setLoadingListings(false);
      },
      (error) => {
        console.error("Error fetching listings:", error);
        setLoadingListings(false);
      }
    );

    return () => unsubscribe();
  }, [role]);

  return (
    <div className="bg-gradient-to-b from-emerald-50 to-white dark:from-background dark:to-background">
      <section className="relative overflow-hidden">
        <div className="container py-16 md:py-24 grid items-center gap-10 md:grid-cols-2">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight"
            >
              Share good food. Nourish your community.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 text-lg text-muted-foreground max-w-xl"
            >
              FoodLink connects surplus meals with people nearby. Post fresh
              food, find donations around you, and reduce waste — together.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              {!checking && role === "donor" && (
                <>
                  <Button asChild size="lg" className="shadow">
                    <Link to="/create">Create Food Listing</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/requests">Requests</Link>
                  </Button>
                </>
              )}
              {!checking && role === "receiver" && (
                <>
                  <Button asChild size="lg" className="shadow">
                    <Link to="/dashboard/receiver">Browse Listings</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/my-requests">My Requests</Link>
                  </Button>
                </>
              )}
              {!checking && !role && (
                <>
                  <Button asChild size="lg" className="shadow">
                    <Link to="/auth">Get Started</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/dashboard/receiver">Browse Listings</Link>
                  </Button>
                </>
              )}
              {checking && (
                <div className="text-sm text-muted-foreground">Loading…</div>
              )}
            </motion.div>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              <Stat label="Listings active" value={listings.length.toString()} />
              <Stat label="Food available" value="100+" />
              <Stat label="Active donors" value="50+" />
            </div>
          </div>
          <div className="relative">
            <div
              className="absolute -inset-10 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-200/50 to-lime-200/30 blur-2xl"
              aria-hidden
            />
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border bg-card shadow-lg">
              <img
                alt="Fresh bowls of vegetables, fruits, and bread on a rustic table"
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1600&auto=format&fit=crop"
                className="h-full w-full object-cover opacity-90"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Available Listings</h2>
            <p className="text-muted-foreground mt-1">
              Fresh food donations near you
            </p>
          </div>
          {role === "donor" && (
            <Button asChild>
              <Link to="/create">Create New</Link>
            </Button>
          )}
        </div>

        {loadingListings ? (
          <div className="mt-8 flex items-center justify-center py-12">
            <Loader className="animate-spin text-muted-foreground" />
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-8 rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">No listings available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                userLocation={userLocation}
                onClick={() => navigate(`/listing/${listing.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="container py-16">
        <h2 className="text-2xl md:text-3xl font-bold">How FoodLink works</h2>
        <p className="text-muted-foreground mt-1">
          Post, match, and pick up — fast and safe.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Step
            num={1}
            title="Create a listing"
            desc="Donors add quantity, pickup location, food type (veg/non-veg), and photos."
          />
          <Step
            num={2}
            title="Request & match"
            desc="Receivers nearby request; donors accept and coordinate pickup."
          />
          <Step
            num={3}
            title="Confirm & track"
            desc="Mark completed and help grow community impact stats."
          />
        </div>
      </section>

      <section className="container py-16">
        <div className="rounded-2xl border p-6 md:p-10 bg-gradient-to-br from-white to-emerald-50 dark:from-background dark:to-background">
          <div className="grid gap-6 md:grid-cols-4">
            <Feature
              icon={Utensils}
              title="Fresh & surplus"
              desc="Share extra meals from homes, restaurants, and events."
            />
            <Feature
              icon={MapPin}
              title="Hyperlocal"
              desc="Discover donations near you with live listings."
            />
            <Feature
              icon={ShieldCheck}
              title="Safety first"
              desc="Allergen labels and pickups in trusted locations."
            />
            <Feature
              icon={Timer}
              title="Real-time"
              desc="Instant requests, notifications, and quick matching."
            />
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="rounded-2xl border p-6 md:p-10 bg-gradient-to-br from-white to-emerald-50 dark:from-background dark:to-background">
          <div className="flex items-center gap-2 mb-6">
            <HeartHandshake className="text-emerald-500" />
            <h3 className="text-xl font-semibold">Community stories</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Testimonial
              quote="Leftover trays became warm meals for families the same night."
              author="Priya, Restaurant Owner"
            />
            <Testimonial
              quote="The location-based matching makes it so easy to find donors nearby."
              author="Rahul, NGO Coordinator"
            />
            <Testimonial
              quote="I found fresh food nearby during exam week. Dignified and simple."
              author="Aisha, Student"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-extrabold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Icon className="text-emerald-500" />
        <div className="font-semibold">{title}</div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Step({
  num,
  title,
  desc,
}: {
  num: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border p-5">
      <div className="flex items-center gap-3">
        <div className="size-8 grid place-items-center rounded-full bg-primary text-primary-foreground font-bold">
          {num}
        </div>
        <div className="font-semibold text-lg">{title}</div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Testimonial({ quote, author }: { quote: string; author: string }) {
  return (
    <figure className="rounded-xl border p-5 bg-background">
      <Quote className="size-4 opacity-60" />
      <blockquote className="mt-2 text-sm text-muted-foreground">
        "{quote}"
      </blockquote>
      <figcaption className="mt-3 text-sm font-medium">— {author}</figcaption>
    </figure>
  );
}

function ListingCard({
  listing,
  userLocation,
  onClick,
}: {
  listing: Listing;
  userLocation: { lat: number; lon: number } | null;
  onClick: () => void;
}) {
  const getDistance = () => {
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

  const distance = getDistance();

  return (
    <button
      onClick={onClick}
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
        <div className="mt-2 text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">
              {listing.category}
            </span>
          </div>
          <div>Quantity: {listing.quantity}</div>
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            {distance !== null ? (
              <span>{distance.toFixed(1)} km away</span>
            ) : (
              <span className="line-clamp-1">{listing.locationText}</span>
            )}
          </div>
          <div className="text-xs">by {listing.donorName}</div>
        </div>
      </div>
    </button>
  );
}
