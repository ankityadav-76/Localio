import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, Store } from "lucide-react";
import { sendOtp, verifyOtp, getMyVendorListings } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

type Role = "user" | "vendor";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role | null>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await sendOtp(phone);
      setDevCode(res.dev_code);
      setStage("code");
    } catch {
      setError("Couldn't send code. Check the number and try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (!role) return;
    setBusy(true);
    setError(null);
    try {
      const res = await verifyOtp(phone, code, role);
      login(res.user_id, res.phone_number, res.is_vendor);

      if (res.is_vendor) {
        const listings = await getMyVendorListings(res.user_id);
        if (listings.length > 0) {
          navigate(`/vendor/dashboard/${listings[0].id}`);
        } else {
          navigate("/vendor/onboarding");
        }
      } else {
        navigate(-1);
      }
    } catch {
      setError("That code didn't match. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!role) {
    return (
      <div className="px-4 md:px-8 py-10 max-w-sm mx-auto">
        <p className="font-display font-semibold text-2xl mb-2">Welcome to Localio</p>
        <p className="text-sm text-ink-soft mb-6">How are you here today?</p>

        <button
          onClick={() => setRole("user")}
          className="card w-full p-4 flex items-center gap-3 text-left mb-3 hover:shadow-md transition-shadow"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-soft)" }}
          >
            <UtensilsCrossed size={18} color="var(--accent-ink)" />
          </div>
          <div>
            <p className="font-medium text-sm">I'm here to discover & review</p>
            <p className="text-xs text-ink-soft">Find places and share what you know</p>
          </div>
        </button>

        <button
          onClick={() => setRole("vendor")}
          className="card w-full p-4 flex items-center gap-3 text-left hover:shadow-md transition-shadow"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--trust-soft)" }}
          >
            <Store size={18} color="var(--trust)" />
          </div>
          <div>
            <p className="font-medium text-sm">I run a stall or small business</p>
            <p className="text-xs text-ink-soft">List your business on Localio</p>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-10 max-w-sm mx-auto">
      <p className="font-display font-semibold text-2xl mb-2">Log in</p>
      <p className="text-sm text-ink-soft mb-6">
        {role === "vendor"
          ? "Quick phone verification for your business account."
          : "Quick phone verification — this is what makes verified visits and reviewer credibility possible."}
      </p>

      {stage === "phone" ? (
        <>
          <label className="text-xs text-ink-soft block mb-1">Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 phone number"
            className="w-full border border-border rounded-lg bg-surface px-3 py-2.5 text-sm mb-4"
          />
          <button
            onClick={handleSend}
            disabled={busy || phone.length < 8}
            className="w-full bg-accent text-accent-ink font-medium py-2.5 rounded-full text-sm disabled:opacity-40"
          >
            Send code
          </button>
        </>
      ) : (
        <>
          <label className="text-xs text-ink-soft block mb-1">6-digit code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="w-full border border-border rounded-lg bg-surface px-3 py-2.5 text-sm mb-2"
          />
          {devCode && (
            <p className="text-xs text-ink-faint mb-4">
              Dev mode — no SMS wired up yet, your code is {devCode}
            </p>
          )}
          <button
            onClick={handleVerify}
            disabled={busy || code.length < 6}
            className="w-full bg-accent text-accent-ink font-medium py-2.5 rounded-full text-sm disabled:opacity-40"
          >
            Verify
          </button>
        </>
      )}

      {error && (
        <p className="text-sm mt-3" style={{ color: "var(--star)" }}>
          {error}
        </p>
      )}

      <button onClick={() => setRole(null)} className="text-xs text-ink-faint underline underline-offset-2 mt-4">
        Not quite — choose again
      </button>
    </div>
  );
}
