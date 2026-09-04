import React, { useState, useEffect } from "react";
import { Bike, Car, Bus, MapPin, ArrowRight, Check, X, User, Plus, Clock, Users as UsersIcon, Loader2, MessageCircle, Send } from "lucide-react";
import { db } from "./firebase.js";
import { collection, onSnapshot, addDoc, updateDoc, doc } from "firebase/firestore";

const COLORS = {
  night: "#1B2A4A",
  amber: "#F2A340",
  sand: "#FAF6EF",
  teal: "#2E8B7E",
  coral: "#E85D4E",
  charcoal: "#26272B",
  muted: "#8A8F9C",
  line: "#E4DFD3",
};

const VEHICLE_META = {
  bike: { icon: Bike, label: "Bike" },
  car: { icon: Car, label: "Car" },
  bus: { icon: Bus, label: "Bus" },
};

const VEHICLES_COLLECTION = "vehicles";
const REQUESTS_COLLECTION = "requests";
const RIDER_POSTS_COLLECTION = "riderPosts";
const MESSAGES_COLLECTION = "messages";
const PROFILE_STORAGE_KEY = "marghee-profile-name";

const seedVehicles = [
  { owner: "Ramesh", type: "car", from: "Rohini", to: "Connaught Place", mode: "local", seats: 3, time: "Today, 9:00 AM", price: 60 },
  { owner: "Suman Travels", type: "bus", from: "Delhi", to: "Jaipur", mode: "long", seats: 18, time: "Tomorrow, 6:30 AM", price: 450 },
  { owner: "Ankit", type: "bike", from: "Saket", to: "Hauz Khas", mode: "local", seats: 1, time: "Today, 6:15 PM", price: 25 },
];

function RouteLine({ compact }) {
  return (
    <svg width="100%" height={compact ? 18 : 28} viewBox="0 0 200 20" preserveAspectRatio="none" style={{ display: "block" }}>
      <line x1="4" y1="10" x2="196" y2="10" stroke={COLORS.line} strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
      <circle cx="4" cy="10" r="4" fill={COLORS.amber} />
      <circle cx="196" cy="10" r="4" fill={COLORS.coral} />
    </svg>
  );
}

