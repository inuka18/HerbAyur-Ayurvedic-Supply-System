import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../../api";
import "./Notifications.css";

// Highlight key parts of a notification message (receipt numbers, names, ratings)
function highlightMessage(message) {
  // Patterns to highlight
  const patterns = [
    { regex: /(#HA-\d+)/g,           cls: "notif-hl-receipt"  }, // receipt numbers
    { regex: /(\d+[⭐★])/g,          cls: "notif-hl-rating"   }, // star ratings
    { regex: /(Rs\s[\d,]+)/g,        cls: "notif-hl-amount"   }, // amounts
    { regex: /"([^"]+)"/g,           cls: "notif-hl-name"     }, // quoted names
    { regex: /(Confirmed|Processing|Delivered|Approved|Rejected|Pending)/g, cls: "notif-hl-status" },
  ];

  // Split message into highlighted parts
  let parts = [{ text: message, highlight: null }];

  patterns.forEach(({ regex, cls }) => {
    parts = parts.flatMap(part => {
      if (part.highlight) return [part]; // already highlighted
      const segments = [];
      let last = 0;
      let match;
      const re = new RegExp(regex.source, regex.flags);
      while ((match = re.exec(part.text)) !== null) {
        if (match.index > last) segments.push({ text: part.text.slice(last, match.index), highlight: null });
        segments.push({ text: match[0], highlight: cls });
        last = match.index + match[0].length;
      }
      if (last < part.text.length) segments.push({ text: part.text.slice(last), highlight: null });
      return segments.length > 0 ? segments : [part];
    });
  });

  return parts.map((p, i) =>
    p.highlight
      ? <span key={i} className={p.highlight}>{p.text}</span>
      : <span key={i}>{p.text}</span>
  );
}

// Map notification type to destination path + tab
function getNavTarget(notification) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;
  const msg  = notification.message || "";

  switch (notification.type) {
    case "new_supplier":
      // Could be: new supplier registration, warning removed, company name change, profile change
      if (role === "admin") {
        if (msg.includes("company name change") || msg.includes("submitted"))
          return { path: "/admin", tab: "suppliers" };
        if (msg.includes("Warning") || msg.includes("warning"))
          return null; // just informational
        return { path: "/admin", tab: "suppliers" };
      }
      return null;

    case "new_customer":
      return role === "admin" ? { path: "/admin", tab: "overview" } : null;

    case "supplier_approved":
    case "supplier_rejected":
      return role === "supplier" ? { path: "/supplier-dashboard", tab: "marketplace" } : null;

    case "offer_received":
    case "request_update":
      return { path: "/customer-dashboard", tab: "offers" };

    case "offer_accepted":
      return { path: "/supplier-dashboard", tab: "marketplace" };

    case "order_confirmed":
      if (role === "supplier") return { path: "/supplier-dashboard", tab: "orders" };
      return { path: "/customer-dashboard", tab: "orders" };

    case "order_status_update":
      if (role === "supplier") {
        // COD payment marked by customer — go to payments to confirm
        if (msg.includes("COD") || msg.includes("cash") || msg.includes("Confirm"))
          return { path: "/supplier-dashboard", tab: "payments" };
        // Customer confirmed delivery
        return { path: "/supplier-dashboard", tab: "orders" };
      }
      // Customer: order status update or COD confirmed by supplier
      if (msg.includes("COD") || msg.includes("confirmed receipt"))
        return { path: "/customer-dashboard", tab: "payments" };
      return { path: "/customer-dashboard", tab: "orders" };

    case "feedback_received":
      return { path: "/supplier-dashboard", tab: "feedbacks" };

    case "contact_message":
      return { path: "/admin", tab: "messages" };

    default:
      return null;
  }
}

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const token = localStorage.getItem("token");

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${API_BASE}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id) => {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    fetchNotifications();
  };

  const markAllRead = async () => {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    fetchNotifications();
  };

  const handleClick = async (n) => {
    if (!n.read) await markRead(n._id);
    const target = getNavTarget(n);
    setOpen(false);
    if (target) navigate(target.path, { state: { tab: target.tab } });
  };

  const unread = notifications.filter(n => !n.read).length;

  if (!token) return null;

  return (
    <div className="notif-wrapper" ref={ref}>
      <button className="notif-bell" onClick={() => setOpen(o => !o)}>
        <Bell size={20}/>
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {unread > 0 && <button onClick={markAllRead}>Mark all read</button>}
          </div>

          {notifications.length === 0
            ? <div className="notif-empty">No notifications yet</div>
            : <div className="notif-list">{notifications.map(n => {
                const target = getNavTarget(n);
                return (
                  <div
                    key={n._id}
                    className={`notif-item ${n.read ? "read" : "unread"} ${target ? "notif-clickable" : ""}`}
                    onClick={() => handleClick(n)}>
                    <p>{highlightMessage(n.message)}</p>
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                );
              })}
            </div>
          }
        </div>
      )}
    </div>
  );
}

export default Notifications;
