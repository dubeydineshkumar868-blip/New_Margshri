import React, { useState, useEffect } from "react";
import { Bike, Car, Bus, MapPin, ArrowRight, Check, X, User, Plus, Clock, Users as UsersIcon, Loader2, MessageCircle, Send, Star, ShieldCheck, Flag, Ban, LayoutDashboard, Home } from "lucide-react";
import { db, auth, googleProvider } from "./firebase.js";
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";

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

const TRANSLATIONS = {
  en: {
    tagline: "One route, everyone together. From bike to bus — share your route.",
    continueGoogle: "Continue with Google",
    signOut: "Sign out",
    login: "Login",
    imRider: "I'm a Rider",
    imOwner: "I'm a Vehicle Owner",
    loginNote: "You don't need to log in to browse. You'll be asked to log in with Google when you book or post.",
    safetyLink: "Read Safety & Disclaimer",
    installApp: "📲 Install App (Home Screen)",
    adminPanel: "Admin Panel",
    addPhone: "+ Add phone",
    local: "Local",
    longDistance: "Long Distance",
    findRide: "Find a ride",
    from: "From",
    to: "To",
    noVehiclesFound: "No vehicle is open on this route right now.",
    postOwnRequestPrompt: "Post your own request — you'll be notified when an owner matches you.",
    dateTimePlaceholder: "Date & time",
    seatsWanted: "Seats needed",
    postMyRequest: "Post my request",
    seatsOpen: "seat(s) open",
    sendRequest: "Send Request",
    myRequests: "My requests",
    myPostedRequests: "My posted requests (open search)",
    cancel: "Cancel",
    rateOwner: "Rate Owner",
    postYourVehicle: "Post your vehicle",
    dateTimeExample: "Date & time e.g. Today, 5 PM",
    seats: "Seats",
    pricePerSeat: "Price per seat (₹)",
    postingFor: "Posting for:",
    modeChangeNote: "mode (change from top toggle)",
    routeType: "Route type",
    direct: "Direct (no stops)",
    multiStop: "Multi-stop route",
    addStop: "+ Add Stop",
    postVehicle: "Post Vehicle",
    ridersLookingForRide: "Riders looking for a ride",
    noRidersSearching: "No rider is searching right now.",
    offerRide: "Offer Ride",
    incomingRequests: "Incoming requests",
    noRequestsYet: "No requests yet.",
    rideDone: "Ride Done",
    noShow: "No-show",
    rateRider: "Rate Rider",
    myPostedVehicles: "My posted vehicles",
    remove: "Remove",
    seatsLeft: "seats left",
    save: "Save",
    submit: "Submit",
    close: "Close",
    understood: "Understood, let's go",
  },
  hi: {
    tagline: "एक रास्ता, सब साथ। बाइक से बस तक — अपना रूट शेयर करो।",
    continueGoogle: "Google से जारी रखें",
    signOut: "साइन आउट",
    login: "लॉगिन",
    imRider: "मैं यात्री हूँ",
    imOwner: "मैं वाहन मालिक हूँ",
    loginNote: "सब कुछ देखने के लिए लॉगिन ज़रूरी नहीं। बुकिंग या पोस्ट करते समय Google से लॉगिन करने को कहा जाएगा।",
    safetyLink: "सुरक्षा व अस्वीकरण पढ़ें",
    installApp: "📲 ऐप इंस्टॉल करें (होम स्क्रीन पर)",
    adminPanel: "एडमिन पैनल",
    addPhone: "+ फ़ोन नंबर जोड़ें",
    local: "लोकल",
    longDistance: "लॉन्ग डिस्टेंस",
    findRide: "राइड खोजें",
    from: "कहाँ से",
    to: "कहाँ तक",
    noVehiclesFound: "इस रूट पर अभी कोई वाहन उपलब्ध नहीं है।",
    postOwnRequestPrompt: "अपनी खुद की रिक्वेस्ट पोस्ट करें — कोई मालिक मैच होते ही आपको पता चल जाएगा।",
    dateTimePlaceholder: "तारीख़ और समय",
    seatsWanted: "कितनी सीट चाहिए",
    postMyRequest: "मेरी रिक्वेस्ट पोस्ट करें",
    seatsOpen: "सीट खाली हैं",
    sendRequest: "रिक्वेस्ट भेजें",
    myRequests: "मेरी रिक्वेस्ट्स",
    myPostedRequests: "मेरी पोस्ट की गई रिक्वेस्ट्स (ओपन सर्च)",
    cancel: "रद्द करें",
    rateOwner: "मालिक को रेट करें",
    postYourVehicle: "अपना वाहन पोस्ट करें",
    dateTimeExample: "तारीख़ और समय जैसे आज, शाम 5 बजे",
    seats: "सीटें",
    pricePerSeat: "प्रति सीट किराया (₹)",
    postingFor: "पोस्ट कर रहे हैं:",
    modeChangeNote: "मोड के लिए (ऊपर से बदलें)",
    routeType: "रूट का प्रकार",
    direct: "सीधा (कोई स्टॉप नहीं)",
    multiStop: "मल्टी-स्टॉप रूट",
    addStop: "+ स्टॉप जोड़ें",
    postVehicle: "वाहन पोस्ट करें",
    ridersLookingForRide: "राइड ढूंढ रहे यात्री",
    noRidersSearching: "अभी कोई यात्री खोज नहीं रहा है।",
    offerRide: "राइड ऑफर करें",
    incomingRequests: "आने वाली रिक्वेस्ट्स",
    noRequestsYet: "अभी कोई रिक्वेस्ट नहीं आई।",
    rideDone: "राइड पूरी हुई",
    noShow: "नहीं आया",
    rateRider: "यात्री को रेट करें",
    myPostedVehicles: "मेरे पोस्ट किए वाहन",
    remove: "हटाएं",
    seatsLeft: "सीटें बची हैं",
    save: "सेव करें",
    submit: "सबमिट करें",
    close: "बंद करें",
    understood: "समझ गया, आगे बढ़ते हैं",
  },
};

const VEHICLES_COLLECTION = "vehicles";
const REQUESTS_COLLECTION = "requests";
const RIDER_POSTS_COLLECTION = "riderPosts";
const MESSAGES_COLLECTION = "messages";
const REVIEWS_COLLECTION = "reviews";
const PROFILES_COLLECTION = "profiles";
const COMPLAINTS_COLLECTION = "complaints";
const BLOCKS_COLLECTION = "blockedUsers";

// Only these Google account emails can see the Admin Panel.
// To add or change admins, just edit this list and redeploy.
const ADMIN_EMAILS = ["dubeydineshkumar868@gmail.com"];

const seedVehicles = [
  { owner: "Ramesh", type: "car", from: "Rohini", to: "Connaught Place", mode: "local", seats: 3, time: "Today, 9:00 AM", price: 60 },
  { owner: "Suman Travels", type: "bus", from: "Delhi", to: "Jaipur", mode: "long", seats: 18, time: "Tomorrow, 6:30 AM", price: 450 },
  { owner: "Ankit", type: "bike", from: "Saket", to: "Hauz Khas", mode: "local", seats: 1, time: "Today, 6:15 PM", price: 25 },
];

function formatDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const d = new Date(year, month - 1, day, hour, minute);
  const dateLabel = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeLabel = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dateLabel}, ${timeLabel}`;
}

function RouteLine({ compact, stopCount = 0 }) {
  const dots = [];
  for (let i = 1; i <= stopCount; i++) {
    const x = 4 + (192 * i) / (stopCount + 1);
    dots.push(<circle key={i} cx={x} cy="10" r="3" fill={COLORS.night} />);
  }
  return (
    <svg width="100%" height={compact ? 18 : 28} viewBox="0 0 200 20" preserveAspectRatio="none" style={{ display: "block" }}>
      <line x1="4" y1="10" x2="196" y2="10" stroke={COLORS.line} strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
      <circle cx="4" cy="10" r="4" fill={COLORS.amber} />
      {dots}
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

function Badge({ status, lang = "en" }) {
  const labels = {
    en: { pending: "Pending", accepted: "Accepted", rejected: "Declined", open: "Waiting", matched: "Matched", completed: "Completed", noshow: "No-show", cancelled: "Cancelled" },
    hi: { pending: "लंबित", accepted: "स्वीकृत", rejected: "अस्वीकृत", open: "प्रतीक्षा में", matched: "मैच हुआ", completed: "पूरा हुआ", noshow: "नहीं आया", cancelled: "रद्द" },
  };
  const map = {
    pending: { bg: "#FDF1DE", fg: "#B4700C" },
    accepted: { bg: "#E4F3EF", fg: COLORS.teal },
    rejected: { bg: "#FBE9E7", fg: COLORS.coral },
    open: { bg: "#FDF1DE", fg: "#B4700C" },
    matched: { bg: "#E4F3EF", fg: COLORS.teal },
    completed: { bg: "#E4F3EF", fg: COLORS.teal },
    noshow: { bg: "#FBE9E7", fg: COLORS.coral },
    cancelled: { bg: "#EFEFEF", fg: COLORS.muted },
  };
  const s = map[status];
  const label = (labels[lang] || labels.en)[status] || status;
  return (
    <span style={{ background: s.bg, color: s.fg }} className="text-xs font-semibold px-2.5 py-1 rounded-full tracking-wide uppercase">
      {label}
    </span>
  );
}

function StarRating({ value, onChange, size = 20 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star size={size} fill={n <= value ? COLORS.amber : "none"} color={n <= value ? COLORS.amber : COLORS.line} />
        </button>
      ))}
    </div>
  );
}

export default function Margshri() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [screen, setScreen] = useState("landing");
  const [authLoading, setAuthLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setIsStandalone(!!standalone);
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstallPrompt(null));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } else if (isIOS) {
      setShowIOSHint(true);
    }
  };
  const [user, setUser] = useState(null);
  const name = user?.displayName || user?.email || "";
  const [myPhone, setMyPhone] = useState("");
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(true);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem("marghee-lang") || "en");
  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
  const toggleLang = () => {
    const next = lang === "en" ? "hi" : "en";
    setLang(next);
    localStorage.setItem("marghee-lang", next);
  };
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [riderPosts, setRiderPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [adminTab, setAdminTab] = useState("overview");
  const [activeReport, setActiveReport] = useState(null); // { requestId, aboutName }
  const [reportText, setReportText] = useState("");
  const [blockEmailInput, setBlockEmailInput] = useState("");
  const [blockReasonInput, setBlockReasonInput] = useState("");
  const [resolutionDrafts, setResolutionDrafts] = useState({});
  const [activeChat, setActiveChat] = useState(null); // { requestId, otherName }
  const [messageText, setMessageText] = useState("");
  const [chatSeen, setChatSeen] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("marghee-chat-seen") || "{}");
    } catch {
      return {};
    }
  });
  const [activeReview, setActiveReview] = useState(null); // { requestId, revieweeName }
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [viewingReviewsFor, setViewingReviewsFor] = useState(null);
  const [mode, setMode] = useState("local");

  const [search, setSearch] = useState({ from: "", to: "", type: "car" });
  const [filterTags, setFilterTags] = useState({ womenOnly: false, nonSmoker: false, ac: false, luggage: false });
  const [vform, setVform] = useState({ type: "car", from: "", to: "", seats: 2, date: "", clock: "", price: "", tags: { womenOnly: false, nonSmoker: false, ac: false, luggage: false }, routeType: "direct", stops: [] });
  const [rform, setRform] = useState({ from: "", to: "", date: "", clock: "", seatsNeeded: 1 });
  const [seatCounts, setSeatCounts] = useState({});
  const [destSelections, setDestSelections] = useState({});

  const getSelectedDest = (v) => {
    if (destSelections[v.id]) return destSelections[v.id];
    // Auto-pick a matching intermediate stop if the rider searched for it specifically
    if (v.stops && v.stops.length > 0 && search.to && !v.to.toLowerCase().includes(search.to.toLowerCase())) {
      const matchedStop = v.stops.find((s) => s.name.toLowerCase().includes(search.to.toLowerCase()));
      if (matchedStop) return { name: matchedStop.name, price: matchedStop.price };
    }
    return { name: v.to, price: v.price };
  };

  const getSeatCount = (vehicleId, max) => Math.min(seatCounts[vehicleId] || 1, max);
  const adjustSeats = (vehicleId, delta, max) => {
    setSeatCounts((prev) => {
      const current = prev[vehicleId] || 1;
      const next = Math.min(Math.max(current + delta, 1), max);
      return { ...prev, [vehicleId]: next };
    });
  };

  const addStop = () => setVform((prev) => ({ ...prev, stops: [...prev.stops, { name: "", price: "" }] }));
  const updateStop = (idx, field, value) =>
    setVform((prev) => ({ ...prev, stops: prev.stops.map((s, i) => (i === idx ? { ...s, [field]: value } : s)) }));
  const removeStop = (idx) => setVform((prev) => ({ ...prev, stops: prev.stops.filter((_, i) => i !== idx) }));

  const seededRef = React.useRef(false);

  // Real login state from Firebase Auth — persists automatically across visits.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Load this person's saved phone number + safety acknowledgment once they're logged in
  useEffect(() => {
    if (!user) {
      setMyPhone("");
      setSafetyAcknowledged(true);
      return;
    }
    const unsub = onSnapshot(doc(db, PROFILES_COLLECTION, user.uid), (snap) => {
      const data = snap.exists() ? snap.data() : {};
      setMyPhone(data.phone || "");
      setSafetyAcknowledged(!!data.safetyAcknowledged);
    });
    return unsub;
  }, [user]);

  const acknowledgeSafety = () => {
    if (!user) return;
    setSafetyAcknowledged(true);
    setDoc(doc(db, PROFILES_COLLECTION, user.uid), { safetyAcknowledged: true }, { merge: true }).catch(() => {});
  };

  const savePhone = () => {
    if (!user || !phoneInput.trim()) return;
    setMyPhone(phoneInput.trim());
    setDoc(doc(db, PROFILES_COLLECTION, user.uid), { phone: phoneInput.trim() }, { merge: true }).catch(() => {
      setErrorMsg("Phone number save nahi hua, dubara try karo.");
    });
    setShowPhoneModal(false);
    setPhoneInput("");
  };

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
    const unsubReviews = onSnapshot(
      collection(db, REVIEWS_COLLECTION),
      (snap) => setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setErrorMsg("Reviews load nahi ho paaye.")
    );
    const unsubComplaints = onSnapshot(
      collection(db, COMPLAINTS_COLLECTION),
      (snap) => setComplaints(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    const unsubBlocks = onSnapshot(
      collection(db, BLOCKS_COLLECTION),
      (snap) => setBlockedUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    return () => {
      unsubVehicles();
      unsubRequests();
      unsubRiderPosts();
      unsubMessages();
      unsubReviews();
      unsubComplaints();
      unsubBlocks();
    };
  }, []);

  const signInWithGoogle = () => {
    signInWithPopup(auth, googleProvider).catch((err) => {
      setErrorMsg(`Login error: ${err.code || err.message}`);
    });
  };

  const logOut = () => {
    signOut(auth);
    setScreen("landing");
  };

  const pendingActionRef = React.useRef(null);

  // If a pending action was queued because the person wasn't logged in,
  // run it automatically the moment login succeeds.
  useEffect(() => {
    if (user && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      action();
    }
  }, [user]);

  const requireAuth = (action) => {
    if (!user) {
      pendingActionRef.current = action;
      signInWithGoogle();
      return;
    }
    action();
  };

  const enter = (chosenRole) => {
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
    const dest = getSelectedDest(vehicle);
    return withSync(async () => {
      const newReq = {
        riderName: name,
        riderId: user?.uid || null,
        riderPhoto: user?.photoURL || null,
        riderPhone: myPhone || null,
        vehicleId: vehicle.id,
        from: vehicle.from,
        to: dest.name,
        fare: dest.price,
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
      if (!vform.from.trim() || !vform.to.trim() || !vform.date || !vform.clock) {
        setErrorMsg("From, To, Date, aur Time — sab bharna zaroori hai.");
        return;
      }
      const newVehicle = {
        owner: name,
        ownerId: user?.uid || null,
        ownerPhoto: user?.photoURL || null,
        ownerPhone: myPhone || null,
        type: vform.type,
        from: vform.from,
        to: vform.to,
        mode,
        seats: Number(vform.seats) || 1,
        totalSeats: Number(vform.seats) || 1,
        time: formatDateTime(vform.date, vform.clock),
        price: Number(vform.price) || 0,
        tags: vform.tags,
        routeType: vform.routeType,
        stops: vform.routeType === "multi" ? vform.stops.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), price: Number(s.price) || 0 })) : [],
      };
      // Show it immediately — don't make the user wait for the network round-trip
      setVehicles((prev) => [...prev, { id: "temp-" + Date.now(), ...newVehicle }]);
      setVform({ type: "car", from: "", to: "", seats: 2, date: "", clock: "", price: "", tags: { womenOnly: false, nonSmoker: false, ac: false, luggage: false }, routeType: "direct", stops: [] });
      addDoc(collection(db, VEHICLES_COLLECTION), newVehicle).catch(() => {
        setErrorMsg("Vehicle save nahi ho paya, dubara try karo.");
      });
    });

  const postRiderRequest = () =>
    withSync(async () => {
      if (!rform.from.trim() || !rform.to.trim() || !rform.date || !rform.clock) {
        setErrorMsg("From, To, Date, aur Time — sab bharna zaroori hai.");
        return;
      }
      const newPost = {
        riderName: name,
        riderId: user?.uid || null,
        from: rform.from,
        to: rform.to,
        time: formatDateTime(rform.date, rform.clock),
        mode,
        type: search.type,
        seatsNeeded: Number(rform.seatsNeeded) || 1,
        status: "open",
        ownerName: null,
      };
      setRiderPosts((prev) => [...prev, { id: "temp-" + Date.now(), ...newPost }]);
      setRform({ from: "", to: "", date: "", clock: "", seatsNeeded: 1 });
      addDoc(collection(db, RIDER_POSTS_COLLECTION), newPost).catch(() => {
        setErrorMsg("Request save nahi ho paya, dubara try karo.");
      });
    });

  const offerRide = (postId) => {
    setRiderPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: "matched", ownerName: name, ownerId: user?.uid || null } : p)));
    updateDoc(doc(db, RIDER_POSTS_COLLECTION, postId), { status: "matched", ownerName: name, ownerId: user?.uid || null }).catch(() => {
      setErrorMsg("Status save nahi ho paya, dubara try karo.");
    });
  };

  const openChat = (requestId, otherName) => {
    setChatSeen((prev) => {
      const updated = { ...prev, [requestId]: Date.now() };
      localStorage.setItem("marghee-chat-seen", JSON.stringify(updated));
      return updated;
    });
    setActiveChat({ requestId, otherName });
  };

  const hasUnreadMessages = (requestId) =>
    messages.some((m) => m.requestId === requestId && m.senderName !== name && (m.createdAt || 0) > (chatSeen[requestId] || 0));

  const sendMessage = () => {
    if (!messageText.trim() || !activeChat) return;
    const newMsg = {
      requestId: activeChat.requestId,
      senderName: name,
      senderId: user?.uid || null,
      text: messageText.trim(),
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, { id: "temp-" + Date.now(), ...newMsg }]);
    setMessageText("");
    addDoc(collection(db, MESSAGES_COLLECTION), newMsg).catch(() => {
      setErrorMsg("Message send nahi hua, dubara try karo.");
    });
  };

  const cancelRequest = (id) => {
    const req = requests.find((r) => r.id === id);
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
    updateDoc(doc(db, REQUESTS_COLLECTION, id), { status: "cancelled" }).catch(() => {
      setErrorMsg("Cancel nahi ho paya, dubara try karo.");
    });
    // If it was already accepted, give the seats back to the vehicle
    if (req && req.status === "accepted") {
      const seatsToRestore = req.seats || 1;
      const vehicle = vehicles.find((v) => v.id === req.vehicleId);
      if (vehicle) {
        const newSeats = (vehicle.seats || 0) + seatsToRestore;
        setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? { ...v, seats: newSeats } : v)));
        updateDoc(doc(db, VEHICLES_COLLECTION, vehicle.id), { seats: newSeats }).catch(() => {});
      }
    }
  };

  const deleteVehicle = (id) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    deleteDoc(doc(db, VEHICLES_COLLECTION, id)).catch(() => {
      setErrorMsg("Vehicle remove nahi ho paya, dubara try karo.");
    });
  };

  const cancelRiderPost = (id) => {
    setRiderPosts((prev) => prev.filter((p) => p.id !== id));
    deleteDoc(doc(db, RIDER_POSTS_COLLECTION, id)).catch(() => {
      setErrorMsg("Request cancel nahi ho paya, dubara try karo.");
    });
  };

  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email));
  const isBlocked = !!(user && blockedUsers.some((b) => b.id === user.email));

  const submitReport = () => {
    if (!activeReport || !reportText.trim()) return;
    const relatedReq = requests.find((r) => r.id === activeReport.requestId);
    let aboutPhone = null;
    if (relatedReq) {
      if (relatedReq.riderName === activeReport.aboutName) {
        aboutPhone = relatedReq.riderPhone || null;
      } else {
        const veh = vehicles.find((v) => v.id === relatedReq.vehicleId);
        aboutPhone = veh?.ownerPhone || null;
      }
    }
    const newReport = {
      reporterName: name,
      reporterId: user?.uid || null,
      reporterEmail: user?.email || null,
      reporterPhone: myPhone || null,
      aboutName: activeReport.aboutName,
      aboutPhone,
      requestId: activeReport.requestId || null,
      message: reportText.trim(),
      status: "open",
      resolutionNote: "",
      createdAt: Date.now(),
    };
    setComplaints((prev) => [...prev, { id: "temp-" + Date.now(), ...newReport }]);
    addDoc(collection(db, COMPLAINTS_COLLECTION), newReport).catch(() => {
      setErrorMsg("Complaint submit nahi hui, dubara try karo.");
    });
    setActiveReport(null);
    setReportText("");
  };

  const resolveComplaint = (id, note) => {
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status: "resolved", resolutionNote: note || "" } : c)));
    updateDoc(doc(db, COMPLAINTS_COLLECTION, id), { status: "resolved", resolutionNote: note || "" }).catch(() => {});
  };

  const blockUserByEmail = () => {
    if (!blockEmailInput.trim()) return;
    const email = blockEmailInput.trim().toLowerCase();
    setDoc(doc(db, BLOCKS_COLLECTION, email), { reason: blockReasonInput.trim() || "Koi reason nahi diya gaya", blockedAt: Date.now() }).catch(() => {
      setErrorMsg("Block nahi ho paya, dubara try karo.");
    });
    setBlockEmailInput("");
    setBlockReasonInput("");
  };

  const unblockUser = (email) => {
    deleteDoc(doc(db, BLOCKS_COLLECTION, email)).catch(() => {});
  };

  const deleteRequestAdmin = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    deleteDoc(doc(db, REQUESTS_COLLECTION, id)).catch(() => {
      setErrorMsg("Booking delete nahi hui, dubara try karo.");
    });
  };

  const deleteComplaint = (id) => {
    setComplaints((prev) => prev.filter((c) => c.id !== id));
    deleteDoc(doc(db, COMPLAINTS_COLLECTION, id)).catch(() => {
      setErrorMsg("Complaint delete nahi hui, dubara try karo.");
    });
  };

  const clearAllVehicles = () => {
    if (!window.confirm(`Sach mein saare ${vehicles.length} vehicles delete karne hain? Ye undo nahi ho sakta.`)) return;
    vehicles.forEach((v) => deleteDoc(doc(db, VEHICLES_COLLECTION, v.id)).catch(() => {}));
    setVehicles([]);
  };

  const clearAllBookings = () => {
    if (!window.confirm(`Sach mein saari ${requests.length} bookings delete karni hain? Ye undo nahi ho sakta.`)) return;
    requests.forEach((r) => deleteDoc(doc(db, REQUESTS_COLLECTION, r.id)).catch(() => {}));
    setRequests([]);
  };

  const clearAllComplaints = () => {
    if (!window.confirm(`Sach mein saari ${complaints.length} complaints delete karni hain? Ye undo nahi ho sakta.`)) return;
    complaints.forEach((c) => deleteDoc(doc(db, COMPLAINTS_COLLECTION, c.id)).catch(() => {}));
    setComplaints([]);
  };

  const submitReview = () => {
    if (!activeReview) return;
    const newReview = {
      requestId: activeReview.requestId,
      raterName: name,
      raterId: user?.uid || null,
      revieweeName: activeReview.revieweeName,
      rating: reviewRating,
      comment: reviewComment.trim(),
      createdAt: Date.now(),
    };
    setReviews((prev) => [...prev, { id: "temp-" + Date.now(), ...newReview }]);
    addDoc(collection(db, REVIEWS_COLLECTION), newReview).catch(() => {
      setErrorMsg("Review save nahi hua, dubara try karo.");
    });
    setActiveReview(null);
    setReviewRating(5);
    setReviewComment("");
  };

  const getAvgRating = (personName) => {
    const forPerson = reviews.filter((r) => r.revieweeName === personName);
    if (forPerson.length === 0) return null;
    const avg = forPerson.reduce((sum, r) => sum + (r.rating || 0), 0) / forPerson.length;
    return { avg: Math.round(avg * 10) / 10, count: forPerson.length };
  };

  const getReliability = (ownerName) => {
    const ownerVehicleIds = vehicles.filter((v) => v.owner === ownerName).map((v) => v.id);
    const finished = requests.filter((r) => ownerVehicleIds.includes(r.vehicleId) && (r.status === "completed" || r.status === "noshow"));
    if (finished.length === 0) return null;
    const completedCount = finished.filter((r) => r.status === "completed").length;
    return { pct: Math.round((completedCount / finished.length) * 100), total: finished.length };
  };

  const hasReviewed = (requestId) => reviews.some((r) => r.requestId === requestId && r.raterName === name);

  const myVehicleIds = vehicles.filter((v) => v.owner === name).map((v) => v.id);
  const incoming = requests.filter((r) => myVehicleIds.includes(r.vehicleId));
  const myRequests = requests.filter((r) => r.riderName === name);
  const myRiderPosts = riderPosts.filter((p) => p.riderName === name);
  const openRiderPostsForOwner = riderPosts.filter((p) => p.mode === mode && (p.status === "open" || p.ownerName === name));
  const activeTagFilters = Object.entries(filterTags).filter(([, v]) => v).map(([k]) => k);
  const filteredVehicles = vehicles.filter(
    (v) =>
      v.mode === mode &&
      v.type === search.type &&
      v.seats > 0 &&
      (search.from === "" || v.from.toLowerCase().includes(search.from.toLowerCase())) &&
      (search.to === "" ||
        v.to.toLowerCase().includes(search.to.toLowerCase()) ||
        (v.stops || []).some((s) => s.name.toLowerCase().includes(search.to.toLowerCase()))) &&
      activeTagFilters.every((tag) => v.tags && v.tags[tag])
  );

  const Logo = () => (
    <button onClick={() => setScreen("landing")} className="flex items-center gap-2">
      <div style={{ background: COLORS.amber }} className="w-8 h-8 rounded-lg flex items-center justify-center">
        <MapPin size={18} color={COLORS.night} strokeWidth={2.5} />
      </div>
      <span style={{ color: COLORS.night, letterSpacing: "-0.02em" }} className="text-xl font-bold">
        Margshri
      </span>
    </button>
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
          {m === "local" ? t("local") : t("longDistance")}
        </button>
      ))}
    </div>
  );

  if (authLoading) {
    return (
      <div style={{ background: COLORS.sand, minHeight: 560 }} className="w-full flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" color={COLORS.muted} />
      </div>
    );
  }

  if (isBlocked) {
    const myBlock = blockedUsers.find((b) => b.id === user.email);
    return (
      <div style={{ background: COLORS.sand, minHeight: 560 }} className="w-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Ban size={40} color={COLORS.coral} className="mx-auto mb-3" />
          <p style={{ color: COLORS.night }} className="text-lg font-bold mb-2">Aapka account block kar diya gaya hai</p>
          <p style={{ color: COLORS.muted }} className="text-sm mb-4">Reason: {myBlock?.reason || "Diya nahi gaya"}</p>
          <button onClick={logOut} style={{ background: COLORS.night, color: "white" }} className="rounded-lg px-5 py-2.5 text-sm font-bold">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (screen === "landing") {
    return (
      <div style={{ background: COLORS.sand, minHeight: 560, fontFamily: "ui-sans-serif, system-ui" }} className="w-full flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex justify-between items-center mb-6">
            <Logo />
            <button onClick={toggleLang} style={{ borderColor: COLORS.line, color: COLORS.night }} className="border rounded-full px-3 py-1 text-xs font-bold">
              {lang === "en" ? "हिं" : "EN"}
            </button>
          </div>
          <p style={{ color: COLORS.muted }} className="text-center text-sm mb-8">
            {t("tagline")}
          </p>
          <div className="mb-5">
            <RouteLine />
          </div>

          {!isStandalone && (installPrompt || isIOS) && (
            <button
              onClick={handleInstallClick}
              style={{ background: COLORS.night, color: "white" }}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm mb-4"
            >
              {t("installApp")}
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => enter("rider")}
              style={{ background: COLORS.amber, color: COLORS.night }}
              className="rounded-xl py-3 font-bold text-sm flex flex-col items-center gap-1"
            >
              <UsersIcon size={18} />
              {t("imRider")}
            </button>
            <button
              onClick={() => enter("owner")}
              style={{ background: COLORS.night, color: "white" }}
              className="rounded-xl py-3 font-bold text-sm flex flex-col items-center gap-1"
            >
              <Car size={18} />
              {t("imOwner")}
            </button>
          </div>

          <p style={{ color: COLORS.muted }} className="text-xs text-center mt-4">
            {t("loginNote")}
          </p>

          <button onClick={() => setShowSafetyModal(true)} style={{ color: COLORS.muted }} className="text-xs underline text-center block mx-auto mt-3">
            {t("safetyLink")}
          </button>

          <div className="flex items-center justify-center gap-3 mt-2">
            <button onClick={() => setScreen("privacy")} style={{ color: COLORS.muted }} className="text-xs underline">
              Privacy Policy
            </button>
            <span style={{ color: COLORS.line }}>|</span>
            <button onClick={() => setScreen("terms")} style={{ color: COLORS.muted }} className="text-xs underline">
              Terms of Service
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => setScreen("admin")}
              style={{ background: COLORS.night, color: "white" }}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-bold text-sm mt-4"
            >
              <LayoutDashboard size={16} /> {t("adminPanel")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.sand, minHeight: 560, fontFamily: "ui-sans-serif, system-ui" }} className="w-full">
      <div style={{ borderColor: COLORS.line }} className="flex items-center justify-between px-6 py-4 border-b flex-wrap gap-3">
        <Logo />
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen("landing")} style={{ borderColor: COLORS.line, color: COLORS.night }} className="border rounded-full p-2">
            <Home size={16} />
          </button>
          <button onClick={toggleLang} style={{ borderColor: COLORS.line, color: COLORS.night }} className="border rounded-full px-3 py-1.5 text-xs font-bold">
            {lang === "en" ? "हिं" : "EN"}
          </button>
          {screen !== "admin" && <ModeToggle />}
          {isAdmin && screen !== "admin" && (
            <button onClick={() => setScreen("admin")} style={{ borderColor: COLORS.line, color: COLORS.night }} className="border rounded-full p-2">
              <LayoutDashboard size={14} />
            </button>
          )}
          {user ? (
            <>
              <div style={{ background: "white", borderColor: COLORS.line }} className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm">
                <User size={14} color={COLORS.muted} />
                <span style={{ color: COLORS.charcoal }} className="font-medium">{name}</span>
              </div>
              <button
                onClick={() => {
                  setPhoneInput(myPhone);
                  setShowPhoneModal(true);
                }}
                style={{ color: myPhone ? COLORS.teal : COLORS.coral, borderColor: COLORS.line }}
                className="border rounded-full px-3 py-1.5 text-xs font-semibold"
              >
                {myPhone ? `📞 ${myPhone}` : t("addPhone")}
              </button>
              <button onClick={logOut} style={{ color: COLORS.muted, borderColor: COLORS.line }} className="border rounded-full px-3 py-1.5 text-xs font-semibold">
                {t("signOut")}
              </button>
            </>
          ) : (
            <button onClick={signInWithGoogle} style={{ background: COLORS.night, color: "white" }} className="rounded-full px-4 py-1.5 text-xs font-bold">
              {t("login")}
            </button>
          )}
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
          <h2 style={{ color: COLORS.night }} className="text-lg font-bold mb-4">{t("findRide")}</h2>
          <div style={{ borderColor: COLORS.line }} className="bg-white border rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <LocationInput placeholder={t("from")} value={search.from} onChange={(v) => setSearch({ ...search, from: v })} />
              <LocationInput placeholder={t("to")} value={search.to} onChange={(v) => setSearch({ ...search, to: v })} />
            </div>
            <div className="flex gap-2 mb-3">
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
            <div className="flex flex-wrap gap-2">
              {[
                { key: "womenOnly", label: "Women-only" },
                { key: "nonSmoker", label: "Non-smoker" },
                { key: "ac", label: "AC" },
                { key: "luggage", label: "Luggage space" },
              ].map((tag) => (
                <button
                  key={tag.key}
                  onClick={() => setFilterTags({ ...filterTags, [tag.key]: !filterTags[tag.key] })}
                  style={filterTags[tag.key] ? { background: COLORS.teal, color: "white" } : { background: "#F3EFE6", color: COLORS.muted }}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-full"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {filteredVehicles.length === 0 && (
              <div style={{ borderColor: COLORS.line }} className="bg-white border rounded-2xl p-4 text-center mb-3">
                <p style={{ color: COLORS.muted }} className="text-sm mb-3">{t("noVehiclesFound")}</p>
                <p style={{ color: COLORS.charcoal }} className="text-sm font-bold mb-3">{t("postOwnRequestPrompt")}</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <LocationInput placeholder={t("from")} value={rform.from} onChange={(v) => setRform({ ...rform, from: v })} />
                  <LocationInput placeholder={t("to")} value={rform.to} onChange={(v) => setRform({ ...rform, to: v })} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input type="date" value={rform.date} onChange={(e) => setRform({ ...rform, date: e.target.value })} style={{ borderColor: COLORS.line, color: rform.date ? COLORS.charcoal : COLORS.muted }} className="border rounded-lg px-3 py-2 text-sm outline-none" />
                  <input type="time" value={rform.clock} onChange={(e) => setRform({ ...rform, clock: e.target.value })} style={{ borderColor: COLORS.line, color: rform.clock ? COLORS.charcoal : COLORS.muted }} className="border rounded-lg px-3 py-2 text-sm outline-none" />
                  <input type="number" min="1" placeholder={t("seatsWanted")} value={rform.seatsNeeded} onChange={(e) => setRform({ ...rform, seatsNeeded: e.target.value })} style={{ borderColor: COLORS.line }} className="border rounded-lg px-3 py-2 text-sm outline-none col-span-2" />
                </div>
                <button onClick={() => requireAuth(postRiderRequest)} disabled={syncing} style={{ background: COLORS.night, color: "white" }} className="w-full rounded-lg py-2.5 text-sm font-bold disabled:opacity-50">
                  {t("postMyRequest")}
                </button>
              </div>
            )}
            {filteredVehicles.map((v) => {
              const Icon = VEHICLE_META[v.type].icon;
              const already = requests.find((r) => r.vehicleId === v.id && r.riderName === name && !["cancelled", "rejected"].includes(r.status));
              return (
                <div key={v.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div style={{ background: COLORS.night }} className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {v.ownerPhoto ? <img src={v.ownerPhoto} alt="" className="w-full h-full object-cover" /> : <Icon size={16} color="white" />}
                      </div>
                      <div>
                        <p style={{ color: COLORS.charcoal }} className="text-sm font-bold flex items-center gap-1">
                          {v.owner}
                          {getAvgRating(v.owner) && (
                            <button onClick={() => setViewingReviewsFor(v.owner)} style={{ color: COLORS.muted }} className="text-xs font-normal flex items-center gap-0.5">
                              <Star size={11} fill={COLORS.amber} color={COLORS.amber} /> {getAvgRating(v.owner).avg} ({getAvgRating(v.owner).count})
                            </button>
                          )}
                        </p>
                        <p style={{ color: COLORS.muted }} className="text-xs flex items-center gap-1"><Clock size={11} /> {v.time}</p>
                        {getReliability(v.owner) && (
                          <p style={{ color: getReliability(v.owner).pct >= 80 ? COLORS.teal : COLORS.coral }} className="text-xs font-semibold flex items-center gap-1 mt-0.5">
                            <ShieldCheck size={11} /> {getReliability(v.owner).pct}% reliable ({getReliability(v.owner).total} rides)
                          </p>
                        )}
                      </div>
                    </div>
                    <p style={{ color: COLORS.night }} className="text-sm font-bold">₹{v.price}</p>
                  </div>
                  {v.tags && Object.values(v.tags).some(Boolean) && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {v.tags.womenOnly && <span style={{ background: "#FBE9F0", color: "#C2185B" }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full">Women-only</span>}
                      {v.tags.nonSmoker && <span style={{ background: "#E4F3EF", color: COLORS.teal }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full">Non-smoker</span>}
                      {v.tags.ac && <span style={{ background: "#E7EEFB", color: "#3355AA" }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full">AC</span>}
                      {v.tags.luggage && <span style={{ background: "#FDF1DE", color: "#B4700C" }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full">Luggage space</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs mb-2" style={{ color: COLORS.charcoal }}>
                    <span className="font-semibold">{v.from}</span>
                    <span className="font-semibold">{v.to} <span style={{ color: COLORS.muted, fontWeight: 400 }}>(full route)</span></span>
                  </div>
                  <RouteLine compact stopCount={(v.stops || []).length} />
                  {v.stops && v.stops.length > 0 && !already && (
                    <div className="mt-2">
                      <label style={{ color: COLORS.muted }} className="text-[10px] font-semibold block mb-1">Aap kahan utrenge? (apna stop chuno)</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={getSelectedDest(v).name}
                          onChange={(e) => {
                            const stop = v.stops.find((s) => s.name === e.target.value);
                            const dest = stop ? { name: stop.name, price: stop.price } : { name: v.to, price: v.price };
                            setDestSelections((prev) => ({ ...prev, [v.id]: dest }));
                          }}
                          style={{ borderColor: COLORS.line, color: COLORS.charcoal }}
                          className="flex-1 border rounded-lg px-2 py-1.5 text-xs outline-none"
                        >
                          <option value={v.to}>{v.to} (Full route)</option>
                          {v.stops.map((s, i) => (
                            <option key={i} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <span style={{ background: "#FDF1DE", color: "#B4700C" }} className="text-xs font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                          Aapka fare: ₹{getSelectedDest(v).price}
                        </span>
                      </div>
                    </div>
                  )}
                  {v.stops && v.stops.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {v.stops.map((s, i) => (
                        <span key={i} style={{ background: "#F3EFE6", color: COLORS.charcoal }} className="text-[10px] px-2 py-0.5 rounded-full">
                          {s.name} · ₹{s.price}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-3">
                    <span style={{ color: COLORS.muted }} className="text-xs">{v.seats} {t("seatsOpen")}</span>
                    {already ? (
                      <Badge status={already.status} lang={lang} />
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
                        <button onClick={() => requireAuth(() => sendRequest(v))} disabled={syncing} style={{ background: COLORS.amber, color: COLORS.night }} className="text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                          {t("sendRequest")}
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
              <h3 style={{ color: COLORS.night }} className="text-sm font-bold mb-3">{t("myRequests")}</h3>
              <div className="space-y-2 mb-8">
                {myRequests.map((r) => {
                  const bookedVehicle = vehicles.find((v) => v.id === r.vehicleId);
                  const showContact = ["accepted", "completed"].includes(r.status) && bookedVehicle?.ownerPhone;
                  return (
                  <div key={r.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3">
                    <div className="flex justify-between items-center">
                      <span style={{ color: COLORS.charcoal }} className="text-sm">{r.from} <ArrowRight size={12} className="inline" /> {r.to} · {r.owner} · {r.seats || 1} seat{(r.seats || 1) > 1 ? "s" : ""}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => requireAuth(() => openChat(r.id, r.owner))} style={{ color: COLORS.muted, borderColor: COLORS.line }} className="relative border rounded-full p-1.5">
                          <MessageCircle size={14} />
                          {hasUnreadMessages(r.id) && <span style={{ background: COLORS.coral }} className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" />}
                        </button>
                        {(r.status === "pending" || r.status === "accepted") && (
                          <button onClick={() => requireAuth(() => cancelRequest(r.id))} style={{ color: COLORS.coral, borderColor: COLORS.line }} className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                            {t("cancel")}
                          </button>
                        )}
                        {r.status === "completed" && !hasReviewed(r.id) ? (
                          <button onClick={() => requireAuth(() => setActiveReview({ requestId: r.id, revieweeName: r.owner }))} style={{ background: COLORS.amber, color: COLORS.night }} className="text-xs font-bold px-2.5 py-1.5 rounded-lg">
                            {t("rateOwner")}
                          </button>
                        ) : (
                          <Badge status={r.status} lang={lang} />
                        )}
                      </div>
                    </div>
                    {showContact && (
                      <a href={`tel:${bookedVehicle.ownerPhone}`} style={{ color: COLORS.teal }} className="text-xs font-bold mt-2 inline-block">
                        📞 Call owner: {bookedVehicle.ownerPhone}
                      </a>
                    )}
                  </div>
                  );
                })}
              </div>
            </>
          )}

          {myRiderPosts.length > 0 && (
            <>
              <h3 style={{ color: COLORS.night }} className="text-sm font-bold mb-3">{t("myPostedRequests")}</h3>
              <div className="space-y-2">
                {myRiderPosts.map((p) => (
                  <div key={p.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3 flex justify-between items-center">
                    <span style={{ color: COLORS.charcoal }} className="text-sm">
                      {p.from} <ArrowRight size={12} className="inline" /> {p.to} · {p.seatsNeeded || 1} seat{(p.seatsNeeded || 1) > 1 ? "s" : ""}
                      {p.status === "matched" && p.ownerName ? ` · ${p.ownerName} ready hai!` : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      {p.status === "open" && (
                        <button onClick={() => requireAuth(() => cancelRiderPost(p.id))} style={{ color: COLORS.coral, borderColor: COLORS.line }} className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                          {t("cancel")}
                        </button>
                      )}
                      <Badge status={p.status} lang={lang} />
                    </div>
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
          <h2 style={{ color: COLORS.night }} className="text-lg font-bold mb-4">{t("postYourVehicle")}</h2>
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
              <LocationInput placeholder={t("from")} value={vform.from} onChange={(v) => setVform({ ...vform, from: v })} />
              <LocationInput placeholder={t("to")} value={vform.to} onChange={(v) => setVform({ ...vform, to: v })} />
              <input type="date" value={vform.date} onChange={(e) => setVform({ ...vform, date: e.target.value })} style={{ borderColor: COLORS.line, color: vform.date ? COLORS.charcoal : COLORS.muted }} className="border rounded-lg px-3 py-2 text-sm outline-none" />
              <input type="time" value={vform.clock} onChange={(e) => setVform({ ...vform, clock: e.target.value })} style={{ borderColor: COLORS.line, color: vform.clock ? COLORS.charcoal : COLORS.muted }} className="border rounded-lg px-3 py-2 text-sm outline-none" />
              <input type="number" placeholder={t("seats")} value={vform.seats} onChange={(e) => setVform({ ...vform, seats: e.target.value })} style={{ borderColor: COLORS.line }} className="border rounded-lg px-3 py-2 text-sm outline-none" />
              <input type="number" placeholder={t("pricePerSeat")} value={vform.price} onChange={(e) => setVform({ ...vform, price: e.target.value })} style={{ borderColor: COLORS.line }} className="border rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <p style={{ color: COLORS.muted }} className="text-xs mb-3">{t("postingFor")} <b style={{ color: COLORS.charcoal }}>{mode === "local" ? t("local") : t("longDistance")}</b> {t("modeChangeNote")}</p>

            <p style={{ color: COLORS.charcoal }} className="text-xs font-semibold mb-1.5">{t("routeType")}</p>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setVform({ ...vform, routeType: "direct" })}
                style={vform.routeType === "direct" ? { background: COLORS.night, color: "white" } : { background: "#F3EFE6", color: COLORS.muted }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                {t("direct")}
              </button>
              <button
                type="button"
                onClick={() => setVform({ ...vform, routeType: "multi" })}
                style={vform.routeType === "multi" ? { background: COLORS.night, color: "white" } : { background: "#F3EFE6", color: COLORS.muted }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                {t("multiStop")}
              </button>
            </div>

            {vform.routeType === "multi" && (
              <div className="mb-4">
                <p style={{ color: COLORS.muted }} className="text-xs mb-2">
                  {vform.from || t("from")} se {vform.to || t("to")} ke beech ke stops add karo, order mein, apna fare ke saath.
                </p>
                <div className="space-y-2 mb-2">
                  {vform.stops.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <LocationInput placeholder={`Stop ${i + 1} naam`} value={s.name} onChange={(v) => updateStop(i, "name", v)} />
                      </div>
                      <input
                        type="number"
                        placeholder="₹ fare"
                        value={s.price}
                        onChange={(e) => updateStop(i, "price", e.target.value)}
                        style={{ borderColor: COLORS.line }}
                        className="w-20 border rounded-lg px-2 py-2 text-sm outline-none"
                      />
                      <button type="button" onClick={() => removeStop(i)} style={{ color: COLORS.coral }}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addStop} style={{ color: COLORS.night, borderColor: COLORS.line }} className="text-xs font-semibold border rounded-lg px-3 py-1.5">
                  {t("addStop")}
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { key: "womenOnly", label: "Women-only" },
                { key: "nonSmoker", label: "Non-smoker" },
                { key: "ac", label: "AC" },
                { key: "luggage", label: "Luggage space" },
              ].map((tag) => (
                <button
                  key={tag.key}
                  type="button"
                  onClick={() => setVform({ ...vform, tags: { ...vform.tags, [tag.key]: !vform.tags[tag.key] } })}
                  style={vform.tags[tag.key] ? { background: COLORS.teal, color: "white" } : { background: "#F3EFE6", color: COLORS.muted }}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-full"
                >
                  {tag.label}
                </button>
              ))}
            </div>
            <button onClick={() => requireAuth(postVehicle)} disabled={syncing} style={{ background: COLORS.amber, color: COLORS.night }} className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold disabled:opacity-50">
              {syncing ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {t("postVehicle")}
            </button>
          </div>

          <h3 style={{ color: COLORS.night }} className="text-sm font-bold mb-3">{t("ridersLookingForRide")}</h3>
          <div className="space-y-2 mb-8">
            {openRiderPostsForOwner.length === 0 && <p style={{ color: COLORS.muted }} className="text-sm">{t("noRidersSearching")}</p>}
            {openRiderPostsForOwner.map((p) => {
              const Icon = VEHICLE_META[p.type]?.icon || Car;
              return (
                <div key={p.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div style={{ background: COLORS.night }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                      <Icon size={14} color="white" />
                    </div>
                    <div>
                      <p style={{ color: COLORS.charcoal }} className="text-sm font-semibold flex items-center gap-1">
                        {p.riderName}
                        {getAvgRating(p.riderName) && (
                          <button onClick={() => setViewingReviewsFor(p.riderName)} style={{ color: COLORS.muted }} className="text-xs font-normal flex items-center gap-0.5">
                            <Star size={11} fill={COLORS.amber} color={COLORS.amber} /> {getAvgRating(p.riderName).avg}
                          </button>
                        )}
                      </p>
                      <p style={{ color: COLORS.muted }} className="text-xs">{p.from} <ArrowRight size={11} className="inline" /> {p.to} · {p.time} · {p.seatsNeeded || 1} seat{(p.seatsNeeded || 1) > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {p.status === "open" ? (
                    <button onClick={() => requireAuth(() => offerRide(p.id))} disabled={syncing} style={{ background: COLORS.amber, color: COLORS.night }} className="text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                      {t("offerRide")}
                    </button>
                  ) : (
                    <Badge status={p.status} lang={lang} />
                  )}
                </div>
              );
            })}
          </div>

          <h3 style={{ color: COLORS.night }} className="text-sm font-bold mb-3">{t("incomingRequests")}</h3>
          <div className="space-y-2 mb-8">
            {incoming.length === 0 && <p style={{ color: COLORS.muted }} className="text-sm">{t("noRequestsYet")}</p>}
            {incoming.map((r) => (
              <div key={r.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div style={{ background: COLORS.night }} className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                      {r.riderPhoto ? <img src={r.riderPhoto} alt="" className="w-full h-full object-cover" /> : <User size={14} color="white" />}
                    </div>
                    <div>
                      <p style={{ color: COLORS.charcoal }} className="text-sm font-semibold flex items-center gap-1">
                        {r.riderName}
                        {getAvgRating(r.riderName) && (
                          <button onClick={() => setViewingReviewsFor(r.riderName)} style={{ color: COLORS.muted }} className="text-xs font-normal flex items-center gap-0.5">
                            <Star size={11} fill={COLORS.amber} color={COLORS.amber} /> {getAvgRating(r.riderName).avg}
                          </button>
                        )}
                      </p>
                      <p style={{ color: COLORS.muted }} className="text-xs">{r.from} <ArrowRight size={11} className="inline" /> {r.to} · {r.seats || 1} seat{(r.seats || 1) > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                {r.status === "pending" ? (
                  <div className="flex gap-2">
                    <button onClick={() => requireAuth(() => openChat(r.id, r.riderName))} style={{ color: COLORS.muted, borderColor: COLORS.line }} className="relative border rounded-full p-1.5">
                      <MessageCircle size={14} />
                      {hasUnreadMessages(r.id) && <span style={{ background: COLORS.coral }} className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" />}
                    </button>
                    <button onClick={() => requireAuth(() => respond(r.id, "accepted"))} disabled={syncing} style={{ background: COLORS.teal }} className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50"><Check size={15} color="white" /></button>
                    <button onClick={() => requireAuth(() => respond(r.id, "rejected"))} disabled={syncing} style={{ background: COLORS.coral }} className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50"><X size={15} color="white" /></button>
                  </div>
                ) : r.status === "accepted" ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => requireAuth(() => openChat(r.id, r.riderName))} style={{ color: COLORS.muted, borderColor: COLORS.line }} className="relative border rounded-full p-1.5">
                      <MessageCircle size={14} />
                      {hasUnreadMessages(r.id) && <span style={{ background: COLORS.coral }} className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" />}
                    </button>
                    <button onClick={() => requireAuth(() => respond(r.id, "completed"))} disabled={syncing} style={{ background: COLORS.teal, color: "white" }} className="text-xs font-bold px-2.5 py-1.5 rounded-lg disabled:opacity-50">
                      {t("rideDone")}
                    </button>
                    <button onClick={() => requireAuth(() => respond(r.id, "noshow"))} disabled={syncing} style={{ background: COLORS.coral, color: "white" }} className="text-xs font-bold px-2.5 py-1.5 rounded-lg disabled:opacity-50">
                      {t("noShow")}
                    </button>
                  </div>
                ) : r.status === "completed" && !hasReviewed(r.id) ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => requireAuth(() => openChat(r.id, r.riderName))} style={{ color: COLORS.muted, borderColor: COLORS.line }} className="relative border rounded-full p-1.5">
                      <MessageCircle size={14} />
                      {hasUnreadMessages(r.id) && <span style={{ background: COLORS.coral }} className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" />}
                    </button>
                    <button onClick={() => requireAuth(() => setActiveReview({ requestId: r.id, revieweeName: r.riderName }))} style={{ background: COLORS.amber, color: COLORS.night }} className="text-xs font-bold px-2.5 py-1.5 rounded-lg">
                      {t("rateRider")}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => requireAuth(() => openChat(r.id, r.riderName))} style={{ color: COLORS.muted, borderColor: COLORS.line }} className="relative border rounded-full p-1.5">
                      <MessageCircle size={14} />
                      {hasUnreadMessages(r.id) && <span style={{ background: COLORS.coral }} className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" />}
                    </button>
                    <Badge status={r.status} lang={lang} />
                  </div>
                )}
                </div>
                {["accepted", "completed"].includes(r.status) && r.riderPhone && (
                  <a href={`tel:${r.riderPhone}`} style={{ color: COLORS.teal }} className="text-xs font-bold mt-2 inline-block">
                    📞 Call rider: {r.riderPhone}
                  </a>
                )}
              </div>
            ))}
          </div>

          <h3 style={{ color: COLORS.night }} className="text-sm font-bold mb-3">{t("myPostedVehicles")}</h3>
          <div className="space-y-2">
            {vehicles.filter((v) => v.owner === name).map((v) => (
              <div key={v.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3 text-sm flex justify-between items-center">
                <span style={{ color: COLORS.charcoal }}>{v.from} → {v.to} · {v.time}</span>
                <div className="flex items-center gap-3">
                  <span style={{ color: v.seats === 0 ? COLORS.coral : COLORS.muted }} className="font-semibold">
                    {v.seats} of {v.totalSeats || v.seats} {t("seatsLeft")} · ₹{v.price}
                  </span>
                  <button onClick={() => requireAuth(() => deleteVehicle(v.id))} style={{ color: COLORS.coral }} className="text-xs font-semibold">
                    {t("remove")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === "privacy" && (
        <div className="p-6 max-w-2xl mx-auto">
          <button onClick={() => setScreen("landing")} style={{ color: COLORS.muted }} className="text-sm mb-4">← Back</button>
          <h2 style={{ color: COLORS.night }} className="text-xl font-bold mb-1">Privacy Policy</h2>
          <p style={{ color: COLORS.muted }} className="text-xs mb-6">Last updated: September 2026</p>

          <div style={{ color: COLORS.charcoal }} className="text-sm space-y-4 leading-relaxed">
            <p>
              Margshri ("we", "the app") connects riders and vehicle owners so they can share rides. This policy explains
              what information we collect, why, and how you can control it.
            </p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">What we collect</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><b>From Google Sign-In:</b> your name, email address, and profile photo.</li>
              <li><b>Phone number:</b> only if you choose to add one — it's shown to the other party only after a booking is accepted.</li>
              <li><b>Ride/vehicle details:</b> pickup and drop locations, dates, times, prices, and seats you post or search for.</li>
              <li><b>Chat messages</b> you send within the app to coordinate a ride.</li>
              <li><b>Ratings, reviews, and complaints</b> you submit about other users.</li>
              <li><b>Location text</b> you type is sent to OpenStreetMap's free search service (Nominatim) to show address suggestions — no background location tracking happens; we only use what you type.</li>
            </ul>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">How we use it</h3>
            <p>
              Solely to run the app's core purpose: matching riders with vehicle owners, letting you communicate, and
              building trust through ratings/reliability scores. We do not sell your data, and we do not show ads.
            </p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Where it's stored</h3>
            <p>
              All data is stored on Google Firebase (Firestore Database and Firebase Authentication), a cloud service
              operated by Google. Firebase applies its own security and infrastructure protections. We do not run our
              own separate servers.
            </p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Who can see what</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Your name, photo, and posted rides/requests are visible to anyone browsing the app (this is needed for the ride-matching feature to work).</li>
              <li>Your phone number is only revealed to the specific rider/owner once a booking between you is accepted.</li>
              <li>The app's admin can view all bookings, vehicles, and complaints to resolve disputes and keep the platform safe.</li>
            </ul>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Your choices</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You can remove your own vehicle listings or open ride requests at any time from your dashboard.</li>
              <li>You can cancel a booking you made.</li>
              <li>To request full deletion of your account and associated data, email the admin (see Contact below) from the same email you used to log in.</li>
            </ul>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Children</h3>
            <p>This app is not intended for anyone under 18 without a parent or guardian's involvement.</p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Changes</h3>
            <p>We may update this policy as the app evolves. Continuing to use the app after a change means you accept the update.</p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Contact</h3>
            <p>Questions or deletion requests: <a href={`mailto:${ADMIN_EMAILS[0]}`} style={{ color: COLORS.teal }} className="font-semibold">{ADMIN_EMAILS[0]}</a></p>
          </div>
        </div>
      )}

      {screen === "terms" && (
        <div className="p-6 max-w-2xl mx-auto">
          <button onClick={() => setScreen("landing")} style={{ color: COLORS.muted }} className="text-sm mb-4">← Back</button>
          <h2 style={{ color: COLORS.night }} className="text-xl font-bold mb-1">Terms of Service</h2>
          <p style={{ color: COLORS.muted }} className="text-xs mb-6">Last updated: September 2026</p>

          <div style={{ color: COLORS.charcoal }} className="text-sm space-y-4 leading-relaxed">
            <p>
              By using Margshri, you agree to these terms. Please read them along with our Privacy Policy and Safety
              Disclaimer.
            </p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">What Margshri is</h3>
            <p>
              Margshri is a platform that lets vehicle owners post rides (bike, car, or bus — local or long-distance)
              and lets riders find and request seats, or post their own ride requests. We only provide the matching,
              chat, and rating tools — the actual ride, any payment, and the arrangement between rider and owner
              happens entirely outside the app, directly between the two of you.
            </p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">No identity verification</h3>
            <p>
              We do not verify anyone's government ID, driving license, vehicle documents, or background. Names,
              phone numbers, and photos are exactly as the user entered them. Always verify who you're meeting
              yourself before a ride.
            </p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Payments</h3>
            <p>
              Margshri does not process, hold, or guarantee any payment. Any fare shown in the app is only what the
              vehicle owner has stated — the actual payment (cash, UPI, etc.) is a private matter between rider and
              owner.
            </p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Your responsibilities</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Give accurate information when posting a vehicle, a request, or your profile.</li>
              <li>Behave respectfully towards other users — harassment, abuse, or unsafe driving is not tolerated.</li>
              <li>Do not use the app for any illegal purpose.</li>
              <li>You must be 18 or older, or use the app with a parent/guardian's involvement.</li>
            </ul>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Reporting & enforcement</h3>
            <p>
              You can report a user via the flag icon in chat. The admin may investigate, warn, or permanently block
              any account found violating these terms or behaving unsafely, at their sole discretion.
            </p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Limitation of liability</h3>
            <p>
              Margshri is provided "as is". We are not liable for any accident, injury, loss, theft, dispute,
              financial loss, or damage arising from a ride, a payment, or any interaction between users. You use
              this app, and any ride arranged through it, entirely at your own risk.
            </p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Changes to the service</h3>
            <p>We may add, change, or remove features at any time, and may suspend the service without notice.</p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Governing law</h3>
            <p>These terms are governed by the laws of India.</p>

            <h3 style={{ color: COLORS.night }} className="font-bold text-base mt-5">Contact</h3>
            <p>Questions about these terms: <a href={`mailto:${ADMIN_EMAILS[0]}`} style={{ color: COLORS.teal }} className="font-semibold">{ADMIN_EMAILS[0]}</a></p>
          </div>
        </div>
      )}

      {screen === "admin" && isAdmin && (
        <div className="p-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <LayoutDashboard size={20} color={COLORS.night} />
            <h2 style={{ color: COLORS.night }} className="text-lg font-bold">Admin Panel</h2>
          </div>

          <div className="flex gap-2 mb-5 flex-wrap">
            {[
              { key: "overview", label: "Overview" },
              { key: "vehicles", label: `Vehicles (${vehicles.length})` },
              { key: "bookings", label: `Bookings (${requests.length})` },
              { key: "complaints", label: `Complaints (${complaints.filter((c) => c.status === "open").length})` },
              { key: "blocked", label: `Blocked (${blockedUsers.length})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setAdminTab(t.key)}
                style={adminTab === t.key ? { background: COLORS.night, color: "white" } : { background: "#F3EFE6", color: COLORS.muted }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                {t.label}
              </button>
            ))}
          </div>

          {adminTab === "overview" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Total vehicles", value: vehicles.length },
                { label: "Total bookings", value: requests.length },
                { label: "Open rider requests", value: riderPosts.filter((p) => p.status === "open").length },
                { label: "Open complaints", value: complaints.filter((c) => c.status === "open").length },
                { label: "Blocked users", value: blockedUsers.length },
                { label: "Total reviews", value: reviews.length },
              ].map((s, i) => (
                <div key={i} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl p-4 text-center">
                  <p style={{ color: COLORS.night }} className="text-2xl font-bold">{s.value}</p>
                  <p style={{ color: COLORS.muted }} className="text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {adminTab === "vehicles" && (
            <div>
              {vehicles.length > 0 && (
                <button onClick={clearAllVehicles} style={{ color: COLORS.coral, borderColor: COLORS.line }} className="border rounded-lg px-3 py-1.5 text-xs font-semibold mb-3">
                  🗑 Clear All Vehicles
                </button>
              )}
              <div className="space-y-2">
                {vehicles.length === 0 && <p style={{ color: COLORS.muted }} className="text-sm">Koi vehicle nahi hai.</p>}
                {vehicles.map((v) => (
                  <div key={v.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3 flex justify-between items-center">
                    <div>
                      <p style={{ color: COLORS.charcoal }} className="text-sm font-semibold">{v.owner} {v.ownerPhone && <span style={{ color: COLORS.muted }} className="font-normal">· {v.ownerPhone}</span>}</p>
                      <p style={{ color: COLORS.muted }} className="text-xs">{v.from} → {v.to} · {v.time} · {v.seats} of {v.totalSeats || v.seats} seats · {v.mode}</p>
                    </div>
                    <button onClick={() => deleteVehicle(v.id)} style={{ color: COLORS.coral, borderColor: COLORS.line }} className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold shrink-0">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === "bookings" && (
            <div>
              {requests.length > 0 && (
                <button onClick={clearAllBookings} style={{ color: COLORS.coral, borderColor: COLORS.line }} className="border rounded-lg px-3 py-1.5 text-xs font-semibold mb-3">
                  🗑 Clear All Bookings
                </button>
              )}
              <div className="space-y-2">
                {requests.length === 0 && <p style={{ color: COLORS.muted }} className="text-sm">Koi booking nahi hai.</p>}
                {requests.map((r) => (
                  <div key={r.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3 flex justify-between items-center">
                    <div>
                      <p style={{ color: COLORS.charcoal }} className="text-sm font-semibold">{r.riderName} → {r.owner}</p>
                      <p style={{ color: COLORS.muted }} className="text-xs">{r.from} → {r.to} · {r.seats || 1} seat(s)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={r.status} lang={lang} />
                      {(r.status === "pending" || r.status === "accepted") && (
                        <button onClick={() => cancelRequest(r.id)} style={{ color: COLORS.coral, borderColor: COLORS.line }} className="border rounded-lg px-2 py-1 text-xs font-semibold">
                          Cancel
                        </button>
                      )}
                      <button onClick={() => deleteRequestAdmin(r.id)} style={{ color: COLORS.coral, borderColor: COLORS.line }} className="border rounded-lg px-2 py-1 text-xs font-semibold">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === "complaints" && (
            <div className="space-y-2">
              {complaints.length > 0 && (
                <button onClick={clearAllComplaints} style={{ color: COLORS.coral, borderColor: COLORS.line }} className="border rounded-lg px-3 py-1.5 text-xs font-semibold mb-1">
                  🗑 Clear All Complaints
                </button>
              )}
              {complaints.length === 0 && <p style={{ color: COLORS.muted }} className="text-sm">Koi complaint nahi hai.</p>}
              {complaints
                .slice()
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                .map((c) => (
                  <div key={c.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3">
                    <div className="flex justify-between items-start mb-1">
                      <p style={{ color: COLORS.charcoal }} className="text-sm font-semibold">{c.reporterName} ne {c.aboutName} ke baare mein report kiya</p>
                      <span
                        style={c.status === "open" ? { background: "#FBE9E7", color: COLORS.coral } : { background: "#E4F3EF", color: COLORS.teal }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0"
                      >
                        {c.status}
                      </span>
                    </div>
                    <p style={{ color: COLORS.muted }} className="text-xs mb-2">{c.message}</p>

                    <div className="flex flex-wrap gap-3 mb-2">
                      <div style={{ background: "#F3EFE6" }} className="rounded-lg px-2.5 py-1.5">
                        <p style={{ color: COLORS.muted }} className="text-[10px] font-semibold mb-0.5">Reporter: {c.reporterName}</p>
                        <div className="flex gap-2">
                          {c.reporterPhone && <a href={`tel:${c.reporterPhone}`} style={{ color: COLORS.teal }} className="text-xs font-bold">📞 {c.reporterPhone}</a>}
                          {c.reporterEmail && <a href={`mailto:${c.reporterEmail}`} style={{ color: COLORS.teal }} className="text-xs font-bold">✉️ Email</a>}
                          {!c.reporterPhone && !c.reporterEmail && <span style={{ color: COLORS.muted }} className="text-xs">Contact nahi diya</span>}
                        </div>
                      </div>
                      <div style={{ background: "#F3EFE6" }} className="rounded-lg px-2.5 py-1.5">
                        <p style={{ color: COLORS.muted }} className="text-[10px] font-semibold mb-0.5">Jiski complaint hai: {c.aboutName}</p>
                        {c.aboutPhone ? (
                          <a href={`tel:${c.aboutPhone}`} style={{ color: COLORS.teal }} className="text-xs font-bold">📞 {c.aboutPhone}</a>
                        ) : (
                          <span style={{ color: COLORS.muted }} className="text-xs">Phone number nahi mila</span>
                        )}
                      </div>
                    </div>

                    {c.status === "open" ? (
                      <>
                        <textarea
                          value={resolutionDrafts[c.id] ?? ""}
                          onChange={(e) => setResolutionDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder="Resolution note likho (kya kiya gaya, optional)..."
                          style={{ borderColor: COLORS.line }}
                          className="w-full border rounded-lg px-3 py-2 text-xs outline-none mb-2 resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => resolveComplaint(c.id, resolutionDrafts[c.id])} style={{ background: COLORS.teal, color: "white" }} className="text-xs font-bold px-2.5 py-1.5 rounded-lg">
                            Mark Resolved
                          </button>
                          {c.aboutPhone && (
                            <button
                              onClick={() => {
                                setBlockEmailInput("");
                                setAdminTab("blocked");
                              }}
                              style={{ color: COLORS.coral, borderColor: COLORS.line }}
                              className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            >
                              Block karne jaao →
                            </button>
                          )}
                          <button onClick={() => deleteComplaint(c.id)} style={{ color: COLORS.muted, borderColor: COLORS.line }} className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                            Delete
                          </button>
                        </div>
                      </>
                    ) : (
                      <div>
                        {c.resolutionNote && (
                          <p style={{ color: COLORS.charcoal, background: "#E4F3EF" }} className="text-xs rounded-lg px-3 py-2 mb-2">
                            <b>Resolution:</b> {c.resolutionNote}
                          </p>
                        )}
                        <button onClick={() => deleteComplaint(c.id)} style={{ color: COLORS.muted, borderColor: COLORS.line }} className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {adminTab === "blocked" && (
            <div>
              <div style={{ borderColor: COLORS.line }} className="bg-white border rounded-2xl p-4 mb-5">
                <p style={{ color: COLORS.charcoal }} className="text-sm font-bold mb-3">Naya user block karo</p>
                <input
                  type="email"
                  placeholder="user@email.com"
                  value={blockEmailInput}
                  onChange={(e) => setBlockEmailInput(e.target.value)}
                  style={{ borderColor: COLORS.line }}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none mb-2"
                />
                <input
                  placeholder="Reason (optional)"
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  style={{ borderColor: COLORS.line }}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none mb-3"
                />
                <button onClick={blockUserByEmail} style={{ background: COLORS.coral, color: "white" }} className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold">
                  <Ban size={14} /> Block user
                </button>
              </div>
              <div className="space-y-2">
                {blockedUsers.length === 0 && <p style={{ color: COLORS.muted }} className="text-sm">Koi bhi block nahi hai.</p>}
                {blockedUsers.map((b) => (
                  <div key={b.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl px-4 py-3 flex justify-between items-center">
                    <div>
                      <p style={{ color: COLORS.charcoal }} className="text-sm font-semibold">{b.id}</p>
                      <p style={{ color: COLORS.muted }} className="text-xs">{b.reason}</p>
                    </div>
                    <button onClick={() => unblockUser(b.id)} style={{ color: COLORS.teal, borderColor: COLORS.line }} className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeChat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(27,42,74,0.4)" }} onClick={() => setActiveChat(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.sand }} className="w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl flex flex-col">
            <div style={{ background: COLORS.night }} className="flex items-center justify-between px-4 py-3 rounded-t-2xl">
              <p className="text-white text-sm font-bold">{activeChat.otherName}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveReport({ requestId: activeChat.requestId, aboutName: activeChat.otherName })} className="text-white" title="Report / Complaint">
                  <Flag size={16} />
                </button>
                <button onClick={() => setActiveChat(null)} className="text-white">
                  <X size={18} />
                </button>
              </div>
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

      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(27,42,74,0.4)" }} onClick={() => setActiveReview(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.sand }} className="w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5">
            <p style={{ color: COLORS.night }} className="text-sm font-bold mb-1">Rate {activeReview.revieweeName}</p>
            <p style={{ color: COLORS.muted }} className="text-xs mb-4">Aapka feedback doosron ko sahi decision lene mein madad karta hai.</p>
            <div className="flex justify-center mb-4">
              <StarRating value={reviewRating} onChange={setReviewRating} size={28} />
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Kuch likhna chahenge? (optional)"
              style={{ borderColor: COLORS.line }}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none mb-4 resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={() => setActiveReview(null)} style={{ borderColor: COLORS.line, color: COLORS.muted }} className="flex-1 border rounded-lg py-2.5 text-sm font-bold">
                Cancel
              </button>
              <button onClick={submitReview} style={{ background: COLORS.amber, color: COLORS.night }} className="flex-1 rounded-lg py-2.5 text-sm font-bold">
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(27,42,74,0.4)" }} onClick={() => setShowPhoneModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.sand }} className="w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5">
            <p style={{ color: COLORS.night }} className="text-sm font-bold mb-1">Apna mobile number add karo</p>
            <p style={{ color: COLORS.muted }} className="text-xs mb-4">Ye sirf tab dikhega jab aapki booking confirm (accepted) ho jaaye — taaki dono log seedha baat kar sakein.</p>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="e.g. 98765 43210"
              style={{ borderColor: COLORS.line }}
              className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowPhoneModal(false)} style={{ borderColor: COLORS.line, color: COLORS.muted }} className="flex-1 border rounded-lg py-2.5 text-sm font-bold">
                Cancel
              </button>
              <button onClick={savePhone} style={{ background: COLORS.amber, color: COLORS.night }} className="flex-1 rounded-lg py-2.5 text-sm font-bold">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showIOSHint && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(27,42,74,0.4)" }} onClick={() => setShowIOSHint(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.sand }} className="w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5">
            <p style={{ color: COLORS.night }} className="text-sm font-bold mb-3">iPhone par install karne ke liye</p>
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2">
                <span style={{ background: COLORS.amber, color: COLORS.night }} className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <p style={{ color: COLORS.charcoal }} className="text-sm">Neeche Share icon (⬆️ box) par tap karo</p>
              </div>
              <div className="flex items-start gap-2">
                <span style={{ background: COLORS.amber, color: COLORS.night }} className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <p style={{ color: COLORS.charcoal }} className="text-sm">Scroll karke "Add to Home Screen" dhundo aur tap karo</p>
              </div>
              <div className="flex items-start gap-2">
                <span style={{ background: COLORS.amber, color: COLORS.night }} className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <p style={{ color: COLORS.charcoal }} className="text-sm">Top-right "Add" dabao — Margshri icon home screen par aa jayega</p>
              </div>
            </div>
            <button onClick={() => setShowIOSHint(false)} style={{ background: COLORS.night, color: "white" }} className="w-full rounded-lg py-2.5 text-sm font-bold">
              Samajh gaya
            </button>
          </div>
        </div>
      )}

      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(27,42,74,0.4)" }} onClick={() => setActiveReport(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.sand }} className="w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5">
            <p style={{ color: COLORS.night }} className="text-sm font-bold mb-1">Report / Complaint: {activeReport.aboutName}</p>
            <p style={{ color: COLORS.muted }} className="text-xs mb-4">Kya problem hui, bataiye. Admin isko dekhega aur zaroorat pade to action lega.</p>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Apni complaint likhiye..."
              style={{ borderColor: COLORS.line }}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none mb-4 resize-none"
              rows={4}
            />
            <div className="flex gap-2">
              <button onClick={() => setActiveReport(null)} style={{ borderColor: COLORS.line, color: COLORS.muted }} className="flex-1 border rounded-lg py-2.5 text-sm font-bold">
                Cancel
              </button>
              <button onClick={submitReport} style={{ background: COLORS.coral, color: "white" }} className="flex-1 rounded-lg py-2.5 text-sm font-bold">
                Submit Complaint
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingReviewsFor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(27,42,74,0.4)" }} onClick={() => setViewingReviewsFor(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.sand }} className="w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl flex flex-col">
            <div style={{ background: COLORS.night }} className="flex items-center justify-between px-4 py-3 rounded-t-2xl">
              <p className="text-white text-sm font-bold">
                {viewingReviewsFor}'s reviews {getAvgRating(viewingReviewsFor) && `· ⭐ ${getAvgRating(viewingReviewsFor).avg} (${getAvgRating(viewingReviewsFor).count})`}
              </p>
              <button onClick={() => setViewingReviewsFor(null)} className="text-white">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-3 p-4 overflow-y-auto" style={{ maxHeight: 400, minHeight: 120 }}>
              {reviews.filter((r) => r.revieweeName === viewingReviewsFor).length === 0 && (
                <p style={{ color: COLORS.muted }} className="text-xs text-center py-6">Abhi koi review nahi hai.</p>
              )}
              {reviews
                .filter((r) => r.revieweeName === viewingReviewsFor)
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                .map((r) => (
                  <div key={r.id} style={{ borderColor: COLORS.line }} className="bg-white border rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <p style={{ color: COLORS.charcoal }} className="text-sm font-semibold">{r.raterName}</p>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={12} fill={n <= r.rating ? COLORS.amber : "none"} color={n <= r.rating ? COLORS.amber : COLORS.line} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p style={{ color: COLORS.muted }} className="text-xs">{r.comment}</p>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {(showSafetyModal || (user && !safetyAcknowledged)) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(27,42,74,0.6)" }}>
          <div style={{ background: COLORS.sand }} className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={22} color={COLORS.coral} />
              <p style={{ color: COLORS.night }} className="text-base font-bold">Safety & Disclaimer</p>
            </div>
            <div className="space-y-3 mb-5">
              <p style={{ color: COLORS.charcoal }} className="text-sm">
                Margshri sirf logon ko ek dusre se <b>connect</b> karta hai — hum ID verify (KYC), background check, ya koi bhi safety check khud nahi karte.
              </p>
              <ul style={{ color: COLORS.charcoal }} className="text-sm list-disc pl-5 space-y-1.5">
                <li>Naam, photo, aur phone number sabhi <b>self-declared</b> hain — inki hamne verification nahi ki hai.</li>
                <li>Payment app ke bahar (cash/UPI seedha) hoti hai — Margshri kisi bhi payment ko handle nahi karta.</li>
                <li>Ride se pehle khud dusre insaan ki identity confirm karo, aur public/safe jagah pe milna prefer karo.</li>
                <li>Kisi bhi tarah ki galat behavior, harassment, ya safety issue ho to turant <b>chat ke andar 🚩 flag icon</b> se report karo.</li>
                <li>Margshri (aur iske admin) kisi bhi dispute, nuksaan, ya ghatna ke liye <b>zimmedar nahi</b> hain — ye app apni risk par use karo.</li>
              </ul>
              <p style={{ color: COLORS.muted }} className="text-xs">
                Agar aap 18 saal se kam umar ke hain, kripya kisi bade (guardian) ke bina is app ka use na karein.
              </p>
            </div>
            {user && !safetyAcknowledged ? (
              <button onClick={acknowledgeSafety} style={{ background: COLORS.night, color: "white" }} className="w-full rounded-lg py-3 text-sm font-bold">
                {t("understood")}
              </button>
            ) : (
              <button onClick={() => setShowSafetyModal(false)} style={{ background: COLORS.night, color: "white" }} className="w-full rounded-lg py-3 text-sm font-bold">
                {t("close")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