function LocationInput({ value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const timeoutRef = React.useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=in&q=${encodeURIComponent(val)}`
        );
        const data = await res.json();
        setSuggestions(data);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  };

  const selectSuggestion = (s) => {
    const parts = s.display_name.split(",");
    const short = parts.length > 1 ? `${parts[0].trim()}, ${parts[1].trim()}` : parts[0].trim();
    onChange(short);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        style={{ borderColor: COLORS.line }}
        className="border rounded-lg px-3 py-2 text-sm outline-none w-full"
      />
      {open && suggestions.length > 0 && (
        <div style={{ borderColor: COLORS.line }} className="absolute z-20 top-full left-0 right-0 bg-white border rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => selectSuggestion(s)}
              style={{ color: COLORS.charcoal, borderColor: COLORS.line }}
              className="block w-full text-left px-3 py-2 text-xs border-b last:border-b-0 hover:bg-gray-50"
            >
              {s.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Badge({ status }) {
  const map = {
    pending: { bg: "#FDF1DE", fg: "#B4700C", label: "Pending" },
    accepted: { bg: "#E4F3EF", fg: COLORS.teal, label: "Accepted" },
    rejected: { bg: "#FBE9E7", fg: COLORS.coral, label: "Declined" },
    open: { bg: "#FDF1DE", fg: "#B4700C", label: "Waiting" },
    matched: { bg: "#E4F3EF", fg: COLORS.teal, label: "Matched" },
  };
  const s = map[status];
  return (
    <span style={{ background: s.bg, color: s.fg }} className="text-xs font-semibold px-2.5 py-1 rounded-full tracking-wide uppercase">
      {s.label}
    </span>
  );
}

export default function Margshri() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [screen, setScreen] = useState("landing");
  const [name, setName] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [riderPosts, setRiderPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { requestId, otherName }
  const [messageText, setMessageText] = useState("");
  const [mode, setMode] = useState("local");

  const [search, setSearch] = useState({ from: "", to: "", type: "car" });
  const [vform, setVform] = useState({ type: "car", from: "", to: "", seats: 2, time: "", price: "" });
  const [rform, setRform] = useState({ from: "", to: "", time: "", seatsNeeded: 1 });
  const [seatCounts, setSeatCounts] = useState({});

  const getSeatCount = (vehicleId, max) => Math.min(seatCounts[vehicleId] || 1, max);
  const adjustSeats = (vehicleId, delta, max) => {
    setSeatCounts((prev) => {
      const current = prev[vehicleId] || 1;
      const next = Math.min(Math.max(current + delta, 1), max);
      return { ...prev, [vehicleId]: next };
    });
  };

  const seededRef = React.useRef(false);

  // Name loads instantly from this device's storage — landing screen never waits on the network.
  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) setName(saved);
  }, []);

  // Real-time listeners start immediately in the background. Landing screen doesn't
  // wait for this — only the Rider/Owner dashboards need vehicles/requests.
  useEffect(() => {
    const unsubVehicles = onSnapshot(
      collection(db, VEHICLES_COLLECTION),
      async (snap) => {
        setVehicles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoaded(true);
        // One-time seed, done inline instead of a separate extra network round-trip
        if (snap.empty && !seededRef.current) {
          seededRef.current = true;
          for (const v of seedVehicles) {
            addDoc(collection(db, VEHICLES_COLLECTION), v).catch(() => {});
          }
        }
      },
      () => {
        setErrorMsg("Firebase se connect nahi ho paya. Config aur Firestore setup check karo.");
        setDataLoaded(true);
      }
    );
    const unsubRequests = onSnapshot(
      collection(db, REQUESTS_COLLECTION),
      (snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setErrorMsg("Requests load nahi ho paaye.")
    );
    const unsubRiderPosts = onSnapshot(
      collection(db, RIDER_POSTS_COLLECTION),
      (snap) => setRiderPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setErrorMsg("Rider requests load nahi ho paaye.")
    );
    const unsubMessages = onSnapshot(
      collection(db, MESSAGES_COLLECTION),
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setErrorMsg("Messages load nahi ho paaye.")
    );
    return () => {
      unsubVehicles();
      unsubRequests();
      unsubRiderPosts();
      unsubMessages();
    };
  }, []);

  const enter = (chosenRole) => {
    if (!name.trim()) return;
    localStorage.setItem(PROFILE_STORAGE_KEY, name.trim());
    setScreen(chosenRole === "rider" ? "rider" : "owner");
  };

  const withSync = async (fn) => {
    setSyncing(true);
    setErrorMsg("");
    try {
      await fn();
    } catch {
      setErrorMsg("Save nahi ho paya, dubara try karo.");
    } finally {
      setSyncing(false);
    }
  };

  const sendRequest = (vehicle) => {
    const seatsRequested = getSeatCount(vehicle.id, vehicle.seats);
    return withSync(async () => {
      const newReq = {
        riderName: name,
        vehicleId: vehicle.id,
        from: vehicle.from,
        to: vehicle.to,
        mode: vehicle.mode,
        type: vehicle.type,
        owner: vehicle.owner,
        status: "pending",
        seats: seatsRequested,
      };
      setRequests((prev) => [...prev, { id: "temp-" + Date.now(), ...newReq }]);
      addDoc(collection(db, REQUESTS_COLLECTION), newReq).catch(() => {
        setErrorMsg("Request save nahi ho paya, dubara try karo.");
      });
    });
  };

  const respond = (id, status) => {
    const req = requests.find((r) => r.id === id);
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    updateDoc(doc(db, REQUESTS_COLLECTION, id), { status }).catch(() => {
      setErrorMsg("Status save nahi ho paya, dubara try karo.");
    });

    // On acceptance, deduct the booked seats from the vehicle's available seats
    if (status === "accepted" && req) {
      const seatsBooked = req.seats || 1;
      const vehicle = vehicles.find((v) => v.id === req.vehicleId);
      if (vehicle) {
        const newSeats = Math.max((vehicle.seats || 0) - seatsBooked, 0);
        setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? { ...v, seats: newSeats } : v)));
        updateDoc(doc(db, VEHICLES_COLLECTION, vehicle.id), { seats: newSeats }).catch(() => {
          setErrorMsg("Seats update nahi ho paya.");
        });
      }
    }
  };

  const postVehicle = () =>
    withSync(async () => {
      if (!vform.from.trim() || !vform.to.trim() || !vform.time.trim()) return;
      const newVehicle = {
        owner: name,
        type: vform.type,
        from: vform.from,
        to: vform.to,
        mode,
        seats: Number(vform.seats) || 1,
        time: vform.time,
        price: Number(vform.price) || 0,
      };
      // Show it immediately — don't make the user wait for the network round-trip
      setVehicles((prev) => [...prev, { id: "temp-" + Date.now(), ...newVehicle }]);
      setVform({ type: "car", from: "", to: "", seats: 2, time: "", price: "" });
      addDoc(collection(db, VEHICLES_COLLECTION), newVehicle).catch(() => {
        setErrorMsg("Vehicle save nahi ho paya, dubara try karo.");
      });
    });

  const postRiderRequest = () =>
    withSync(async () => {
      if (!rform.from.trim() || !rform.to.trim() || !rform.time.trim()) return;
      const newPost = {
        riderName: name,
        from: rform.from,
        to: rform.to,
        time: rform.time,
        mode,
        type: search.type,
        seatsNeeded: Number(rform.seatsNeeded) || 1,
        status: "open",
        ownerName: null,
      };
      setRiderPosts((prev) => [...prev, { id: "temp-" + Date.now(), ...newPost }]);
      setRform({ from: "", to: "", time: "", seatsNeeded: 1 });
      addDoc(collection(db, RIDER_POSTS_COLLECTION), newPost).catch(() => {
        setErrorMsg("Request save nahi ho paya, dubara try karo.");
      });
    });

  const offerRide = (postId) => {
    setRiderPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: "matched", ownerName: name } : p)));
    updateDoc(doc(db, RIDER_POSTS_COLLECTION, postId), { status: "matched", ownerName: name }).catch(() => {
      setErrorMsg("Status save nahi ho paya, dubara try karo.");
    });
  };

  const sendMessage = () => {
    if (!messageText.trim() || !activeChat) return;
    const newMsg = {
      requestId: activeChat.requestId,
      senderName: name,
      text: messageText.trim(),
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, { id: "temp-" + Date.now(), ...newMsg }]);
    setMessageText("");
    addDoc(collection(db, MESSAGES_COLLECTION), newMsg).catch(() => {
      setErrorMsg("Message send nahi hua, dubara try karo.");
    });
  };

  const myVehicleIds = vehicles.filter((v) => v.owner === name).map((v) => v.id);
  const incoming = requests.filter((r) => myVehicleIds.includes(r.vehicleId));
  const myRequests = requests.filter((r) => r.riderName === name);
  const myRiderPosts = riderPosts.filter((p) => p.riderName === name);
  const openRiderPostsForOwner = riderPosts.filter((p) => p.mode === mode && (p.status === "open" || p.ownerName === name));
  const filteredVehicles = vehicles.filter(
    (v) =>
      v.mode === mode &&
      v.type === search.type &&
      v.seats > 0 &&
      (search.from === "" || v.from.toLowerCase().includes(search.from.toLowerCase())) &&
      (search.to === "" || v.to.toLowerCase().includes(search.to.toLowerCase()))
  );

  const Logo = () => (
    <div className="flex items-center gap-2">
      <div style={{ background: COLORS.amber }} className="w-8 h-8 rounded-lg flex items-center justify-center">
        <MapPin size={18} color={COLORS.night} strokeWidth={2.5} />
      </div>
      <span style={{ color: COLORS.night, letterSpacing: "-0.02em" }} className="text-xl font-bold">
        Margshri
      </span>
    </div>
  );

  const ModeToggle = () => (
    <div style={{ background: "#EFEAE0" }} className="inline-flex rounded-full p-1">
      {["local", "long"].map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          style={mode === m ? { background: COLORS.night, color: "white" } : { color: COLORS.muted }}
          className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
        >
          {m === "local" ? "Local" : "Long Distance"}
        </button>
      ))}
    </div>
  );

  if (screen === "landing") {
    return (
      <div style={{ background: COLORS.sand, minHeight: 560, fontFamily: "ui-sans-serif, system-ui" }} className="w-full flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-6"><Logo /></div>
          <p style={{ color: COLORS.muted }} className="text-center text-sm mb-8">
            Ek raasta, sab saath. Bike se bus tak — apna route share karo.
          </p>
          <div className="mb-5">
            <RouteLine />
          </div>
          <label style={{ color: COLORS.charcoal }} className="text-sm font-semibold mb-1 block">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            style={{ borderColor: COLORS.line }}
            className="w-full border rounded-xl px-4 py-3 mb-4 outline-none text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => enter("rider")}
              style={{ background: name.trim() ? COLORS.amber : "#EAE5D8", color: COLORS.night }}
              disabled={!name.trim()}
              className="rounded-xl py-3 font-bold text-sm flex flex-col items-center gap-1"
            >
              <UsersIcon size={18} />
              I'm a Rider
            </button>
            <button
              onClick={() => enter("owner")}
              style={{ background: name.trim() ? COLORS.night : "#EAE5D8", color: "white" }}
              disabled={!name.trim()}
              className="rounded-xl py-3 font-bold text-sm flex flex-col items-center gap-1"
            >
              <Car size={18} />
              I'm a Vehicle Owner
            </button>
          </div>
          <p style={{ color: COLORS.muted }} className="text-xs text-center mt-4">
            Ye data sabhi Margshri users ke saath live share hota hai.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.sand, minHeight: 560, fontFamily: "ui-sans-serif, system-ui" }} className="w-full">
      <div style={{ borderColor: COLORS.line }} className="flex items-center justify-between px-6 py-4 border-b flex-wrap gap-3">
        <Logo />
        <div className="flex items-center gap-3">
          <ModeToggle />
          <div style={{ background: "white", borderColor: COLORS.line }} className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm">
            <User size={14} color={COLORS.muted} />
            <span style={{ color: COLORS.charcoal }} className="font-medium">{name}</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: "#FBE9E7", color: COLORS.coral }} className="text-xs font-semibold text-center py-2">
          {errorMsg}
        </div>
      )}

      {screen === "rider" && !dataLoaded && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={22} className="animate-spin" color={COLORS.muted} />
        </div>
      )}

      {screen === "rider" && dataLoaded && (
        <div className="p-6 max-w-2xl mx-auto">
          <h2 style={{ color: COLORS.night }} className="text-lg font-bold mb-4">Find a ride</h2>
          <div style={{ borderColor: COLORS.line }} className="bg-white border rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <LocationInput placeholder="From" value={search.from} onChange={(v) => setSearch({ ...search, from: v })} />
              <LocationInput placeholder="To" value={search.to} onChange={(v) => setSearch({ ...search, to: v })} />
            </div>
            <div className="flex gap-2">
              {Object.entries(VEHICLE_META).map(([key, m]) => {
                const Icon = m.icon;
                const active = search.type === key;
                return (
                  <button key={key} onClick={() => setSearch({ ...search, type: key })}
                    style={active ? { background: COLORS.amber, color: COLORS.night } : { background: "#F3EFE6", color: COLORS.muted }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold">
                    <Icon size={15} /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {filteredVehicles.length === 0 && (
              <div style={{ borderColor: COLORS.line }} className="bg-white border rounded-2xl p-4 text-center mb-3">
                <p style={{ color: COLORS.muted }} className="text-sm mb-3">Is route par abhi koi vehicle open nahi hai.</p>
                <p style={{ color: COLORS.charcoal }} className="text-sm font-bold mb-3">Apna request post kar do — jab koi owner match kare to aapko dikh jayega.</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <LocationInput placeholder="From" value={rform.from} onChange={(v) => setRform({ ...rform, from: v })} />
                  <LocationInput placeholder="To" value={rform.to} onChange={(v) => setRform({ ...rform, to: v })} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input placeholder="Date & time" value={rform.time} onChange={(e) => setRform({ ...rform, time: e.target.value })} style={{ borderColor: COLORS.line }} className="border rounded-lg px-3 py-2 text-sm outline-none" />
                  <input type="number" min="1" placeholder="Seats chahiye" value={rform.seatsNeeded} onChange={(e) => setRform({ ...rform, seatsNeeded: e.target.value })} style={{ borderColor: COLORS.line }} className="border rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <button onClick={postRiderRequest} disabled={syncing} style={{ background: COLORS.night, color: "white" }} className="w-full rounded-lg py-2.5 text-sm font-bold disabled:opacity-50">
                  Post my request
                </button>
              </div>
            )}
            {filteredVehicles.map((v) => {
              const Icon = VEHICLE_META[v.type].icon;
              const already = requests.find((r) => r.vehicleId === v.id && r.riderName === name);
              return (
                <div key={v.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div style={{ background: COLORS.night }} className="w-9 h-9 rounded-full flex items-center justify-center">
                        <Icon size={16} color="white" />
                      </div>
                      <div>
                        <p style={{ color: COLORS.charcoal }} className="text-sm font-bold">{v.owner}</p>
                        <p style={{ color: COLORS.muted }} className="text-xs flex items-center gap-1"><Clock size={11} /> {v.time}</p>
                      </div>
                    </div>
                    <p style={{ color: COLORS.night }} className="text-sm font-bold">₹{v.price}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-2" style={{ color: COLORS.charcoal }}>
                    <span className="font-semibold">{v.from}</span>
                    <span className="font-semibold">{v.to}</span>
                  </div>
                  <RouteLine compact />
                  <div className="flex justify-between items-center mt-3">
                    <span style={{ color: COLORS.muted }} className="text-xs">{v.seats} seat(s) open</span>
                    {already ? (
                      <Badge status={already.status} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div style={{ borderColor: COLORS.line }} className="flex items-center border rounded-lg overflow-hidden">
                          <button
                            onClick={() => adjustSeats(v.id, -1, v.seats)}
                            style={{ color: COLORS.charcoal }}
                            className="px-2 py-1 text-sm font-bold"
                          >
                            −
                          </button>
                          <span style={{ color: COLORS.charcoal, borderColor: COLORS.line }} className="px-2 text-xs font-bold border-l border-r">
                            {getSeatCount(v.id, v.seats)}
                          </span>
                          <button
                            onClick={() => adjustSeats(v.id, 1, v.seats)}
                            style={{ color: COLORS.charcoal }}
                            className="px-2 py-1 text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                        <button onClick={() => sendRequest(v)} disabled={syncing} style={{ background: COLORS.amber, color: COLORS.night }} className="text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                          Send Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {myRequests.length > 0 && (
            <>
              <h3 style={{ color: COLORS.night }} className="text-sm font-bold mb-3">My requests</h3>
              <div className="space-y-2 mb-8">
                {myRequests.map((r) => (
                  <div key={r.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3 flex justify-between items-center">
                    <span style={{ color: COLORS.charcoal }} className="text-sm">{r.from} <ArrowRight size={12} className="inline" /> {r.to} · {r.owner} · {r.seats || 1} seat{(r.seats || 1) > 1 ? "s" : ""}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveChat({ requestId: r.id, otherName: r.owner })} style={{ color: COLORS.muted, borderColor: COLORS.line }} className="border rounded-full p-1.5">
                        <MessageCircle size={14} />
                      </button>
                      <Badge status={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {myRiderPosts.length > 0 && (
            <>
              <h3 style={{ color: COLORS.night }} className="text-sm font-bold mb-3">My posted requests (open search)</h3>
              <div className="space-y-2">
                {myRiderPosts.map((p) => (
                  <div key={p.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3 flex justify-between items-center">
                    <span style={{ color: COLORS.charcoal }} className="text-sm">
                      {p.from} <ArrowRight size={12} className="inline" /> {p.to} · {p.seatsNeeded || 1} seat{(p.seatsNeeded || 1) > 1 ? "s" : ""}
                      {p.status === "matched" && p.ownerName ? ` · ${p.ownerName} ready hai!` : ""}
                    </span>
                    <Badge status={p.status} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {screen === "owner" && !dataLoaded && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={22} className="animate-spin" color={COLORS.muted} />
        </div>
      )}

      {screen === "owner" && dataLoaded && (
        <div className="p-6 max-w-2xl mx-auto">
          <h2 style={{ color: COLORS.night }} className="text-lg font-bold mb-4">Post your vehicle</h2>
          <div style={{ borderColor: COLORS.line }} className="bg-white border rounded-2xl p-4 mb-8">
            <div className="flex gap-2 mb-3">
              {Object.entries(VEHICLE_META).map(([key, m]) => {
                const Icon = m.icon;
                const active = vform.type === key;
                return (
                  <button key={key} onClick={() => setVform({ ...vform, type: key })}
                    style={active ? { background: COLORS.night, color: "white" } : { background: "#F3EFE6", color: COLORS.muted }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold">
                    <Icon size={15} /> {m.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <LocationInput placeholder="From" value={vform.from} onChange={(v) => setVform({ ...vform, from: v })} />
              <LocationInput placeholder="To" value={vform.to} onChange={(v) => setVform({ ...vform, to: v })} />
              <input placeholder="Date & time e.g. Today, 5 PM" value={vform.time} onChange={(e) => setVform({ ...vform, time: e.target.value })} style={{ borderColor: COLORS.line }} className="border rounded-lg px-3 py-2 text-sm outline-none col-span-2" />
              <input type="number" placeholder="Seats" value={vform.seats} onChange={(e) => setVform({ ...vform, seats: e.target.value })} style={{ borderColor: COLORS.line }} className="border rounded-lg px-3 py-2 text-sm outline-none" />
              <input type="number" placeholder="Price per seat (₹)" value={vform.price} onChange={(e) => setVform({ ...vform, price: e.target.value })} style={{ borderColor: COLORS.line }} className="border rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <p style={{ color: COLORS.muted }} className="text-xs mb-3">Posting for: <b style={{ color: COLORS.charcoal }}>{mode === "local" ? "Local" : "Long Distance"}</b> mode (change from top toggle)</p>
            <button onClick={postVehicle} disabled={syncing} style={{ background: COLORS.amber, color: COLORS.night }} className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold disabled:opacity-50">
              {syncing ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Post Vehicle
            </button>
          </div>

          <h3 style={{ color: COLORS.night }} className="text-sm font-bold mb-3">Riders looking for a ride</h3>
          <div className="space-y-2 mb-8">
            {openRiderPostsForOwner.length === 0 && <p style={{ color: COLORS.muted }} className="text-sm">Abhi koi rider search nahi kar raha.</p>}
            {openRiderPostsForOwner.map((p) => {
              const Icon = VEHICLE_META[p.type]?.icon || Car;
              return (
                <div key={p.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div style={{ background: COLORS.night }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                      <Icon size={14} color="white" />
                    </div>
                    <div>
                      <p style={{ color: COLORS.charcoal }} className="text-sm font-semibold">{p.riderName}</p>
                      <p style={{ color: COLORS.muted }} className="text-xs">{p.from} <ArrowRight size={11} className="inline" /> {p.to} · {p.time} · {p.seatsNeeded || 1} seat{(p.seatsNeeded || 1) > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {p.status === "open" ? (
                    <button onClick={() => offerRide(p.id)} disabled={syncing} style={{ background: COLORS.amber, color: COLORS.night }} className="text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                      Offer Ride
                    </button>
                  ) : (
                    <Badge status={p.status} />
                  )}
                </div>
              );
            })}
          </div>

          <h3 style={{ color: COLORS.night }} className="text-sm font-bold mb-3">Incoming requests</h3>
          <div className="space-y-2 mb-8">
            {incoming.length === 0 && <p style={{ color: COLORS.muted }} className="text-sm">Abhi koi request nahi aayi.</p>}
            {incoming.map((r) => (
              <div key={r.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3 flex justify-between items-center">
                <div>
                  <p style={{ color: COLORS.charcoal }} className="text-sm font-semibold">{r.riderName}</p>
                  <p style={{ color: COLORS.muted }} className="text-xs">{r.from} <ArrowRight size={11} className="inline" /> {r.to} · {r.seats || 1} seat{(r.seats || 1) > 1 ? "s" : ""}</p>
                </div>
                {r.status === "pending" ? (
                  <div className="flex gap-2">
                    <button onClick={() => setActiveChat({ requestId: r.id, otherName: r.riderName })} style={{ color: COLORS.muted, borderColor: COLORS.line }} className="border rounded-full p-1.5">
                      <MessageCircle size={14} />
                    </button>
                    <button onClick={() => respond(r.id, "accepted")} disabled={syncing} style={{ background: COLORS.teal }} className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50"><Check size={15} color="white" /></button>
                    <button onClick={() => respond(r.id, "rejected")} disabled={syncing} style={{ background: COLORS.coral }} className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50"><X size={15} color="white" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveChat({ requestId: r.id, otherName: r.riderName })} style={{ color: COLORS.muted, borderColor: COLORS.line }} className="border rounded-full p-1.5">
                      <MessageCircle size={14} />
                    </button>
                    <Badge status={r.status} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <h3 style={{ color: COLORS.night }} className="text-sm font-bold mb-3">My posted vehicles</h3>
          <div className="space-y-2">
            {vehicles.filter((v) => v.owner === name).map((v) => (
              <div key={v.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3 text-sm flex justify-between">
                <span style={{ color: COLORS.charcoal }}>{v.from} → {v.to} · {v.time}</span>
                <span style={{ color: COLORS.muted }}>{v.seats} seats · ₹{v.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeChat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(27,42,74,0.4)" }} onClick={() => setActiveChat(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.sand }} className="w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl flex flex-col">
            <div style={{ background: COLORS.night }} className="flex items-center justify-between px-4 py-3 rounded-t-2xl">
              <p className="text-white text-sm font-bold">{activeChat.otherName}</p>
              <button onClick={() => setActiveChat(null)} className="text-white">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-2 p-4 overflow-y-auto" style={{ maxHeight: 320, minHeight: 160 }}>
              {messages.filter((m) => m.requestId === activeChat.requestId).length === 0 && (
                <p style={{ color: COLORS.muted }} className="text-xs text-center py-6">Koi message nahi hai abhi. Baat shuru karo!</p>
              )}
              {messages
                .filter((m) => m.requestId === activeChat.requestId)
                .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
                .map((m) => (
                  <div key={m.id} className={`flex ${m.senderName === name ? "justify-end" : "justify-start"}`}>
                    <div
                      style={m.senderName === name ? { background: COLORS.amber, color: COLORS.night } : { background: "white", color: COLORS.charcoal, borderColor: COLORS.line }}
                      className="max-w-[75%] px-3 py-2 rounded-2xl text-sm border"
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
            </div>
            <div style={{ borderColor: COLORS.line }} className="flex items-center gap-2 p-3 border-t">
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Message likho..."
                style={{ borderColor: COLORS.line }}
                className="flex-1 border rounded-full px-4 py-2 text-sm outline-none"
              />
              <button onClick={sendMessage} style={{ background: COLORS.amber, color: COLORS.night }} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
