import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, MapPin, Check, ShieldCheck } from "lucide-react";
import { createVendorListing } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

const CATEGORIES = [
  { value: "street_food", label: "Street food" },
  { value: "eatery", label: "Eatery" },
];

export default function VendorOnboarding() {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("street_food");
  const [locality, setLocality] = useState("");
  const [landmark, setLandmark] = useState("");
  const [description, setDescription] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!userId) {
    navigate("/login");
    return null;
  }

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError("Location isn't available in this browser — verification needs it.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Verification needs location access to confirm you're at the stall.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !locality.trim()) {
      setError("Business name and locality are required.");
      return;
    }
    if (!coords) {
      setError("Tap \"Confirm I'm at my stall\" so we can location-verify your listing.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const form = new FormData();
    form.set("user_id", String(userId));
    form.set("name", name.trim());
    form.set("category", category);
    form.set("locality", locality.trim());
    if (landmark.trim()) form.set("landmark", landmark.trim());
    form.set("lat", String(coords.lat));
    form.set("lng", String(coords.lng));
    form.set("vendor_lat", String(coords.lat));
    form.set("vendor_lng", String(coords.lng));
    if (description.trim()) form.set("description", description.trim());
    if (gstNumber.trim()) form.set("gst_number", gstNumber.trim());
    if (photo) form.set("photo", photo);

    try {
      const listing = await createVendorListing(form);
      setDone(true);
      setTimeout(() => navigate(`/vendor/dashboard/${listing.id}`), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="px-4 md:px-8 py-16 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--trust-soft)" }}
        >
          <Check size={26} color="var(--trust)" />
        </motion.div>
        <p className="font-display font-semibold text-xl">You're listed</p>
        <p className="text-sm text-ink-soft mt-1">Taking you to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-md mx-auto">
      <p className="font-display font-semibold text-2xl mb-1">List your business</p>
      <p className="text-sm text-ink-soft mb-6">
        One-time setup. You won't be able to reply to or edit reviews — this stays a trust signal for customers.
      </p>

      <label className="text-xs text-ink-soft block mb-1">Business name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Raju Vada Pav"
        className="w-full border border-border rounded-lg bg-surface px-3 py-2.5 text-sm mb-4"
      />

      <label className="text-xs text-ink-soft block mb-1">Category</label>
      <div className="flex gap-2 mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`pill ${category === c.value ? "pill-active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <label className="text-xs text-ink-soft block mb-1">Locality</label>
      <input
        value={locality}
        onChange={(e) => setLocality(e.target.value)}
        placeholder="e.g. CG Road"
        className="w-full border border-border rounded-lg bg-surface px-3 py-2.5 text-sm mb-4"
      />

      <label className="text-xs text-ink-soft block mb-1">Nearby landmark (optional)</label>
      <input
        value={landmark}
        onChange={(e) => setLandmark(e.target.value)}
        placeholder="e.g. Near Fun Republic"
        className="w-full border border-border rounded-lg bg-surface px-3 py-2.5 text-sm mb-4"
      />

      <button
        type="button"
        onClick={captureLocation}
        className={`card w-full p-3 flex items-center gap-2 mb-1 text-sm ${
          coords ? "" : "text-ink-soft"
        }`}
      >
        <MapPin size={16} color={coords ? "var(--trust)" : undefined} />
        {locating ? "Getting your location..." : coords ? "Location confirmed" : "Confirm I'm at my stall"}
      </button>
      <p className="text-xs text-ink-faint mb-4">
        This is how we location-verify your listing — same check we use for verified reviews.
      </p>

      <label className="text-xs text-ink-soft block mb-1">Description (optional)</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What should people know before they visit?"
        rows={3}
        className="w-full border border-border rounded-lg bg-surface px-3 py-2.5 text-sm mb-4 resize-none"
      />

      <label className="text-xs text-ink-soft block mb-1">Business photo</label>
      <label className="card flex items-center gap-2 p-3 mb-4 cursor-pointer text-sm text-ink-soft w-fit">
        <Camera size={16} />
        {photo ? photo.name : "Add a photo"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        />
      </label>

      <label className="text-xs text-ink-soft block mb-1">GST number (optional)</label>
      <input
        value={gstNumber}
        onChange={(e) => setGstNumber(e.target.value)}
        placeholder="Only if your business is GST-registered"
        className="w-full border border-border rounded-lg bg-surface px-3 py-2.5 text-sm mb-2"
      />
      <p className="text-xs text-ink-faint mb-6">
        Optional — most street vendors are under the registration threshold. Adding one upgrades your badge
        to Registered Business.
      </p>

      <div className="card p-3 flex items-start gap-2 mb-6" style={{ background: "var(--trust-soft)" }}>
        <ShieldCheck size={16} color="var(--trust)" className="mt-0.5 shrink-0" />
        <p className="text-xs" style={{ color: "var(--trust)" }}>
          Verification tiers: a confirmed location + photo gets you Photo Verified. Adding a GST number
          upgrades you to Registered Business.
        </p>
      </div>

      {error && (
        <p className="text-sm mb-4" style={{ color: "var(--star)" }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-accent text-accent-ink font-medium py-3 rounded-full text-sm disabled:opacity-40"
      >
        {submitting ? "Listing your business..." : "List my business"}
      </button>
    </div>
  );
}
