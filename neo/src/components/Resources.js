import React, { useEffect, useState } from 'react';
import { getAllSavedContent, deleteSavedContent } from './storage';
import {ExternalLink,Shredder,File} from 'lucide-react';

const SavedResourcesDisplay = () => {
  const [groupedContent, setGroupedContent] = useState({});
  const [gradeFilters, setGradeFilters] = useState({});
  const [activeItem, setActiveItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openItem = (item) => {
  setActiveItem(item);
  setIsModalOpen(true);
};

  useEffect(() => {
    const loadContent = async () => {
      const allContent = await getAllSavedContent();

      const grouped = {};
      allContent.forEach((item) => {
        if (!grouped[item.type]) grouped[item.type] = [];
        grouped[item.type].push(item);
      });

      setGroupedContent(grouped);
    };

    loadContent();
  }, []);

  const handleGradeFilterChange = (type, grade) => {
    setGradeFilters((prev) => ({ ...prev, [type]: grade }));
  };

  const handleDelete = async (id, type) => {
    await deleteSavedContent(id);
    setGroupedContent((prev) => {
      const updated = { ...prev };
      updated[type] = updated[type].filter((item) => item.id !== id);
      return updated;
    });
  };

  return (
    <div style={styles.mainContainer}>
      {Object.keys(groupedContent).map((type) => {
        const contentList = groupedContent[type];
        const grades = Array.from(new Set(contentList.map((c) => c.grade)));
        const selectedGrade = gradeFilters[type];

        const filteredList = selectedGrade
          ? contentList.filter((c) => c.grade === selectedGrade)
          : contentList;

        return (
          <div key={type} style={styles.typeContainer}>
            <h2>{type.toUpperCase()}</h2>
            
            <label>
              Filter by Grade:{" "}
              <select
                onChange={(e) => handleGradeFilterChange(type, e.target.value)}
                value={selectedGrade || ""}
              >
                <option value="">All</option>
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </label>

<div style={styles.cardGrid}>
  {filteredList.map((item) => (
    <div key={item.id} style={styles.fileCard}>
        <File size={36} />
      <p style={styles.fileLabel}>GRADE_{item.grade}_TOPIC_{item.topic.toUpperCase()}</p>
      <div style={styles.actions}>
      <button
        style={styles.deleteButton}
        onClick={() => handleDelete(item.id, type)}
      >
        <Shredder size={18} />
        Delete
      </button>
            <button
        style={styles.openButton}
          onClick={() => openItem(item)}
          onMouseDown={(e) => {
    e.currentTarget.style.transform = "translateY(3px)";
    e.currentTarget.style.boxShadow = "0 2px 0 #083a0aff";
  }}
  onMouseUp={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 6px 0 #083a0aff";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 6px 0 #083a0aff";
  }}
      >
        <ExternalLink size={18} />
        Open
      </button>
      </div>
    </div>
  ))}   
</div>
          </div>
        );
      })}
      {isModalOpen && activeItem && (
  <div style={styles.modalOverlay}>
    <div style={styles.modalContent}>
      <h3>Topic: {activeItem.topic.toUpperCase()}</h3>
      <button
        style={styles.closeButton}
        onClick={() => setIsModalOpen(false)}
      >
        Close
      </button>

      {activeItem.type === "diagram" ? (
        <div style={styles.mermaidContainer}>
          {activeItem.content ? (
            activeItem.content.startsWith("data:image/") ||
            activeItem.content.startsWith("http") ? (
              <img
                src={activeItem.content}
                alt="Generated diagram"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            ) : (
              <p style={styles.mermaidLoadingText}>
                ⚠️ Unsupported image format.
              </p>
            )
          ) : (
            <p style={styles.mermaidLoadingText}>Loading diagram...</p>
          )}
        </div>
      ) : (
        <div style={styles.textContent}>
          {activeItem.content ? (
            <div
              dangerouslySetInnerHTML={{ __html: activeItem.content }}
            />
          ) : (
            "No content available for this selection."
          )}
        </div>
      )}
    </div>
  </div>
)}

    </div>
  );
};

const styles = {
  mainContainer: { 
    display: "flex",
    flexDirection: "column",
    gap: "21px",
    backgroundColor:"#919191ff",
    padding: "24px",
    marginTop: "40px", 
  },
  typeContainer: {
    background: "#f0f4ff",
    padding: "16px",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
    cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
    marginTop: '24px',
  },
  fileCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: '18px',
    padding: '18px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    position: 'relative',
  },
  fileLabel: {
    fontSize: '14.5px',
    color: '#333',
    wordBreak: 'break-word',
  },
actions:{
      display:'flex',
      gap:'12px',
      padding:'8px 8px',
      justifyContent: "center",
      alignItems: "center",
    },
  deleteButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 14px",
      fontSize: "16px",
      color: "white",
      backgroundColor: "#f12323ff",
      border: "none",
      borderRadius: "30px",
      cursor: "pointer",
      marginBottom: "12px",
      boxShadow: "0 6px 0 #b11b1bff, 0 8px 15px rgba(0, 0, 0, 0.2)",
      transition: "all 0.1s ease-in-out", 
      transform: "translateY(0)",
    },
    openButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 14px",
      fontSize: "16px",
      color: "white",
      backgroundColor: "#0d5c11ff",
      border: "none",
      borderRadius: "30px",
      cursor: "pointer",
      marginBottom: "12px",
      boxShadow: "0 6px 0 #083a0aff, 0 8px 15px rgba(0, 0, 0, 0.2)",
      transition: "all 0.1s ease-in-out", 
      transform: "translateY(0)",
  },
  modalOverlay: {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
},
modalContent: {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "12px",
  width: "90%",
  maxWidth: "800px",
  maxHeight: "80vh",
  overflowY: "auto",
  position: "relative",
},
closeButton: {
  position: "absolute",
  top: "12px",
  right: "16px",
  background: "#e74c3c",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "6px 12px",
  cursor: "pointer",
},

};

export default SavedResourcesDisplay;