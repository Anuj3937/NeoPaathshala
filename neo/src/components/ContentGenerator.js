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

  // Pull out the piece of generated content for the current grade/type
  const content = data.generated_content?.[selectedGrade]?.[selectedType];
  const handleDownloadImage = () => {
    if (!content || !content.startsWith("data:image/")) {
      return alert("No image content to download");
    }
    const link = document.createElement("a");
    link.href = content;
    link.download = `grade-${selectedGrade}_${selectedType}_${Date.now()}.png`;
    link.click();
  };

function decodeHTMLEntities(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
const handleSave = async () => {
  if (!content) return alert("No content to save.");
  try {
    await saveContent(selectedGrade, selectedType, data.topic, content);
    alert("✅ Content saved successfully.");
  } catch (e) {
    console.error("Save failed:", e);
    alert("❌ Failed to save content.");
  }
};

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

  if (selectedType === "diagram" && content.startsWith("data:image/")) {
    // embed image as before…
    const imgProps = doc.getImageProperties(content);
    const imgW = printableWidth;
    const imgH = (imgProps.height * imgW) / imgProps.width;
    doc.addImage(content, "PNG", margin, margin, imgW, imgH);
  } else {
    // 1) Normalize <br> to newline
    let text = content
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
    doc.text(`Grade ${selectedGrade} – ${selectedType}`, margin, y);
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

  doc.save(`grade-${selectedGrade}_${selectedType}.pdf`);
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
          <h1>Grade ${selectedGrade} – ${selectedType}</h1>
          ${
            selectedType === "diagram" && content.startsWith("data:image/")
              ? `<img src="${content}" />`
              : (() => {
                  // convert <br> to paragraphs
                  let html = content || "";
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

  const handleRegen = async (grade, contentType) => {
    try {
      const promptString = `Generate a ${contentType} for grade ${grade} on the topic "${data.topic}"`;
      const res = await fetch("http://localhost:8000/parse_and_map/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptString ,
            selected_language:  data.language}),
      });
      console.log(res.ok);
      if (!res.ok) throw new Error("Regen failed");
      const newData = await res.json();

      setResponseData((prev) => {
        const updated = { ...prev };
        updated.generated_content = { ...updated.generated_content };
        updated.generated_content[grade] = {
          ...updated.generated_content[grade],
          [contentType]:
            newData.generated_content?.[grade]?.[contentType] ??
            updated.generated_content[grade][contentType],
        };
        return updated;
      });

      // refresh the displayed content
      setSelectedGrade(grade);
      setSelectedType(contentType);
    } catch (err) {
      console.error("❌ Regen error:", err);
      alert("Failed to regenerate content.");
    }
  };


  const styles = {
    container: {
      width: "95%",
      margin: "auto",
      padding: "24px",
      backgroundColor: "var(--background-dark)",
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
      fontSize: "24px",
      color: "#023a05",
      backgroundColor: "#75ff7b",
      padding: "15px 24px",
      border: "none",
      borderRadius: "30px",
      cursor: "pointer",
      marginBottom: "12px",
      boxShadow: "0 6px 0 #272727ff, 0 8px 15px rgba(0, 0, 0, 0.2)",
      transition: "all 0.1s ease-in-out",
      transform: "translateY(0)",
    },
    headerTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "var(--text-primary)",
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
      color: "var(--text-primary] )",
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
      backgroundColor: "var(--accent-purple)",
      color: '#fff',
      padding: "16px 12px",
      borderRadius: "30px",
      border: "none",
      cursor: "pointer",
      marginBottom: "12px",
      boxShadow: "0 6px 0 #2c0830ff, 0 8px 15px rgba(0, 0, 0, 0.2)",
      transition: "all 0.1s ease-in-out", 
      transform: "translateY(0)",
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
    buttonSelectedGrade: {
      backgroundColor: "#4f46e5", // Indigo
      fontSize: "21px",
      padding: "12px 22px",
      color: "white",
      border: "none",
      borderRadius: "24px",
      cursor: "pointer",
      marginBottom: "12px",
      boxShadow: "0 6px 0 #26236b", // Main "pressed" shadow
      transition: "transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out",
      transform: "translateY(0)",
      position: "relative", // Required to simulate press-in effect
    },
      buttonSelectedType: {
      backgroundColor: "var(--accent-red)",
      color: "white",
      border: "none",
      padding: "12px 22px",
      borderRadius: "30px",
      cursor: "pointer",
      marginBottom: "12px",
      boxShadow: "0 6px 0 #f12323ff, 0 8px 15px rgba(0, 0, 0, 0.2)",
      transition: "all 0.1s ease-in-out",
      transform: "translateY(0)",
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
        regenButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 20px",
      fontSize: "16px",
      color: "white",
      backgroundColor: "#006b07",
      border: "none",
      borderRadius: "30px",
      cursor: "pointer",
      marginBottom: "12px",
      boxShadow: "0 6px 0 #004a05, 0 8px 15px rgba(0, 0, 0, 0.2)",
      transition: "all 0.1s ease-in-out",
      transform: "translateY(0)",
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
    saveButton: {
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
                      ? styles.buttonSelectedGrade
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
                      ? styles.buttonSelectedType
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
                          <button
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
            </button>
            <button onClick={handleSave} style={styles.saveButton}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.95)";
                  e.currentTarget.style.boxShadow = "0 2px 0 #b11b1bff";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 0 #b11b1bff, 0 8px 15px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 0 #b11b1bff, 0 8px 15px rgba(0, 0, 0, 0.2)";
                }}
            >
            <Save /> Save
          </button>
            {selectedType === "diagram" ? (
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