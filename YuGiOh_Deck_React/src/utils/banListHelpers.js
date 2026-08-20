import { Badge } from 'react-bootstrap';

export const getCardTypeRank = (typeStr) => {
  if (!typeStr) return 99;
  const t = typeStr.toLowerCase();
  if (t.includes("normal monster") || (t.includes("normal") && t.includes("monster") && !t.includes("effect"))) return 1;
  if (t.includes("fusion")) return 3;
  if (t.includes("link")) return 4;
  if (t.includes("synchro")) return 5;
  if (t.includes("xyz")) return 6;
  if (t.includes("spell")) return 7;
  if (t.includes("trap")) return 8;
  if (t.includes("monster") || t.includes("effect") || t.includes("tuner")) return 2;
  return 99;
};

export const renderLevelStars = (level) => {
  if (!level) return null;
  return (
    <div className="d-flex align-items-center gap-1">
      <span className="text-warning fw-bold small">LEVEL / RANK {level}</span>
      <span className="text-warning">{"★".repeat(Math.min(level, 12))}</span>
    </div>
  );
};

export const renderBanBadge = (status) => {
  const s = (status || "Unlimited").toUpperCase();
  if (s === "FORBIDDEN" || s === "BANNED") return <Badge bg="danger" className="terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>FORBIDDEN</Badge>;
  if (s === "LIMITED") return <Badge bg="warning" className="text-dark terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>LIMITED</Badge>;
  if (s === "SEMI-LIMITED") return <Badge bg="info" className="text-dark terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>SEMI-LIMITED</Badge>;
  return <Badge bg="success" className="terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>UNLIMITED</Badge>;
};