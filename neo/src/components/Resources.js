import React, { useEffect, useState,useRef } from 'react';
import { getAllSavedContent, deleteSavedContent } from './storage';
import {ExternalLink,Shredder,File} from 'lucide-react';
import jsPDF from "jspdf";
import { Camera,Printer,FileDown} from "lucide-react";

const SavedResourcesDisplay = () => {
  const printRef = useRef()
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
    const handleDownloadImage = () => {
    if (!activeItem.content || !activeItem.content.startsWith("data:image/")) {
      return alert("No image content to download");
    }
    const link = document.createElement("a");
    link.href = activeItem.content;
    link.download = `grade-${activeItem.Grade}_${activeItem.type}_${Date.now()}.png`;
    link.click();
  };
  const handleDelete = async (id, type) => {
    await deleteSavedContent(id);
    setGroupedContent((prev) => {
      const updated = { ...prev };
      updated[type] = updated[type].filter((item) => item.id !== id);
      return updated;
    });
  };
  function decodeHTMLEntities(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
    // 2️⃣ Download as PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      unit: "pt",
      format: "letter",
    });
  
    // compute printable width (page width minus horizontal margins)
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const printableWidth = (pageWidth + margin * 2)*1.25;
  
    if (activeItem.type === "diagram" && activeItem.content.startsWith("data:image/")) {
      // embed image as before…
      const imgProps = doc.getImageProperties(activeItem.content);
      const imgW = printableWidth;
      const imgH = (imgProps.height * imgW) / imgProps.width;
      doc.addImage(activeItem.content, "PNG", margin, margin, imgW, imgH);
    } else {
      // 1) Normalize <br> to newline
      let text = activeItem.content
    .replace(/<br\s*\/?>/gi, "\n")    // <br> → newline
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, (_, inner) => {
      // wrap bold in markers or leave as-is
      return inner.toUpperCase();     // for instance
    });
      text = decodeHTMLEntities(text);
      // 2) Strip any remaining HTML tags
      text = text.replace(/<[^>]+>/g, "");
  
      // 3) Split into wrapped lines
      const lines = doc.splitTextToSize(text, printableWidth);
  
      // 4) Render title and lines
      let y = margin;
      doc.setFontSize(14);
      doc.text(`Grade ${activeItem.Grade} – ${activeItem.type}`, margin, y);
      y += 24;
      doc.setFontSize(12);
  
      lines.forEach((line) => {
        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 16;
      });
    }
  
    doc.save(`grade-${activeItem.Grade}_${activeItem.type}.pdf`);
  };
  
    // 3️⃣ Print via window.print (uses your CSS @media print rules)
   const printableFrameRef = useRef(null);
  
    const handlePrint = () => {
      // 1) Create an off-screen iframe
      let frame = printableFrameRef.current;
      if (!frame) {
        frame = document.createElement("iframe");
        frame.style.position = "fixed";
        frame.style.right = "0";
        frame.style.bottom = "0";
        frame.style.width = "0";
        frame.style.height = "0";
        frame.style.border = "0";
        printableFrameRef.current = frame;
        document.body.appendChild(frame);
      }
  
      const doc = frame.contentWindow.document;
      doc.open();
      doc.write(`
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { font-size: 18pt; margin-bottom: 12pt; }
              p, li { font-size: 12pt; line-height: 1.4; }
              img { max-width: 100%; height: auto; display: block; margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>Grade ${activeItem.Grade} – ${activeItem.type}</h1>
            ${
              activeItem.type === "diagram" && activeItem.content.startsWith("data:image/")
                ? `<img src="${activeItem.content}" />`
                : (() => {
                    // convert <br> to paragraphs
                    let html = activeItem.content || "";
                    // decode HTML entities
                    const txt = document.createElement("textarea");
                    txt.innerHTML = html;
                    html = txt.value;
                    // wrap <br> → </p><p>
                    html = html
                      .replace(/<br\s*\/?>/gi, "</p><p>")
                      .replace(/<\/p><p>/g, "</p><p>");
                    // ensure paragraphs
                    if (!html.match(/^<p>/)) html = `<p>${html}</p>`;
                    return html;
                  })()
            }
          </body>
        </html>
      `);
      doc.close();
  
      // 2) Wait for images to load (if any), then trigger print
      frame.onload = () => {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        // optional: remove the iframe after printing
      };
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
            <div ref={printRef} className="printable-content">
    <div style={styles.modalContent}>
      <h3>Topic: {activeItem.topic.toUpperCase()}</h3>
      <button
        style={styles.closeButton}
        onClick={() => setIsModalOpen(false)}
      >
        Close
      </button>
                   <div className="actions" style={styles.actions}>
            {/* <button
              style={styles.regenButton}
              onClick={() => handleRegen(selectedGrade, selectedType)}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.95)";
                  e.currentTarget.style.boxShadow = "0 2px 0 #004a05";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 0 #004a05, 0 8px 15px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 0 #004a05, 0 8px 15px rgba(0, 0, 0, 0.2)";
                }}
            >
              <IterationCw />
              Regenerate
            </button> */}
            {activeItem.type === "diagram" ? (
            <button style={styles.dwnldButton} onClick={handleDownloadImage}                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.95)";
                  e.currentTarget.style.boxShadow = "0 2px 0 #111111ff";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 0 #111111ff, 0 8px 15px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 0 #111111ff, 0 8px 15px rgba(0, 0, 0, 0.2)";
                }}
            >
              <Camera color="#ffffff" /> Download PNG
            </button>
          ) : (
            <>
              <button onClick={handleDownloadPDF} style={styles.dwnldButton}
                              onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.95)";
                  e.currentTarget.style.boxShadow = "0 2px 0 #00031dff";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 0 #111111ff, 0 8px 15px #00031dff)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 0 #00031dff, 0 8px 15px rgba(0, 0, 0, 0.2)";
                }}
            >
                <FileDown color="#ffffff" /> Download PDF
              </button>
              <button onClick={handlePrint} style={styles.printButton}
                              onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.95)";
                  e.currentTarget.style.boxShadow = "0 2px 0 #000000ff";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 0 #111111ff, 0 8px 15px #000000ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 0 #000000ff, 0 8px 15px rgba(0, 0, 0, 0.2)";
                }}
            >
                <Printer color="#ffffff" /> Print
              </button>
            </>
          )}
        </div>
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
printButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 14px",
      fontSize: "16px",
      color: "white",
      backgroundColor: "#272727ff",
      border: "none",
      borderRadius: "30px",
      cursor: "pointer",
      marginBottom: "12px",
      boxShadow: "0 6px 0 #272727ff, 0 8px 15px rgba(0, 0, 0, 0.2)",
      transition: "all 0.1s ease-in-out",
      transform: "translateY(0)",
    },
      dwnldButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 14px",
      fontSize: "16px",
      color: "white",
      backgroundColor: "#000c3aff",
      border: "none",
      borderRadius: "30px",
      cursor: "pointer",
      marginBottom: "12px",
      boxShadow: "0 6px 0 #000c3aff, 0 8px 15px rgba(0, 0, 0, 0.2)",
      transition: "all 0.1s ease-in-out",
      transform: "translateY(0)",
    },

};

export default SavedResourcesDisplay;