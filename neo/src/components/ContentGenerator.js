import React, { useState,useRef } from "react";
import { Save,Camera,Printer,FileDown,IterationCw } from "lucide-react";
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

      const res = await fetch(`http://localhost:8000/parse_and_map/`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptString }),
      });
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
      width: "98%",
      margin: "auto",
      padding: "24px",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow:
        "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
      marginTop: "32px",
      marginBottom: "32px",
    },
    topBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
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
      color: "#4f46e5",
    },
    horizontalSplit: {
      display: "flex",
      gap: "24px",
    },
    leftColumn: {
      flex: 1,
    },
    rightColumn: {
      flex: 2,
      display: "flex",
      flexDirection: "column",
      gap: "24px",
    },
    infoSection: {
      padding: "16px",
      backgroundColor: "#f9fafb",
      borderRadius: "6px",
      border: "1px solid #e5e7eb",
    },
    infoText: {
      color: "#4b5563",
      fontSize:"42px",
    },
    listDisc: {
      listStyleType: "disc",
      marginLeft: "24px",
      color: "#272d35ff",
      fontSize:"21px",
      gap:'5px'
    },
    listitem:{
      marginBottom:'8px',
    },
    showButton: {
      fontSize: "18px",
      backgroundColor: "#6a0dad ",
      color:'#edd8fcff ',
      padding: "16px 12px",
      borderRadius: "30px",
      border: "1px solid #43086dff ",
      cursor: "pointer",
      marginTop: "8px",
    },
    selectionSection: {
      padding: "12px",
      backgroundColor: "#f9fafb",
      borderRadius: "6px",
      border: "1px solid #e5e7eb",
    },
    selectionTitle: {
      fontSize: "24px",
      fontWeight: 600,
      color: "#1f2937",
      marginBottom: "8px",
    },
    buttonGroup: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    },
    buttonBase: {
      padding: "8px 16px",
      borderRadius: "21px",
      fontSize:'16px',
      fontWeight: 500,
      cursor: "pointer",
      border: "none",
      outline: "none",
      marginBottom: "12px",
      boxShadow: "0 6px 0 #2c2c2cff, 0 8px 15px rgba(0, 0, 0, 0.2)",
      transition: "all 0.1s ease-in-out",
      transform: "background-color 0.2s translateY(0)",
    },
    buttonDefault: {
      backgroundColor: "#e5e7eb",
      color: "#4b5563",
    },
    buttonGradeSelected: {
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
    buttonTypeSelected: {
      backgroundColor: "#df8108ff",
      color: "#f7cd9dff",
      fontSize:'21px',
      fontWeight:'Bold',
      padding:'12px 18px',
      border: "none",
      borderRadius: "30px",
      cursor: "pointer",
      marginBottom: "12px",
      boxShadow: "0 6px 0 #f12323ff, 0 8px 15px rgba(0, 0, 0, 0.2)",
      transition: "all 0.1s ease-in-out",
      transform: "translateY(0)",
    },
    contentDisplayContainer: {
      padding: "16px",
      minHeight:'96%',
      backgroundColor: "#f3f4f6",
      borderRadius: "8px",
      border: "1px solid #e5e7eb",
    },
    mermaidContainer: {
      textAlign: "center",
      minHeight: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fff",
    },
    mermaidLoadingText: {
      color: "#9ca3af",
    },
    textContent: {
      whiteSpace: "pre-wrap",
      padding: "16px",
      backgroundColor: "white",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      maxHeight: "95%",
      overflow: "auto",
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
    actions:{
      display:'flex',
      gap:'12px',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button style={styles.backButton} onClick={onBack}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(3px)";
            e.currentTarget.style.boxShadow = "0 2px 0 #1a4e16ff";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 0 #1a4e16ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 0 #1a4e16ff";
          }}>
          Back
        </button>
        <h2 style={styles.headerTitle}>📚 Generated Content</h2>
      </div>

      <div style={styles.horizontalSplit}>
        {/* Left panel: topic & cultural refs + selectors */}
        <div style={styles.leftColumn}>
          <div style={styles.infoSection}>
            <p style={styles.infoText}>
              <strong>Topic:</strong> {data.topic.toUpperCase()}
            </p>
            <button
              style={styles.showButton}
              onClick={() => setShowCulturalRefs((v) => !v)}
                onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(3px)";
                e.currentTarget.style.boxShadow = "0 2px 0 #26236b";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 0 #26236b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 0 #26236b";
              }}
            >
              {showCulturalRefs
                ? "Hide Cultural References"
                : "Show Cultural References"}
            </button>
            {showCulturalRefs && (
              <ul style={styles.listDisc}>
                {data.cultural_refs.map((ref, i) => (
                  <li style={styles.listitem} key={i}>{ref}</li>
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
                      ? styles.buttonGradeSelected
                      : styles.buttonDefault),
                  }}
                    onMouseDown={(e) => {
                        e.currentTarget.style.transform = "translateY(3px)";
                        e.currentTarget.style.boxShadow = "0 2px 0 #26236b";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 6px 0 #26236b";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 6px 0 #26236b";
                      }}
                >
                  {grade.toUpperCase()}
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
                      ? styles.buttonTypeSelected
                      : styles.buttonDefault),
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "translateY(3px)";
                    e.currentTarget.style.boxShadow = "0 2px 0 #3f3721ff";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 6px 0 #3f3415ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 6px 0 #3f3415ff";
                  }}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel: regenerate + content */}
        <div style={styles.rightColumn}>
          <div style={styles.contentDisplayContainer}>
            <div className="actions" style={styles.actions}>
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
            <div ref={printRef} className="printable-content">
            {selectedType === "diagram" ? (
              <div style={styles.mermaidContainer}>
                {content ? (
                  content.startsWith("data:image/") ||
                  content.startsWith("http") ? (
                    <img
                      src={content}
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
                  <p style={styles.mermaidLoadingText}>
                    Loading diagram...
                  </p>
                )}
              </div>
            ) : (
              <div style={styles.textContent}>
                {content ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                  "No content available for this selection."
                )}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentGenerator;