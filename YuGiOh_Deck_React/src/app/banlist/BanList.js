'use client'; 

import React, { useState } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import { useBanList } from '@/hooks/useBanList';
import { getCardTypeRank, renderBanBadge } from '@/utils/banListHelpers';
import CardInspectorModal from '@/components/CardInspectorModal';
import "../../mdstyles.css"

export default function BanList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL"); 
  const [selectedCard, setSelectedCard] = useState(null);
  const [format, setFormat] = useState("tcg"); 

  const { cards, isLoading, error } = useBanList(format);

  const filteredCards = cards
    .filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            card.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === "ALL" || card.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const rankA = getCardTypeRank(a.type);
      const rankB = getCardTypeRank(b.type);
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    });

  const forbiddenCount = cards.filter(c => c.status === "Forbidden").length;
  const limitedCount = cards.filter(c => c.status === "Limited").length;
  const semiLimitedCount = cards.filter(c => c.status === "Semi-Limited").length;

  return (
    <div style={styles.container}>
      <style>{`
        * { font-family: 'Cascadia Mono', monospace !important; }
        .terminal-font { font-family: 'Cascadia Mono', monospace !important; }
        .attr-DARK { background-color: #0d6efd; color: #fff; }
        .attr-LIGHT { background-color: #bfa136; color: #fff; }
        .attr-EARTH { background-color: #7a5127; color: #fff; }
        .attr-WATER { background-color: #2672b8; color: #fff; }
        .attr-FIRE { background-color: #b83326; color: #fff; }
        .attr-WIND { background-color: #28804a; color: #fff; }
        .attr-DIVINE { background-color: #c98018; color: #fff; }
        .vrains-corner { position: absolute; width: 8px; height: 8px; border-color: #00d2ff; border-style: solid; }
        .vrains-corner-tl { top: 0; left: 0; border-width: 2px 0 0 2px; }
        .vrains-corner-tr { top: 0; right: 0; border-width: 2px 2px 0 0; }
        .vrains-corner-bl { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
        .vrains-corner-br { bottom: 0; right: 0; border-width: 0 2px 2px 0; }
        .vrains-stat-box { background: rgba(0,0,0,0.6); border: 1px solid rgba(0,210,255,0.3); border-radius: 4px; text-align: center; }
        .md-card-tile { border: 1px solid #1e2638; transition: transform 0.2s, border-color 0.2s; }
        .md-card-tile:hover { transform: translateY(-4px); border-color: #00d2ff !important; box-shadow: 0 0 15px rgba(0,210,255,0.3); }
      `}</style>

      <div className="container-fluid px-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>

        <header style={styles.header}>
          <div style={styles.titleGroup}>
            <span style={styles.subtitle}>OFFICIAL FORBIDDEN & LIMITED LIST</span>
            <h1 style={styles.title}>
              {format === 'masterduel' ? 'MASTER DUEL' : format === 'ocg' ? 'OCG' : 'TCG'} REGULATION
            </h1>
          </div>

          <div style={styles.formatToggle}>
            <button onClick={() => setFormat('tcg')} style={{ ...styles.formatBtn, ...(format === 'tcg' ? styles.activeFormatBtn : {}) }}>TCG List</button>
            <button onClick={() => setFormat('ocg')} style={{ ...styles.formatBtn, ...(format === 'ocg' ? styles.activeFormatBtn : {}) }}>OCG List</button>
            <button onClick={() => setFormat('masterduel')} style={{ ...styles.formatBtn, ...(format === 'masterduel' ? styles.activeFormatBtn : {}) }}>Master Duel List</button>
          </div>

          <div style={styles.counterRow}>
            <div style={{ ...styles.counterCard, borderColor: '#ff4d4d' }}>
              <span style={{ color: '#ff4d4d', fontSize: '20px', fontWeight: 'bold' }}>{forbiddenCount}</span>
              <span style={styles.counterLabel}>Forbidden</span>
            </div>
            <div style={{ ...styles.counterCard, borderColor: '#ffcc00' }}>
              <span style={{ color: '#ffcc00', fontSize: '20px', fontWeight: 'bold' }}>{limitedCount}</span>
              <span style={styles.counterLabel}>Limited</span>
            </div>
            <div style={{ ...styles.counterCard, borderColor: '#00d2ff' }}>
              <span style={{ color: '#00d2ff', fontSize: '20px', fontWeight: 'bold' }}>{semiLimitedCount}</span>
              <span style={styles.counterLabel}>Semi-Limited</span>
            </div>
          </div>
        </header>

        <div style={styles.filterBar}>
          <div style={styles.searchWrapper}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search card name or card type..."
              style={styles.searchInput}
            />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={styles.clearBtn}>✕</button>}
          </div>

          <div style={styles.tabGroup}>
            {["ALL", "Forbidden", "Limited", "Semi-Limited"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                style={{
                  ...styles.tabBtn,
                  ...(selectedStatus === status ? styles.activeTabBtn : {}),
                  borderColor: status === "Forbidden" ? '#ff4d4d' : status === "Limited" ? '#ffcc00' : status === "Semi-Limited" ? '#00d2ff' : '#0dcaf0'
                }}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <main style={styles.mainLayout}>
          {isLoading ? (
            <div className="text-center my-5 py-5">
              <Spinner animation="border" variant="info" style={{ width: '3rem', height: '3rem' }} />
              <p className="text-info terminal-font mt-3">ACCESSING_BANLIST_DATABASE...</p>
            </div>
          ) : error ? (
            <div style={styles.noResults}><p style={{ color: '#ff4d4d' }}>{error}</p></div>
          ) : filteredCards.length === 0 ? (
            <div style={styles.noResults}><p style={{ fontSize: '18px', color: '#aaa' }}>No cards found matching your query.</p></div>
          ) : (
            <Row className="g-3 row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 row-cols-xl-6">
              {filteredCards.map((card) => (
                <Col key={card.id}>
                  <div className="md-card-tile p-2 rounded-3 bg-dark h-100 d-flex flex-column justify-content-between position-relative" onClick={() => setSelectedCard(card)} style={{ cursor: 'pointer' }}>
                    <div className="overflow-hidden rounded mb-2">
                      <img src={card.image} alt={card.name} className="w-100 h-auto rounded" loading="lazy" onError={(e) => { e.target.src = card.fallbackImage || "https://ygoprodeck.com/images/cards/back.jpg"; }}/>
                    </div>
                    <div className="text-center mt-auto pt-1">
                      <div className="mb-1">{renderBanBadge(card.status)}</div>
                      <span className="text-white fw-bold d-block text-truncate small" title={card.name}>{card.name}</span>
                      <span className="text-info-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>ID: #{card.id}</span>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}

          <CardInspectorModal selectedCard={selectedCard} onClose={() => setSelectedCard(null)} />
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0a0d14', color: '#ffffff', minHeight: '100vh', fontFamily: "'Cascadia Mono', monospace", padding: '100px 20px 40px 20px', },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e2638', paddingBottom: '20px', marginBottom: '25px', flexWrap: 'wrap', gap: '20px' },
  titleGroup: { display: 'flex', flexDirection: 'column', },
  subtitle: { color: '#00d2ff', fontSize: '12px', letterSpacing: '3px', fontWeight: 'bold', },
  title: { margin: '5px 0 0 0', fontSize: '32px', fontWeight: '800', letterSpacing: '1px', background: 'linear-gradient(90deg, #ffffff, #8a9ba8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', },
  formatToggle: { display: 'flex', gap: '10px', },
  formatBtn: { backgroundColor: '#121824', border: '1px solid #232d42', color: '#8a9ba8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', },
  activeFormatBtn: { backgroundColor: '#00d2ff', color: '#0a0d14', borderColor: '#00d2ff', },
  counterRow: { display: 'flex', gap: '15px', },
  counterCard: { backgroundColor: '#121824', border: '1px solid', borderRadius: '8px', padding: '10px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px', },
  counterLabel: { fontSize: '11px', color: '#8a9ba8', marginTop: '4px', textTransform: 'uppercase', },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', },
  searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center', flex: '1', minWidth: '280px', },
  searchIcon: { position: 'absolute', left: '12px', fontSize: '14px', },
  searchInput: { width: '100%', padding: '12px 35px 12px 35px', backgroundColor: '#121824', border: '1px solid #232d42', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none', },
  clearBtn: { position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#8a9ba8', cursor: 'pointer', },
  tabGroup: { display: 'flex', gap: '8px', },
  tabBtn: { backgroundColor: '#121824', border: '1px solid #232d42', color: '#8a9ba8', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', },
  activeTabBtn: { backgroundColor: '#1e283d', color: '#fff', boxShadow: '0 0 10px rgba(0, 210, 255, 0.2)', },
  mainLayout: { position: 'relative', },
  noResults: { textAlign: 'center', padding: '50px', backgroundColor: '#121824', borderRadius: '8px', }
};