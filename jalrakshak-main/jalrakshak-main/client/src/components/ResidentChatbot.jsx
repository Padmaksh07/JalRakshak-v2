/**
 * ResidentChatbot.jsx  — styled to match original light theme
 * Floating chat widget powered by Gemini (/api/gemini/chat).
 * Supports English, Hindi, Assamese.
 */
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SUGGESTED = [
  "Is it safe to drink tap water?",
  "এই পানী খাব পাৰিনে?",
  "पानी कब सुरक्षित होगा?",
  "What diseases come from flood water?",
];

export default function ResidentChatbot({ zoneData }) {
  const [open,    setOpen]    = useState(false);
  const [history, setHistory] = useState([
    { role:"assistant", text:"Hello! I'm JalRakshak AI. Ask me about water safety in English, हिंदी, or অসমীয়া. 🌊" }
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [history, open]);

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const newHist = [...history, { role:"user", text:msg }];
    setHistory(newHist);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/gemini/chat`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ message:msg, zoneData:zoneData||null, history:newHist.slice(-8) }),
      });
      const data = await res.json();
      setHistory(h => [...h, { role:"assistant", text:data.reply || data.error || "Sorry, I couldn't answer that." }]);
    } catch {
      setHistory(h => [...h, { role:"assistant", text:"⚠ Network error — please try again." }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o=>!o)} style={s.fab}>
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        {!open && <span style={{ fontSize:13, fontWeight:600 }}>Ask AI</span>}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>JalRakshak AI</div>
              <div style={{ fontSize:11, color:"var(--muted-2)", marginTop:1 }}>Water safety · 3 languages</div>
            </div>
            <button onClick={() => setOpen(false)} style={s.closeBtn}><X size={15} /></button>
          </div>

          {zoneData && (
            <div style={s.contextPill}>
              📍 {zoneData.zone || "Current zone"} — pH {zoneData.ph?.toFixed(2)}, Contamination {zoneData.contamination?.toFixed(1)}%
            </div>
          )}

          <div style={s.messages}>
            {history.map((m,i) => (
              <div key={i} style={{ ...s.bubble, ...(m.role==="user" ? s.userBubble : s.botBubble) }}>
                {m.text}
              </div>
            ))}
            {loading && <div style={{ ...s.bubble, ...s.botBubble, color:"var(--muted-2)" }}>Thinking…</div>}
            <div ref={bottomRef} />
          </div>

          <div style={{ display:"flex", flexWrap:"wrap", gap:4, padding:"0 12px 8px" }}>
            {SUGGESTED.map((s2,i) => (
              <button key={i} onClick={() => send(s2)} style={s.suggestion}>{s2}</button>
            ))}
          </div>

          <div style={s.inputRow}>
            <input style={s.chatInput} className="input" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && send()}
              placeholder="Ask in any language…" disabled={loading} />
            <button onClick={() => send()} className="btn btn-primary"
              style={{ padding:"9px 14px" }} disabled={loading||!input.trim()}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const s = {
  fab:       { position:"fixed", bottom:24, right:24, zIndex:900, display:"flex", alignItems:"center", gap:8, padding:"12px 18px", background:"var(--orange)", color:"#fff", border:"none", borderRadius:999, fontSize:18, cursor:"pointer", boxShadow:"0 4px 20px rgba(249,115,22,0.4)" },
  panel:     { position:"fixed", bottom:80, right:24, zIndex:900, width:340, maxHeight:520, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, display:"flex", flexDirection:"column", boxShadow:"0 8px 40px rgba(0,0,0,0.12)" },
  panelHeader:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", borderBottom:"1px solid var(--border)" },
  closeBtn:  { background:"none", border:"none", color:"var(--muted-2)", cursor:"pointer" },
  contextPill:{ margin:"8px 12px 0", padding:"5px 10px", background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:8, fontSize:11, color:"#3b82f6" },
  messages:  { flex:1, overflowY:"auto", padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 },
  bubble:    { maxWidth:"85%", padding:"9px 12px", borderRadius:12, fontSize:13, lineHeight:1.5 },
  botBubble: { background:"var(--surface-2)", color:"var(--text-secondary)", alignSelf:"flex-start", borderBottomLeftRadius:4, border:"1px solid var(--border)" },
  userBubble:{ background:"var(--orange)", color:"#fff", alignSelf:"flex-end", borderBottomRightRadius:4 },
  suggestion:{ padding:"4px 10px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:999, color:"var(--muted-2)", fontSize:10, cursor:"pointer", textAlign:"left" },
  inputRow:  { display:"flex", gap:6, padding:"10px 12px", borderTop:"1px solid var(--border)" },
  chatInput: { flex:1, fontSize:13 },
};
