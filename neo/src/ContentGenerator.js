import React, { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";

// Initialize Mermaid once (global setting is fine here as it's not tied to component state)
mermaid.initialize({
  startOnLoad: false, // Crucial: We will manually render
  theme: 'default',   // Or 'dark', 'forest', 'neutral' based on your preference
  securityLevel: 'loose', // Be cautious if 'content' can come from untrusted sources
  // Add other configurations as needed for your specific diagram types
  flowchart: {
    curve: 'basis',
  },
  class: {
    // class diagram specific options
  },
  // ... other diagram type configurations
});

function ContentGenerator({ data, onBack }) {
  const [selectedGrade, setSelectedGrade] = useState(data.grade_levels?.[0]);
  const [selectedType, setSelectedType] = useState(data.content_types?.[0]);
  const diagramRef = useRef(null); // Ref for the div where Mermaid will render

  const content = data.generated_content?.[selectedGrade]?.[selectedType];

  useEffect(() => {
    if (selectedType === "diagram" && content && diagramRef.current) {
      const mermaidCode = content.replace(/```mermaid|```/g, "").trim();
      const diagramId = `mermaid-chart-${selectedGrade}-${selectedType}-${Date.now()}`; // Ensure unique ID

      // Clear previous content in the ref'd div
      diagramRef.current.innerHTML = '';

      mermaid.render(diagramId, mermaidCode)
        .then(({ svg, bindFunctions }) => {
          diagramRef.current.innerHTML = svg;
          // if (bindFunctions) bindFunctions(diagramRef.current);
        })
        .catch((error) => {
          console.error("Mermaid rendering failed:", error);
          diagramRef.current.innerHTML = `<p style="color: red; padding: 20px; text-align: center;">⚠️ Failed to render diagram. Error: ${error.message}</p>`;
        });
    }
  }, [selectedGrade, selectedType, content]);

  // Inline styles object for ContentGenerator
  const styles = {
    container: {
      maxWidth: '960px', // max-w-4xl is ~896px, adjusting slightly
      margin: 'auto', // mx-auto
      padding: '24px', // p-6
      backgroundColor: 'white', // bg-white
      borderRadius: '8px', // rounded-lg
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', // shadow-xl
      marginTop: '32px', // my-8 (half of it)
      marginBottom: '32px', // my-8 (half of it)
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px', // mb-6
    },
    headerTitle: {
      fontSize: '24px', // text-2xl
      fontWeight: 'bold',
      color: '#4f46e5', // text-indigo-700
    },
    backButton: {
      fontSize: '14px', // text-sm
      color: 'white',
      backgroundColor: '#6b7280', // bg-gray-500
      padding: '8px 12px', // px-3 py-1
      borderRadius: '6px', // rounded
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.15s ease-in-out', // hover:bg-gray-600
    },
    backButtonHover: {
      backgroundColor: '#4b5563', // Hover state
    },
    infoSection: {
      marginBottom: '24px', // mb-6
      padding: '16px', // p-4
      backgroundColor: '#f9fafb', // bg-gray-50
      borderRadius: '6px', // rounded-md
      border: '1px solid #e5e7eb', // border border-gray-200
      lineHeight: '1.5',
    },
    infoText: {
      color: '#374151', // text-gray-700
    },
    listDisc: {
      listStyleType: 'disc',
      marginLeft: '24px', // ml-6
      color: '#4b5563', // text-gray-600
    },
    selectionSection: {
      marginBottom: '24px', // mb-6
      padding: '16px', // p-4
      backgroundColor: '#f9fafb', // bg-gray-50
      borderRadius: '6px', // rounded-md
      border: '1px solid #e5e7eb', // border border-gray-200
    },
    selectionTitle: {
      fontSize: '18px', // text-lg
      fontWeight: 'semibold',
      color: '#1f2937', // text-gray-800
      marginBottom: '12px', // mb-3
    },
    buttonGroup: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px', // gap-2
      marginTop: '8px', // mt-2
    },
    buttonBase: {
      padding: '8px 16px', // px-4 py-2
      borderRadius: '8px', // rounded-lg
      fontSize: '14px', // text-sm
      fontWeight: '500', // font-medium
      transition: 'all 0.2s ease-in-out', // transition duration-200 ease-in-out
      border: 'none',
      cursor: 'pointer',
      outline: 'none',
    },
    buttonDefault: {
      backgroundColor: '#e5e7eb', // bg-gray-200
      color: '#4b5563', // text-gray-700
    },
    buttonDefaultHover: {
      backgroundColor: '#d1d5db', // hover:bg-gray-300
    },
    buttonGradeSelected: {
      backgroundColor: '#4f46e5', // bg-indigo-600
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)', // shadow-md
    },
    buttonGradeSelectedFocus: {
      boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.75)', // focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75
    },
    buttonTypeSelected: {
      backgroundColor: '#16a34a', // bg-green-600
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)', // shadow-md
    },
    buttonTypeSelectedFocus: {
      boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.75)', // focus:ring-2 focus:ring-green-400 focus:ring-opacity-75
    },
    contentDisplayContainer: {
      backgroundColor: '#f3f4f6', // bg-gray-100
      padding: '24px', // p-6
      borderRadius: '8px', // rounded-lg
      boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)', // shadow-inner
      border: '1px solid #e5e7eb', // border border-gray-200
    },
    contentTitle: {
      fontSize: '20px', // text-xl
      fontWeight: 'bold',
      color: '#111827', // text-gray-900
      marginBottom: '16px', // mb-4
      paddingBottom: '8px', // pb-2
      borderBottom: '1px solid #d1d5db', // border-b border-gray-300
    },
    mermaidContainer: {
      overflow: 'auto', // overflow-auto
      maxHeight: '600px', // max-h-[600px]
      backgroundColor: '#1f2937', // bg-gray-900
      color: 'white', // text-white
      padding: '16px', // p-4
      borderRadius: '6px', // rounded-md
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', // shadow-lg
      display: 'flex', // flex
      justifyContent: 'center', // justify-center
      alignItems: 'center', // items-center
      minHeight: '200px', // minHeight
    },
    mermaidLoadingText: {
      color: '#9ca3af', // text-gray-400
    },
    textContent: {
      whiteSpace: 'pre-wrap', // whitespace-pre-wrap
      padding: '16px', // p-4
      backgroundColor: 'white', // bg-white
      borderRadius: '6px', // rounded-md
      border: '1px solid #d1d5db', // border border-gray-300
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // shadow-sm
      overflow: 'auto', // overflow-auto
      maxHeight: '600px', // max-h-[600px]
    },
  };


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>📚 Generated Content</h2>
        <button
          onClick={onBack}
          style={styles.backButton}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.backButtonHover.backgroundColor}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.backButton.backgroundColor}
        >
          ← Back
        </button>
      </div>

      <div style={styles.infoSection}>
        <div>
          <p style={styles.infoText}><strong>Topic:</strong> {data.topic}</p>
          <p style={styles.infoText}><strong>Cultural References:</strong></p>
          <ul style={styles.listDisc}>
            {data.cultural_refs?.map((ref, idx) => (
              <li key={idx}>{ref}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={styles.selectionSection}>
        <h3 style={styles.selectionTitle}>Select Grade:</h3>
        <div style={styles.buttonGroup}>
          {data.grade_levels?.map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              style={{
                ...styles.buttonBase,
                ...(selectedGrade === grade ? styles.buttonGradeSelected : styles.buttonDefault),
              }}
              onMouseOver={(e) => {
                if (selectedGrade !== grade) e.currentTarget.style.backgroundColor = styles.buttonDefaultHover.backgroundColor;
              }}
              onMouseOut={(e) => {
                if (selectedGrade !== grade) e.currentTarget.style.backgroundColor = styles.buttonDefault.backgroundColor;
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
          {data.content_types?.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                ...styles.buttonBase,
                ...(selectedType === type ? styles.buttonTypeSelected : styles.buttonDefault),
              }}
              onMouseOver={(e) => {
                if (selectedType !== type) e.currentTarget.style.backgroundColor = styles.buttonDefaultHover.backgroundColor;
              }}
              onMouseOut={(e) => {
                if (selectedType !== type) e.currentTarget.style.backgroundColor = styles.buttonDefault.backgroundColor;
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Inner Container for Displayed Content */}
      <div style={styles.contentDisplayContainer}>
        <h4 style={styles.contentTitle}>
          {selectedGrade} - {selectedType}
        </h4>

        {selectedType === "diagram" ? (
          <div ref={diagramRef} style={styles.mermaidContainer}>
            {!content && <p style={styles.mermaidLoadingText}>Loading diagram...</p>}
          </div>
        ) : (
          <pre style={styles.textContent}>
            {content || "No content available for this selection."}
          </pre>
        )}
      </div>
    </div>
  );
}

export default ContentGenerator;