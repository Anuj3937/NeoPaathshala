import React, { useState, useRef } from "react";
import { Save, Camera, Printer, FileDown, IterationCw, ArrowLeft, Image } from "lucide-react";
import jsPDF from "jspdf";
import "./print.css";
import { saveContent } from './storage';

function ContentGenerator({ data, onBack, setResponseData }) {
    const printRef = useRef();
    const [selectedGrade, setSelectedGrade] = useState(data.grade_levels?.[0]);
    const [selectedType, setSelectedType] = useState(data.content_types?.[0]);
    const [showCulturalRefs, setShowCulturalRefs] = useState(false);

    const [interactiveStoryData, setInteractiveStoryData] = useState(null);
    const [loadingInteractiveStory, setLoadingInteractiveStory] = useState(false);
    const [interactiveStoryError, setInteractiveStoryError] = useState(null);

    // Pull out the piece of generated content for the current grade/type
    // This 'content' variable will now hold either a string (for text/diagram)
    // or an object (for interactive_story)
    const content = data.generated_content?.[selectedGrade]?.[selectedType];

    const handleDownloadImage = () => {
        // Only attempt to use startsWith if content is a string
        if (typeof content === 'string' && content.startsWith("data:image/")) {
            const link = document.createElement("a");
            link.href = content;
            link.download = `grade-${selectedGrade}_${selectedType}_${Date.now()}.png`;
            link.click();
        } else {
            return alert("No image content to download for the current selection.");
        }
    };

    const handleGenerateVisualStory = async () => {
        // Ensure the selected type is 'story' for this action
        if (selectedType !== "story" || !data.topic || !selectedGrade || !data.language || !content) {
            console.warn("Cannot generate interactive story: Missing selected type ('story'), topic, grade, language, or original story content.");
            return;
        }

        // Check if the current 'content' (which is the original story text) is actually a string
        if (typeof content !== 'string') {
            alert("Please select a 'story' type content to generate a visual story from.");
            return;
        }

        setLoadingInteractiveStory(true);
        setInteractiveStoryError(null);
        setInteractiveStoryData(null); // Clear previous interactive story data

        try {
            const res = await fetch("http://localhost:8000/generate_visual_story/", { // Your endpoint
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    story_text: content, // Pass the original story text
                    topic: data.topic,
                    selected_language: data.language,
                    grade_level: selectedGrade,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`Interactive story generation failed: ${res.status}, detail: ${errorData.detail || 'Unknown error'}`);
            }

            const responseData = await res.json();
            console.log("Interactive Story Response:", responseData);

            if (responseData.segments && Array.isArray(responseData.segments)) {
                // When successfully generated, set the selectedType to 'interactive_story'
                // and update the main data structure accordingly.
                setSelectedType("interactive_story"); // <--- Crucial: Switch to the new type
                setInteractiveStoryData(responseData);

                setResponseData(prev => ({
                    ...prev,
                    generated_content: {
                        ...prev.generated_content,
                        [selectedGrade]: {
                            ...prev.generated_content[selectedGrade],
                            // Store the interactive story data under the 'interactive_story' key
                            "interactive_story": responseData
                        }
                    }
                }));
            } else {
                throw new Error("Invalid interactive story response format: 'segments' array missing.");
            }

        } catch (error) {
            console.error("Error generating interactive story:", error);
            setInteractiveStoryError("Failed to generate interactive story: " + error.message);
            setInteractiveStoryData(null);
        } finally {
            setLoadingInteractiveStory(false);
        }
    };

    function decodeHTMLEntities(html) {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

    const handleSave = async () => {
        // Determine content to save based on selectedType
        let contentToSave;
        if (selectedType === "interactive_story") {
            contentToSave = interactiveStoryData;
        } else {
            contentToSave = content; // 'content' here is the string for text/diagrams
        }

        if (!contentToSave || (Array.isArray(contentToSave) && contentToSave.length === 0)) {
            return alert("No content to save.");
        }
        try {
            // Adjust saveContent to potentially handle objects for interactive_story
            await saveContent(selectedGrade, selectedType, data.topic, contentToSave);
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

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;
        const printableWidth = (pageWidth + margin * 2) * 1.25;

        // Handle Interactive Story PDF export
        if (selectedType === "interactive_story" && interactiveStoryData && interactiveStoryData.segments?.length > 0) {
            let y = margin;
            doc.setFontSize(18);
            doc.text(`Interactive Story: ${interactiveStoryData.metadata.topic}`, margin, y);
            y += 24;
            doc.setFontSize(14);
            doc.text(`Grade: ${interactiveStoryData.metadata.grade_level} | Language: ${interactiveStoryData.metadata.language}`, margin, y);
            y += 36;

            interactiveStoryData.segments.forEach((seg, index) => {
                if (y > doc.internal.pageSize.getHeight() - margin - 50) {
                    doc.addPage();
                    y = margin;
                }
                doc.setFontSize(12);
                doc.text(`Part ${index + 1}:`, margin, y);
                y += 16;
                doc.setFontSize(10);
                const narrationLines = doc.splitTextToSize(seg.narration_text, printableWidth);
                doc.text(narrationLines, margin, y);
                y += (narrationLines.length * 12) + 10;

                if (seg.image_base64) {
                    const imgProps = doc.getImageProperties(seg.image_base64);
                    const imgW = printableWidth * 0.8;
                    const imgH = (imgProps.height * imgW) / imgProps.width;
                    if (y + imgH > doc.internal.pageSize.getHeight() - margin) {
                        doc.addPage();
                        y = margin;
                    }
                    doc.addImage(seg.image_base64, "PNG", margin + (printableWidth - imgW) / 2, y, imgW, imgH);
                    y += imgH + 20;
                }
                y += 20;
            });

        } else if (selectedType === "diagram" && typeof content === 'string' && content.startsWith("data:image/")) {
            const imgProps = doc.getImageProperties(content);
            const imgW = printableWidth;
            const imgH = (imgProps.height * imgW) / imgProps.width;
            doc.addImage(content, "PNG", margin, margin, imgW, imgH);
        } else if (typeof content === 'string') { // Ensure 'content' is a string for text-based types
            let text = content
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<strong>([\s\S]*?)<\/strong>/gi, (_, inner) => {
                    return inner.toUpperCase();
                });
            text = decodeHTMLEntities(text);
            text = text.replace(/<[^>]+>/g, "");

            const lines = doc.splitTextToSize(text, printableWidth);

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
        } else {
            // Handle cases where content is not a string (e.g., initially null or an object for other types)
            alert("No displayable content to download as PDF for the current selection.");
            return;
        }

        doc.save(`grade-${selectedGrade}_${selectedType}.pdf`);
    };

    // 3️⃣ Print via window.print (uses your CSS @media print rules)
    const printableFrameRef = useRef(null);

    const handlePrint = () => {
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
                        audio { width: 100%; margin: 10px 0; }
                        .interactive-segment { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
                        .interactive-segment h4 { font-weight: bold; margin-bottom: 8px; }
                    </style>
                </head>
                <body>
                    <h1>Grade ${selectedGrade} – ${selectedType}</h1>
                    ${
                        selectedType === "interactive_story" && interactiveStoryData && interactiveStoryData.segments?.length > 0
                            ? `
                            <h2>Topic: ${interactiveStoryData.metadata.topic}</h2>
                            <h3>Grade: ${interactiveStoryData.metadata.grade_level} | Language: ${interactiveStoryData.metadata.language}</h3>
                            <div class="interactive-story-container">
                                ${interactiveStoryData.segments.map((seg, index) => `
                                    <div class="interactive-segment">
                                        <h4>Part ${index + 1}</h4>
                                        <p>${seg.narration_text}</p>
                                        ${seg.audio_base64 ? `<audio controls src="${seg.audio_base64}" type="audio/mp3">Your browser does not support the audio element.</audio>` : ''}
                                        ${seg.image_base64 ? `<img src="${seg.image_base64}" alt="Visual ${index + 1}" />` : ''}
                                    </div>
                                `).join('')}
                            </div>
                            `
                            : selectedType === "diagram" && typeof content === 'string' && content.startsWith("data:image/")
                            ? `<img src="${content}" />`
                            : (() => {
                                // convert <br> to paragraphs
                                let html = typeof content === 'string' ? content : ""; // Ensure 'content' is a string here
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

        frame.onload = () => {
            frame.contentWindow.focus();
            frame.contentWindow.print();
        };
    };

    const handleRegen = async (grade, contentType) => {
        try {
            // Clear interactive story data if switching to a non-interactive type
            // or if regenerating the *same* interactive story type (it will be re-fetched)
            if (contentType !== "interactive_story" || (contentType === "interactive_story" && selectedType === "interactive_story")) {
                setInteractiveStoryData(null);
            }

            // If regenerating a 'story' type to turn it into an 'interactive_story'
            // you might want to call handleGenerateVisualStory directly
            if (contentType === "interactive_story") {
                // To regenerate an interactive story, we need the original story text.
                // Assuming 'story' is the base text type that can be converted.
                const originalStoryText = data.generated_content?.[grade]?.["story"];
                if (typeof originalStoryText === 'string') {
                    // Temporarily set selectedType to "story" so handleGenerateVisualStory picks up the correct content
                    setSelectedType("story"); // Important for handleGenerateVisualStory to pick the original story text
                    await handleGenerateVisualStory(); // Call the specialized function
                } else {
                    alert("Cannot regenerate interactive story: Original story content not found or not a string.");
                }
                return; // Exit after calling specialized function
            }


            const promptString = `Generate a ${contentType} for grade ${grade} on the topic "${data.topic}"`;
            const res = await fetch("http://localhost:8000/parse_and_map/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: promptString,
                    selected_language: data.language
                }),
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
                        updated.generated_content[grade]?.[contentType],
                };
                return updated;
            });

            // No special handling needed here for interactive_story as it's handled by handleGenerateVisualStory
            // Just refresh the displayed content
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
            color: "var(--text-primary])", // Fix typo: removed space
            fontSize: "24px",
            fontWeight: '500',
        },
        listDisc: {
            listStyleType: "disc",
            marginLeft: "24px",
            color: "var(--text-secondary)",
            fontSize: "16px",
            paddingTop: '10px'
        },
        listItem: {
            marginBottom: '8px',
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
            fontSize: '14px',
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
            position: "relative",
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
            minHeight: '400px',
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
        interactiveStoryButton: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 14px",
            fontSize: "16px",
            color: "white",
            backgroundColor: "#5f1ea3",
            border: "none",
            borderRadius: "30px",
            cursor: "pointer",
            marginBottom: "12px",
            boxShadow: "0 6px 0 #2c0830ff, 0 8px 15px rgba(0, 0, 0, 0.2)",
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
        interactiveSegment: {
            backgroundColor: '#f9f9f9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #eee',
        },
        interactiveSegmentTitle: {
            fontWeight: 'bold',
            fontSize: '1.2rem',
            marginBottom: '10px',
            color: '#333',
        },
        interactiveSegmentImage: {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '4px',
            marginTop: '10px',
            marginBottom: '10px',
        },
        interactiveSegmentAudio: {
            width: '100%',
            marginTop: '10px',
            marginBottom: '10px',
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
                            {/* Add a button for "interactive_story" if it's not in content_types */}
                            {!data.content_types.includes("interactive_story") && (
                                <button
                                    key="interactive_story"
                                    onClick={() => setSelectedType("interactive_story")}
                                    style={{
                                        ...styles.buttonBase,
                                        ...(selectedType === "interactive_story"
                                            ? styles.buttonSelectedType
                                            : styles.buttonDefault),
                                    }}
                                >
                                    interactive_story
                                </button>
                            )}
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
                            {/* Button for generating Interactive Story - Only show if current type is "story" AND no interactive story already exists for this grade */}
                            {selectedType === "story" && typeof content === 'string' && !interactiveStoryData && (
                                <button
                                    style={styles.interactiveStoryButton}
                                    onClick={handleGenerateVisualStory}
                                    disabled={loadingInteractiveStory}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.transform = "scale(0.95)";
                                        e.currentTarget.style.boxShadow = "0 2px 0 #5f1ea3";
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.boxShadow =
                                            "0 6px 0 #5f1ea3, 0 8px 15px rgba(0, 0, 0, 0.2)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.boxShadow =
                                            "0 6px 0 #5f1ea3, 0 8px 15px rgba(0, 0, 0, 0.2)";
                                    }}
                                >
                                    <Image />
                                    {loadingInteractiveStory ? "Generating..." : "Generate Visual Story"}
                                </button>
                            )}

                            {/* Download Image Button - Only for diagram type with image content */}
                            {selectedType === "diagram" && typeof content === 'string' && content.startsWith("data:image/") && (
                                <button onClick={handleDownloadImage} style={styles.dwnldButton}>
                                    <FileDown /> Download Image
                                </button>
                            )}
                            <button onClick={handleDownloadPDF} style={styles.dwnldButton}>
                                <FileDown /> Download PDF
                            </button>
                            <button onClick={handlePrint} style={styles.printButton}>
                                <Printer /> Print
                            </button>
                        </div>

                        {/* Display Content based on selectedType */}
                        <div style={styles.contentBox} ref={printRef}>
                            {loadingInteractiveStory && <p>Generating visual story, please wait...</p>}
                            {interactiveStoryError && <p style={{ color: 'red' }}>Error: {interactiveStoryError}</p>}

                            {selectedType === "interactive_story" && interactiveStoryData ? (
                                <div className="interactive-story-display">
                                    <h3>{interactiveStoryData.metadata.topic}</h3>
                                    <p>Grade: {interactiveStoryData.metadata.grade_level} | Language: {interactiveStoryData.metadata.language}</p>
                                    {interactiveStoryData.segments.map((seg, index) => (
                                        <div key={index} style={styles.interactiveSegment}>
                                            <h4 style={styles.interactiveSegmentTitle}>Part {index + 1}</h4>
                                            <p>{seg.narration_text}</p>
                                            {seg.audio_base64 && (
                                                <audio controls src={seg.audio_base64.replace("audio/mp3_44100_128", "audio/mpeg")} style={styles.interactiveSegmentAudio}>
                                                    Your browser does not support the audio element.
                                                </audio>
                                            )}
                                            {seg.image_base64 && (
                                                <img
                                                    src={seg.image_base64}
                                                    alt={`Visual for part ${index + 1}`}
                                                    style={styles.interactiveSegmentImage}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : selectedType === "diagram" && typeof content === 'string' && content.startsWith("data:image/") ? (
                                <img src={content} alt="Generated Diagram" style={{ maxWidth: "100%", height: "auto" }} />
                            ) : typeof content === 'string' ? (
                                <div
                                    style={styles.textContent}
                                    dangerouslySetInnerHTML={{ __html: decodeHTMLEntities(content.replace(/\n/g, '<br/>')) }}
                                />
                            ) : (
                                <p>Select a grade and content type to display.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContentGenerator;