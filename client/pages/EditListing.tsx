import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getFirebase } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Loader } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description?: string;
  quantity: string;
  locationText: string;
  latitude: number;
  longitude: number;
  expiryDate: string;
  category: "veg" | "non-veg";
  imageUrl?: string;
  donorId: string;
}

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [role, setRole] = useState<"donor" | "receiver" | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [category, setCategory] = useState<"veg" | "non-veg">("veg");
  const [file, setFile] = useState<File | null>(null);

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
          const data = snap.data() as any;
          setListing({ id, ...data });
          setTitle(data.title || "");
          setDescription(data.description || "");
          setQuantity(data.quantity || "");
          setLocationText(data.locationText || "");
          setLatitude(data.latitude?.toString() || "");
          setLongitude(data.longitude?.toString() || "");
          setCategory(data.category || "veg");
          
          if (data.expiryDate) {
            const date = new Date(data.expiryDate);
            setExpiryDate(date.toISOString().slice(0, 16));
          }
        }

        const uid = auth?.currentUser?.uid;
        if (uid) {
          try {
            const us = await getDoc(doc(db, "users", uid));
            const userData = us.data() as any;
            setRole(userData?.role || null);
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

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat.toString());
        setLongitude(lon.toString());
        setLocationText(`Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`);
        toast.success("Location set");
      },
      (err) => toast.error(err.message),
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { db } = getFirebase();
    if (!db || !listing) {
      toast("Firebase not connected");
      return;
    }

    if (!title || !locationText || !quantity || !expiryDate) {
      toast("Title, location, quantity, and expiry date are required");
      return;
    }

    if (!latitude || !longitude) {
      toast("Location coordinates are required");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = listing.imageUrl;

      if (file) {
        // Convert image to Base64
        const reader = new FileReader();
        imageUrl = await new Promise((resolve, reject) => {
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(new Error("Failed to read file"));
          };
          reader.readAsDataURL(file);
        });
      }

      await updateDoc(doc(db, "listings", listing.id), {
        title,
        description,
        quantity,
        locationText,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        category,
        expiryDate: new Date(expiryDate).toISOString(),
        imageUrl,
        updatedAt: serverTimestamp(),
      });

      toast.success("Listing updated successfully");
      navigate(`/listing/${listing.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold">Listing not found</h1>
      </div>
    );
  }

  if (role !== "donor" || myUid !== listing.donorId) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold">Not authorized</h1>
        <p className="text-muted-foreground mt-1">
          Only the listing owner can edit this listing.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">Edit Food Listing</h1>
      <p className="text-muted-foreground mt-1">
        Update details about your food donation.
      </p>
      <form
        className="mt-6 grid gap-4 md:grid-cols-2"
        onSubmit={submit}
      >
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Title *</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g., Fresh biryani"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            rows={4}
            placeholder="Describe the food, packaging, and any allergies"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Quantity *</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g., 10 plates"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
          >
            <option value="veg">Vegetarian</option>
            <option value="non-veg">Non-Vegetarian</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Pickup Location *</label>
          <div className="flex items-center justify-between mb-1">
            <span></span>
            <button
              type="button"
              onClick={useMyLocation}
              className="text-xs text-primary hover:underline"
            >
              Use my location
            </button>
          </div>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Enter pickup address"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Latitude *</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g., 28.6139"
            type="number"
            step="0.0001"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Longitude *</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g., 77.2090"
            type="number"
            step="0.0001"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Expiry Date & Time *</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Update Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div className="mt-1 text-xs text-muted-foreground">
            {file ? `New image selected: ${file.name}` : "Leave empty to keep current image"}
          </div>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Updating..." : "Update Listing"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => navigate(`/listing/${listing.id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
