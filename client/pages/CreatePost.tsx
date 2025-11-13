import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getFirebase } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function CreatePost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [category, setCategory] = useState<"veg" | "non-veg">("veg");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<"donor" | "receiver" | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [donorName, setDonorName] = useState("");

  useEffect(() => {
    const { db, auth } = getFirebase();
    const uid = auth?.currentUser?.uid;
    if (!db || !uid) {
      setCheckingRole(false);
      return;
    }
    getDoc(doc(db, "users", uid))
      .then((s) => {
        const data = s.data() as any;
        setRole(data?.role || null);
        setDonorName(data?.name || "");
      })
      .catch(() => setRole(null))
      .finally(() => setCheckingRole(false));
  }, []);

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
    const { db, auth } = getFirebase();
    if (!db || !auth || !auth.currentUser) {
      toast("Firebase not connected");
      return;
    }

    if (!title || !locationText || !quantity || !expiryDate) {
      toast("Title, location, quantity, and expiry date are required");
      return;
    }

    if (!latitude || !longitude) {
      toast("Location coordinates are required. Use 'Use my location' button.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl: string | null = null;

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

      await addDoc(collection(db, "listings"), {
        title,
        description,
        quantity,
        locationText,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        category,
        status: "available",
        expiryDate: new Date(expiryDate).toISOString(),
        donorId: auth.currentUser.uid,
        donorName: donorName || auth.currentUser.displayName || "Anonymous",
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp(),
      });

      toast.success("Listing created successfully");
      navigate("/");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create listing");
    } finally {
      setSaving(false);
    }
  };

  if (checkingRole) {
    return (
      <div className="container py-10">
        <div className="text-sm text-muted-foreground">Checking permissions…</div>
      </div>
    );
  }

  if (role !== "donor") {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold">Donors only</h1>
        <p className="text-muted-foreground mt-1">
          Sign in as a donor to create food listings.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">Create Food Listing</h1>
      <p className="text-muted-foreground mt-1">
        Share details about your surplus food.
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
          <div className="mt-1 text-xs text-muted-foreground">
            When should this food be picked up by?
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Upload Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div className="mt-1 text-xs text-muted-foreground">
            {file ? `Selected: ${file.name}` : "Image upload is optional"}
          </div>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create Listing"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
