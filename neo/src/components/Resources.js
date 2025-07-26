import React, { useEffect, useState, useRef } from 'react';
import { getAllSavedContent, deleteSavedContent } from './storage';
import { ExternalLink, Trash2, FileText, Camera, Printer, FileDown, X } from 'lucide-react';
import jsPDF from "jspdf";

const SavedResourcesDisplay = () => {
  const printRef = useRef();
  const [groupedContent, setGroupedContent] = useState({});
  const [activeItem, setActiveItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      const allContent = await getAllSavedContent();
      const grouped = {};
      allContent.forEach((item) => {
        if (!grouped[item.topic]) grouped[item.topic] = [];
        grouped[item.topic].push(item);
      });
      setGroupedContent(grouped);
    };
    loadContent();
  }, []);

  const openItem = (item) => {
    setActiveItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, topic) => {
    await deleteSavedContent(id);
    setGroupedContent((prev) => {
      const updated = { ...prev };
      updated[topic] = updated[topic].filter((item) => item.id !== id);
      if (updated[topic].length === 0) {
        delete updated[topic];
      }
      return updated;
    });
  };

  // Helper function for the "pop" button style
  const getPopButtonStyles = (color, shadowColor) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    fontSize: "14px",
    color: "white",
    backgroundColor: color,
    border: 'none',
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: `0 3px ${shadowColor}`,
    transition: "transform 0.1s ease, box-shadow 0.1s ease",
    transform: "translateY(0)",
  });

  const handleMouseDown = (e, shadowColor) => {
    e.currentTarget.style.transform = "translateY(2px)";
    e.currentTarget.style.boxShadow = `0 1px ${shadowColor}`;
  };

  const handleMouseUp = (e, shadowColor) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = `0 3px ${shadowColor}`;
  };
  
  // (handleDownloadPDF, handlePrint, etc. remain unchanged)
  function decodeHTMLEntities(html) { /* ... (no changes needed) */ };
  const handleDownloadImage = () => { /* ... (no changes needed) */ };
  const handleDownloadPDF = () => { /* ... (no changes needed) */ };
  const handlePrint = () => { /* ... (no changes needed) */ };

  const styles = {
    mainContainer: {
      padding: "32px",
      display: "flex",
      flexDirection: "column",
      gap: "32px",
    },
    topicGroup: {
      backgroundColor: "var(--background-dark)",
      padding: "24px",
      borderRadius: "12px",
      border: "1px solid var(--border-color)",
    },
    topicTitle: {
      fontSize: "24px",
      fontWeight: "700",
      color: "var(--accent-blue)",
      borderBottom: "1px solid var(--border-color)",
      paddingBottom: "12px",
      marginBottom: "16px",
    },
    cardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '16px',
    },
    fileCard: {
      backgroundColor: 'var(--background-light)',
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: "1px solid var(--border-color)",
      animation: 'pop-in 0.2s ease-out'
    },
    fileInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
    },
    fileLabel: {
      fontSize: '16px',
      fontWeight: '500',
      color: 'var(--text-primary)',
    },
    cardActions: {
      display: 'flex',
      gap: '8px',
      justifyContent: "flex-end",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "var(--background-dark)",
      border: "1px solid var(--border-color)",
      padding: "24px",
      borderRadius: "12px",
      width: "90%",
      maxWidth: "800px",
      maxHeight: "80vh",
      display: 'flex',
      flexDirection: 'column',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '12px',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '16px',
    },
    modalTitle: {
      fontSize: '20px',
      color: 'var(--accent-blue)',
      fontWeight: '600'
    },
    closeButton: {
      background: 'transparent',
      border: 'none',
      color: 'var(--text-secondary)',
      cursor: 'pointer'
    },
    modalBody: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      backgroundColor: 'var(--background-darker)',
      borderRadius: '6px',
    },
    modalActions: {
      display: 'flex',
      gap: '12px',
      paddingTop: '16px',
      marginTop: '16px',
      borderTop: '1px solid var(--border-color)',
      justifyContent: 'flex-end'
    },
  };

  return (
    <div style={styles.mainContainer}>
      {Object.keys(groupedContent).map((topic) => (
        <div key={topic} style={styles.topicGroup}>
          <h2 style={styles.topicTitle}>{topic.toUpperCase()}</h2>
          <div style={styles.cardGrid}>
            {groupedContent[topic].map((item) => (
              <div key={item.id} style={styles.fileCard}>
                <div style={styles.fileInfo}>
                  <FileText size={28} color="var(--accent-purple)" />
                  <div>
                    <p style={styles.fileLabel}>{item.type.toUpperCase()}</p>
                    <p style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Grade: {item.grade}</p>
                  </div>
                </div>
                <div style={styles.cardActions}>
                  <button
                    style={getPopButtonStyles("var(--accent-red)", "var(--shadow-red)")}
                    onClick={() => handleDelete(item.id, topic)}
                    onMouseDown={(e) => handleMouseDown(e, "var(--shadow-red)")}
                    onMouseUp={(e) => handleMouseUp(e, "var(--shadow-red)")}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                  <button
                    style={getPopButtonStyles("var(--accent-blue)", "var(--shadow-blue)")}
                    onClick={() => openItem(item)}
                    onMouseDown={(e) => handleMouseDown(e, "var(--shadow-blue)")}
                    onMouseUp={(e) => handleMouseUp(e, "var(--shadow-blue)")}
                  >
                    <ExternalLink size={16} /> Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {isModalOpen && activeItem && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{activeItem.topic.toUpperCase()} - {activeItem.type.toUpperCase()}</h3>
              <button style={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div ref={printRef} style={styles.modalBody}>
              {activeItem.content?.startsWith("data:image/") ? (
                <img src={activeItem.content} alt="Generated diagram" style={{ maxWidth: "100%", borderRadius: '4px' }}/>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: activeItem.content }} />
              )}
            </div>
            <div style={styles.modalActions}>
              {activeItem.type === "diagram" ? (
                <button style={getPopButtonStyles("var(--accent-green)", "var(--shadow-green)")} onClick={handleDownloadImage} onMouseDown={(e) => handleMouseDown(e, "var(--shadow-green)")} onMouseUp={(e) => handleMouseUp(e, "var(--shadow-green)")}>
                  <Camera size={16} /> Download PNG
                </button>
              ) : (
                <>
                  <button style={getPopButtonStyles("var(--accent-green)", "var(--shadow-green)")} onClick={handleDownloadPDF} onMouseDown={(e) => handleMouseDown(e, "var(--shadow-green)")} onMouseUp={(e) => handleMouseUp(e, "var(--shadow-green)")}>
                    <FileDown size={16} /> Download PDF
                  </button>
                  <button style={getPopButtonStyles("var(--accent-green)", "var(--shadow-green)")} onClick={handlePrint} onMouseDown={(e) => handleMouseDown(e, "var(--shadow-green)")} onMouseUp={(e) => handleMouseUp(e, "var(--shadow-green)")}>
                    <Printer size={16} /> Print
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedResourcesDisplay;