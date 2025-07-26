import React, { useState,useRef } from "react";
import { Save,Camera,Printer,FileDown,IterationCw, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import "./print.css";  
import { saveContent } from './storage';
 
function ContentGenerator({ data, onBack, setResponseData }) {
  const printRef = useRef();
  const [selectedGrade, setSelectedGrade] = useState(data.grade_levels?.[0]);
  const [selectedType, setSelectedType] = useState(data.content_types?.[0]);
  const [showCulturalRefs, setShowCulturalRefs] = useState(false);

  const content = data.generated_content?.[selectedGrade]?.[selectedType];
  
  const handleDownloadImage = () => { /* ... (no changes needed) */ };
  function decodeHTMLEntities(html) { /* ... (no changes needed) */ };
  const handleSave = async () => { /* ... (no changes needed) */ };
  const handleDownloadPDF = () => { /* ... (no changes needed) */ };
  const handlePrint = () => { /* ... (no changes needed) */ };
  const handleRegen = async (grade, contentType) => { /* ... (no changes needed) */ };

  const styles = {
    container: {
      width: "95%",
      margin: "auto",
      padding: "24px",
      backgroundColor: "var(--background-light)",
      borderRadius: "12px",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      marginTop: "32px",
      marginBottom: "32px",
      color: "var(--text-primary)",
    },
    topBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      borderBottom: "1px solid var(--border-color)",
      paddingBottom: "16px",
    },
    backButton: {
      fontSize: "16px",
      color: "var(--text-primary)",
      backgroundColor: "var(--background-dark)",
      padding: "10px 20px",
      border: "1px solid var(--border-color)",
      borderRadius: "8px",
      cursor: "pointer",
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: "background-color 0.2s",
    },
    headerTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "var(--accent-blue)",
    },
    horizontalSplit: {
      display: "flex",
      gap: "24px",
    },
    leftColumn: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    rightColumn: {
      flex: 2.5,
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    infoSection: {
      padding: "16px",
      backgroundColor: "var(--background-dark)",
      borderRadius: "8px",
    },
    infoText: {
      color: "var(--text-primary)",
      fontSize:"24px",
      fontWeight: '500',
    },
    listDisc: {
      listStyleType: "disc",
      marginLeft: "24px",
      color: "var(--text-secondary)",
      fontSize:"16px",
      paddingTop: '10px'
    },
    listItem:{
      marginBottom:'8px',
    },
    showButton: {
      fontSize: "14px",
      backgroundColor: "var(--accent-blue)",
      color: '#fff',
      padding: "10px 16px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      marginTop: "16px",
      transition: "opacity 0.2s",
    },
    selectionSection: {
      padding: "16px",
      backgroundColor: "var(--background-dark)",
      borderRadius: "8px",
    },
    selectionTitle: {
      fontSize: "18px",
      fontWeight: 600,
      color: "var(--text-primary)",
      marginBottom: "12px",
    },
    buttonGroup: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    },
    buttonBase: {
      padding: "8px 16px",
      borderRadius: "20px",
      fontSize:'14px',
      fontWeight: 500,
      cursor: "pointer",
      border: "1px solid var(--border-color)",
      transition: "background-color 0.2s, color 0.2s, border-color 0.2s",
    },
    buttonDefault: {
      backgroundColor: "var(--background-light)",
      color: "var(--text-secondary)",
    },
    buttonSelected: {
      backgroundColor: "var(--accent-blue)",
      color: "white",
      borderColor: "var(--accent-blue)",
    },
    contentDisplayContainer: {
      padding: "16px",
      minHeight:'400px',
      backgroundColor: "var(--background-dark)",
      borderRadius: "8px",
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    actions: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
    },
    actionButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 16px",
      fontSize: "14px",
      color: "var(--text-primary)",
      backgroundColor: "var(--background-light)",
      border: "1px solid var(--border-color)",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    contentBox: {
      flex: 1,
      overflow: 'auto',
      backgroundColor: '#fff',
      color: '#000',
      padding: '16px',
      borderRadius: '6px',
    },
    textContent: {
      whiteSpace: "pre-wrap",
      lineHeight: '1.6',
    },
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button style={styles.backButton} onClick={onBack}>
          <ArrowLeft size={20} /> Back
        </button>
        <h2 style={styles.headerTitle}>Generated Content</h2>
      </div>

      <div style={styles.horizontalSplit}>
        <div style={styles.leftColumn}>
          <div style={styles.infoSection}>
            <p style={styles.infoText}>
              <strong>Topic:</strong> {data.topic}
            </p>
            <button
              style={styles.showButton}
              onClick={() => setShowCulturalRefs((v) => !v)}
            >
              {showCulturalRefs ? "Hide" : "Show"} Cultural References
            </button>
            {showCulturalRefs && (
              <ul style={styles.listDisc}>
                {data.cultural_refs.map((ref, i) => (
                  <li style={styles.listItem} key={i}>{ref}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={styles.selectionSection}>
            <h3 style={styles.selectionTitle}>Select Grade:</h3>
            <div style={styles.buttonGroup}>
              {data.grade_levels.map((grade) => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  style={{
                    ...styles.buttonBase,
                    ...(selectedGrade === grade
                      ? styles.buttonSelected
                      : styles.buttonDefault),
                  }}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.selectionSection}>
            <h3 style={styles.selectionTitle}>Select Content Type:</h3>
            <div style={styles.buttonGroup}>
              {data.content_types.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  style={{
                    ...styles.buttonBase,
                    ...(selectedType === type
                      ? styles.buttonSelected
                      : styles.buttonDefault),
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.contentDisplayContainer}>
            <div style={styles.actions}>
              <button style={styles.actionButton} onClick={() => handleRegen(selectedGrade, selectedType)}>
                <IterationCw size={16} /> Regenerate
              </button>
              <button onClick={handleSave} style={styles.actionButton}>
                <Save size={16} /> Save
              </button>
              {selectedType === "diagram" ? (
                <button style={styles.actionButton} onClick={handleDownloadImage}>
                  <Camera size={16} /> Download PNG
                </button>
              ) : (
                <>
                  <button onClick={handleDownloadPDF} style={styles.actionButton}>
                    <FileDown size={16} /> Download PDF
                  </button>
                  <button onClick={handlePrint} style={styles.actionButton}>
                    <Printer size={16} /> Print
                  </button>
                </>
              )}
            </div>
            
            <div ref={printRef} style={styles.contentBox} className="printable-content">
              {content ? (
                  content.startsWith("data:image/") || content.startsWith("http") ? (
                      <img src={content} alt="Generated diagram" style={{ maxWidth: "100%", height: "auto" }} />
                  ) : (
                      <div style={styles.textContent} dangerouslySetInnerHTML={{ __html: content }} />
                  )
              ) : (
                  "No content available for this selection."
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentGenerator;