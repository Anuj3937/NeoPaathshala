// Get color for different subjects
import Select from "react-select";
import jsPDF from "jspdf";
import { Calendar, Filter, Plus, Eye, Trash2, ArrowRight, Coffee } from "lucide-react";
import React, { useState, useEffect ,useRef} from "react";
import { Save,Camera,Printer,FileDown,IterationCw } from "lucide-react";

const WeeklyLessonPlanner = () => {
    const printRef = useRef();
    const getSubjectColor = (subject) => {
    const colors = {
      'Math': '#3b82f6',
      'Science': '#10b981',
      'English': '#8b5cf6',
      'EVS': '#f59e0b',
      'Hindi': '#ef4444',
      'Computer Science': '#06b6d4',
      'Social Science': '#84cc16'
    };
    return colors[subject] || '#6b7280';
  };  // Get lessons for selected date
  const getSelectedDateLessons = () => {
    return filteredData.filter(lesson => lesson.date === selectedDate);
  };
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lessonData, setLessonData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [modalContent, setModalContent] = useState("");
  
  // Filter states
  const [filterGrade, setFilterGrade] = useState([]);
  const [filterSubject, setFilterSubject] = useState([]);
  const [filterTopic, setFilterTopic] = useState([]);
  const [filterContentType, setFilterContentType] = useState([]);

  // Form states (from original component)
  const [subject, setSubject] = useState([]);
  const [grades, setGrades] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saturdaysWorking, setSaturdaysWorking] = useState(false);
  const [secondSaturdayOff, setSecondSaturdayOff] = useState(false);

  const subjectOptions = [
    { value: "Math", label: "Math" },
    { value: "Science", label: "Science" },
    { value: "English", label: "English" },
    { value: "EVS", label: "EVS" },
    { value: "Hindi", label: "Hindi" },
    { value: "Computer Science", label: "Computer Science" },
    { value: "Social Science", label: "Social Science" },
  ];

  const gradeOptions = Array.from({ length: 12 }, (_, i) => ({
    value: `${i + 1}`,
    label: `Grade ${i + 1}`,
  }));

  // Mock user ID - in real app, get from auth
  const userId = "1234";
  const handleDownloadImage = () => {
    if (!modalContent.lesson_type || !modalContent.lesson_type.startsWith("data:image/")) {
      return alert("No image modalContent.lesson_type to download");
    }
    const link = document.createElement("a");
    link.href = modalContent.lesson_type;
    link.download = `grade-${modalContent.lesson_grade}_${modalContent.lesson_type}_${Date.now()}.png`;
    link.click();
  };

function decodeHTMLEntities(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
// const handleSave = async () => {
//   if (!modalContent.lesson_type) return alert("No modalContent.lesson_type to save.");
//   try {
//     await saveContent(modalContent.lesson_grade, modalContent.lesson_type, data.topic, modalContent.lesson_type);
//     alert("✅ modalContent.lesson_type saved successfully.");
//   } catch (e) {
//     console.error("Save failed:", e);
//     alert("❌ Failed to save modalContent.lesson_type.");
//   }
// };

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

  if (modalContent.lesson_type === "diagram" && modalContent.lesson_type.startsWith("data:image/")) {
    // embed image as before…
    const imgProps = doc.getImageProperties(modalContent.lesson_type);
    const imgW = printableWidth;
    const imgH = (imgProps.height * imgW) / imgProps.width;
    doc.addImage(modalContent.lesson_type, "PNG", margin, margin, imgW, imgH);
  } else {
    // 1) Normalize <br> to newline
    let text = modalContent.lesson_content
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
    doc.text(`Grade ${modalContent.lesson_grade} – ${modalContent.lesson_type}`, margin, y);
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

  doc.save(`grade-${modalContent.lesson_grade}_${modalContent.lesson_type}.pdf`);
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
          <h1>Grade ${modalContent.lesson_grade} – ${modalContent.lesson_type}</h1>
          ${
            modalContent.lesson_type === "diagram" && modalContent.lesson_type.startsWith("data:image/")
              ? `<img src="${modalContent.lesson_type}" />`
              : (() => {
                  // convert <br> to paragraphs
                  let html = modalContent.lesson_content || "";
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
  // Fetch existing lesson data
  useEffect(() => {
    fetchLessonData();
  }, []);

  const fetchLessonData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8000/lesson-plans/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        // console.log(data);
        
        // Handle the nested lesson_plans structure and add IDs
        const lessonPlans = data.lesson_plans || [];
        const lessonsWithIds = lessonPlans.map((lesson, index) => ({
          ...lesson,
          id: lesson.id || `lesson_${index}_${Date.now()}` // Add ID if not present
        }));
        
        setLessonData(lessonsWithIds);
        setFilteredData(lessonsWithIds);
        setHasData(lessonsWithIds.length > 0);
      } else {
        setHasData(false);
      }
    } catch (error) {
      console.error("Failed to fetch lesson data:", error);
      setHasData(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if generation is in progress
  // const checkGenerationStatus = async () => {
  //   try {
  //     const response = await fetch(`http://localhost:8000/generation-status/${userId}`);
  //     if (response.ok) {
  //       const status = await response.json();
  //       setIsGenerating(status.is_generating);
  //     }
  //   } catch (error) {
  //     console.error("Failed to check generation status:", error);
  //   }
  // };

  // useEffect(() => {
  //   if (hasData) {
  //     checkGenerationStatus();
  //     const interval = setInterval(checkGenerationStatus, 5000); // Check every 5 seconds
  //     return () => clearInterval(interval);
  //   }
  // }, [hasData]);

  // Filter logic
  useEffect(() => {
    let filtered = lessonData;

    if (filterGrade.length > 0) {
      filtered = filtered.filter(item => filterGrade.includes(item.lesson_grade));
    }
    if (filterSubject.length > 0) {
      filtered = filtered.filter(item => filterSubject.includes(item.lesson_subject));
    }
    if (filterContentType.length > 0) {
      filtered = filtered.filter(item => filterContentType.includes(item.lesson_type.split(":")[0]?.trim() || item.lesson_type));
    }

    setFilteredData(filtered);
  }, [filterGrade, filterSubject, filterTopic, filterContentType, lessonData]);

  // Get unique filter options from data
  const getUniqueGrades = () => [...new Set(lessonData.map(item => item.lesson_grade))].map(grade => ({ value: grade, label: `Grade ${grade}` }));
  const getUniqueSubjects = () => [...new Set(lessonData.map(item => item.lesson_subject))].map(subject => ({ value: subject, label: subject }));
  const getUniqueContentTypes = () =>
  [...new Set(lessonData.map(item => item.lesson_type.split(":")[0]?.trim() || item.lesson_type))]
    .map(type => ({ value: type, label: type }));



  // Calendar helpers
  const getCurrentMonth = () => {
    const date = new Date(selectedDate);
    return {
      year: date.getFullYear(),
      month: date.getMonth()
    };
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateForComparison = (year, month, day) => {
    // console.log(day)
    const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr;
  };

  const getCalendarDays = () => {
    const { year, month } = getCurrentMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // console.log(day);
      days.push(day);
    }
    // console.log(days)
    return days;
  };

  const getLessonsForDate = (year, month, day) => {
    const dateStr = formatDateForComparison(year, month, day);
    return filteredData.filter(lesson => lesson.date === dateStr);
  };

const navigateMonth = (direction) => {
  const currentDate = new Date(selectedDate);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const newDate = new Date(currentYear, currentMonth + direction, 1); // Always go to 1st of new month
  console.log(newDate)
  setSelectedDate(newDate.toISOString().split('T')[0]);
};


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject || grades.length === 0 || !startDate || !endDate) {
      alert("Please fill all fields");
      return;
    }

    const formData = {
      subjects: subject,
      grades,
      start_date: startDate,
      end_date: endDate,
      saturdays_working: saturdaysWorking,
      second_saturday_off: secondSaturdayOff,
      user_id: userId,
    };

    try {
      setIsGenerating(true);
      setShowForm(!showForm)
      const response = await fetch("http://localhost:8000/generate-lesson-plans/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Plan generation started!");
        setShowForm(false);
        setIsGenerating(false);
        // Refresh data after generation
        setTimeout(() => {
          fetchLessonData();
        }, 2000);
      } else {
        const errorData = await response.json();
        alert("Error: " + errorData.detail || response.statusText);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Request failed", error);
      alert("Request failed: " + error.message);
      setIsGenerating(false);
    }
  };

  // Handle lesson actions
  const handleDeleteLesson = async (lessonId) => {
    try {
      const response = await fetch(`http://localhost:8000/lesson-plans/${lessonId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setIsGenerating(false);
        fetchLessonData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to delete lesson:", error);
    }
  };

  const handlePushToTomorrow = async (lessonId) => {
    try {
      const response = await fetch(`http://localhost:8000/lesson-plans/${lessonId}/push-tomorrow`, {
        method: "PUT",
      });
      if (response.ok) {
        fetchLessonData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to push lesson:", error);
    }
  };

  const handleMarkHoliday = async (date) => {
    try {
      const response = await fetch(`http://localhost:8000/mark-holiday`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date, user_id: userId }),
      });
      if (response.ok) {
        fetchLessonData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to mark holiday:", error);
    }
  };

  const handleViewContent = (content) => {
    setModalContent(content);
    setShowContentModal(true);
  };

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div>Loading your lesson plans...</div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div style={styles.container}>
        <div style={styles.form}>
          <h2 style={styles.title}>Weekly Lesson Plan Generator</h2>
          <label style={styles.label}>Subject:</label>
          <Select
            isMulti
            options={subjectOptions}
            value={subjectOptions.filter((opt) => subject.includes(opt.value))}
            onChange={(selected) => setSubject(selected.map((opt) => opt.value))}
            placeholder="Select Subjects"
            styles={customSelectStyles}
          />
          <label style={styles.label}>Grade Levels:</label>
          <Select
            isMulti
            options={gradeOptions}
            value={gradeOptions.filter((opt) => grades.includes(opt.value))}
            onChange={(selected) => setGrades(selected.map((opt) => opt.value))}
            placeholder="Select Grades"
            styles={customSelectStyles}
          />
          <label style={styles.label}>Academic Year Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={styles.input}
          />
          <label style={styles.label}>Academic Year End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={styles.input}
          />
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={saturdaysWorking}
                onChange={() => setSaturdaysWorking(!saturdaysWorking)}
              />
              Saturdays are working
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={secondSaturdayOff}
                onChange={() => setSecondSaturdayOff(!secondSaturdayOff)}
                disabled={!saturdaysWorking}
              />
              Every 2nd Saturday is an holiday
            </label>
          </div>
          <button type="submit" onClick={handleSubmit} style={styles.submitBtn}>
            Generate Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      {/* Left Panel */}
      <div style={styles.leftPanel}>
        {/* Filters */}
        <div style={styles.filterContainer}>
          <div style={styles.filterHeader}>
            <Filter size={20} />
            <h3>Filters</h3>
          </div>
          
          <div style={styles.filterItem}>
            <label>Grade:</label>
            <Select
              isMulti
              options={getUniqueGrades()}
              value={getUniqueGrades().filter(opt => filterGrade.includes(opt.value))}
              onChange={(selected) => setFilterGrade(selected.map(opt => opt.value))}
              placeholder="All Grades"
              styles={filterSelectStyles}
            />
          </div>

          <div style={styles.filterItem}>
            <label>Subject:</label>
            <Select
              isMulti
              options={getUniqueSubjects()}
              value={getUniqueSubjects().filter(opt => filterSubject.includes(opt.value))}
              onChange={(selected) => setFilterSubject(selected.map(opt => opt.value))}
              placeholder="All Subjects"
              styles={filterSelectStyles}
            />
          </div>

          <div style={styles.filterItem}>
            <label>Content Type:</label>
            <Select
              isMulti
              options={getUniqueContentTypes()}
              value={getUniqueContentTypes().filter(opt => filterContentType.includes(opt.value))}
              onChange={(selected) => setFilterContentType(selected.map(opt => opt.value))}
              placeholder="All Types"
              styles={filterSelectStyles}
            />
          </div>
        </div>

        {/* Calendar */}
        <div style={styles.calendarContainer}>
          <div style={styles.calendarHeader}>
            <Calendar size={20} />
            <h3>Calendar</h3>
          </div>
          
          <div style={styles.calendarNavigation}>
            <button onClick={() => navigateMonth(-1)} style={styles.navButton}>‹</button>
            <span style={styles.monthYear}>
              {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => navigateMonth(1)} style={styles.navButton}>›</button>
          </div>
          
          <div style={styles.calendarGrid}>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={styles.dayHeader}>{day}</div>
            ))}
            
            {/* Calendar days */}
            {getCalendarDays().map((day, index) => {
              if (!day) {
                return <div key={index} style={styles.emptyDay}></div>;
              }
              // console.log(day)
              const { year, month } = getCurrentMonth();
              const dateStr = formatDateForComparison(year, month, day);
              const dayLessons = getLessonsForDate(year, month, day);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              // console.log("Is today:",dateStr,isToday,new Date().toISOString().split('T')[0]);
              
              return (
                <div
                  key={day}
                  style={styles.calendarDay}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <div key={day} style={{                    
                  ...styles.dayNumber,
                    ...(isSelected && styles.selecteddayNumber),
                    ...(isToday && styles.todaydayNumber)}}>{day}</div>
                  <div style={styles.lessonsContainer}>
                    {dayLessons.slice(0, 3).map((lesson, lessonIndex) => (
                      <div
                        key={lessonIndex}
                        style={{
                          ...styles.lessonBar,
                          backgroundColor: getSubjectColor(lesson.lesson_subject)
                        }}
                        title={`${lesson.lesson_subject} - ${lesson.lesson_type}`}
                      >
                        <span style={styles.lessonText}>
                          {lesson.lesson_subject.substring(0, 8)}
                        </span>
                      </div>
                    ))}
                    {dayLessons.length > 3 && (
                      <div style={styles.moreLessons}>+{dayLessons.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        {/* Add More Button */}
        <div style={styles.addContainer}>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={isGenerating}
            style={{
              ...styles.addButton,
              backgroundColor: isGenerating ? '#ccc' : '#2563eb'
            }}
          >
            {isGenerating ? (
              <>Generating Content...</>
            ) : (
              <>
                <Plus size={16} />
                Add More
              </>
            )}
          </button>
        </div>

        {/* Selected Date Details */}
        <div style={styles.detailsContainer}>
          <div style={styles.detailsHeader}>
            <h3>
              {selectedDate} - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}
            </h3>
            <button
              onClick={() => handleMarkHoliday(selectedDate)}
              style={styles.holidayButton}
            >
              <Coffee size={16} />
              Mark as Holiday
            </button>
          </div>

          <div style={styles.lessonsList}>
            {getSelectedDateLessons().map((lesson, index) => (
              <div key={index} style={styles.lessonCard}>
                <div style={styles.lessonInfo}>
                  <div>
                    <strong>{lesson.lesson_subject}</strong> - Grade {lesson.lesson_grade}
                  </div>
                  <div style={styles.lessonType}>{lesson.lesson_type}</div>
                </div>
                <div style={styles.lessonActions}>
                  <button
                    onClick={() => handleViewContent(lesson)}
                    style={styles.actionButton}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handlePushToTomorrow(lesson.id)}
                    style={styles.actionButton}
                  >
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteLesson(lesson.id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {getSelectedDateLessons().length === 0 && (
              <div style={styles.noLessons}>No lessons for this date</div>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>Add More Lesson Plans</h3>
              <button
                onClick={() => setShowForm(false)}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>
            <div>
              <label style={styles.label}>Subject:</label>
              <Select
                isMulti
                options={subjectOptions}
                value={subjectOptions.filter((opt) => subject.includes(opt.value))}
                onChange={(selected) => setSubject(selected.map((opt) => opt.value))}
                placeholder="Select Subjects"
                styles={customSelectStyles}
              />
              <label style={styles.label}>Grade Levels:</label>
              <Select
                isMulti
                options={gradeOptions}
                value={gradeOptions.filter((opt) => grades.includes(opt.value))}
                onChange={(selected) => setGrades(selected.map((opt) => opt.value))}
                placeholder="Select Grades"
                styles={customSelectStyles}
              />
              <label style={styles.label}>Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={styles.input}
              />
              <label style={styles.label}>End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={styles.input}
              />
              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={saturdaysWorking}
                    onChange={() => setSaturdaysWorking(!saturdaysWorking)}
                  />
                  Saturdays are working
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={secondSaturdayOff}
                    onChange={() => setSecondSaturdayOff(!secondSaturdayOff)}
                    disabled={!saturdaysWorking}
                  />
                  Every 2nd Saturday is an holiday
                </label>
              </div>
              <button type="submit" onClick={handleSubmit} style={styles.submitBtn}>
                Generate Additional Plans
              </button>
                          </div>
          </div>
        </div>
      )}

      {/* Content Modal */}
{/* Content Modal */}
{showContentModal && (
  <div style={styles.modal}>
    <div style={styles.contentModal}>
      <div style={styles.modalHeader}>
        <h3>Lesson Content</h3>
        <button
          onClick={() => setShowContentModal(false)}
          style={styles.closeButton}
        >
          ×
        </button>
      </div>
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
            {/* <button onClick={handleSave} style={styles.saveButton}
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
          </button> */}
            {modalContent.lesson_type === "diagram" ? (
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
      <div style={styles.contentBody}>
        <h4>Grade:{modalContent.lesson_grade || "Grade not found"}</h4>
        <h4>Topic:{modalContent.lesson_topic || "Topic not found"}</h4>
        <h4>Type:{modalContent.lesson_type || "Type of content not found"}</h4>
        {modalContent ? (
          modalContent.lesson_type.startsWith("data:image/") || modalContent.lesson_type.startsWith("http") ? (
            <img
              src={modalContent.lesson_content}
              alt="Generated diagram"
              style={{
                maxWidth: "100%",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: modalContent.lesson_content }} />
          )
        ) : (
          <p style={styles.mermaidLoadingText}>Loading diagram...</p>
        )}
      </div>
    </div>
    </div>
  </div>
)}
    </div>
)};

const customSelectStyles = {
  control: (base) => ({
    ...base,
    borderColor: "#cbd5e1",
    boxShadow: "none",  
    "&:hover": { borderColor: "#6366f1" },
    fontSize: "1rem"
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#c6d2fcff",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#1e3a8a",
    fontSize: "1.05rem",
  }),
};

const filterSelectStyles = {
  control: (base) => ({
    ...base,
    borderColor: "#cbd5e1",
    boxShadow: "none",
    "&:hover": { borderColor: "#6366f1" },
    fontSize: "0.875rem",
    minHeight: "32px"
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#e3f2fd",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#1565c0",
    fontSize: "0.875rem",
  }),
};

const styles = {
  container: {
    maxHeight: "0%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#634d4dff",
    overflow:"hidden",
  },
  loading: {
    minHeight: "80%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
    color: "#46484dff",
  },
  dashboard: {
    display: "flex",
    backgroundColor: "#f3f4f6",
    overflow:"hidden",
  },
  leftPanel: {
    width: "35%",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    maxHeight:"fit-content",
  },
  rightPanel: {
    flex: 1,
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    height:"100vh",
    gap: "1rem",
  },
  filterContainer: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  filterHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  filterItem: {
    marginBottom: "1rem",
  },
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    flex: 1,
    maxHeight:"fit-content",
    with:"fit-content"
  },
  calendarHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  calendarNavigation: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  navButton: {
    background: "none",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    padding: "0.5rem 0.75rem",
    cursor: "pointer",
    fontSize: "1.25rem",
  },
  monthYear: {
    fontSize: "1.125rem",
    fontWeight: "600",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "1px",
    backgroundColor: "#e5e7eb",
    border: "1px solid #e5e7eb",
  },
  dayHeader: {
    backgroundColor: "#f3f4f6",
    padding: "0.5rem",
    textAlign: "center",
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#374151",
  },
  emptyDay: {
    backgroundColor: "#fff",
    minHeight: "80px",
  },
  calendarDay: {
    backgroundColor: "#fff",
    minHeight: "80px",
    padding: "0.25rem",
    cursor: "pointer",
    position: "relative",
    "&:hover": {
      backgroundColor: "#f9fafb",
    },
  },
  dayNumber: {
    fontSize: "0.875rem",
    fontWeight: "500",
    marginBottom: "0.25rem",
  },
    selecteddayNumber: {
    border:"1px solid #bbd8fdff",
    borderRadius:"50px",
    // fontSize:"16px", 
    padding:"4px",
    width:"fit-content",
    color:"#363636ff",
    backgroundColor: "#bbd8fdff",
  },
  todaydayNumber: {
        border:"1px solid #fceeb8ff",
        borderRadius:"50px",
        // fontSize:"16px",
        padding:"4px",
        width:"fit-content",
        backgroundColor: "#fceeb8ff",
  },
  lessonsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    overflow:"auto",
  },
  lessonBar: {
    padding: "1px 4px",
    borderRadius: "2px",
    fontSize: "0.625rem",
    color: "#fff",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  lessonText: {
    fontSize: "0.625rem",
  },
  moreLessons: {
    fontSize: "0.625rem",
    color: "#6b7280",
    marginTop: "1px",
  },
  addContainer: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  addButton: {
    width: "100%",
    padding: "0.75rem",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontSize: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  detailsContainer: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    // overflow:"auto",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    flex: 1,
    maxHeight:"68%",
  },
  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "1rem",
  },
  holidayButton: {
    padding: "0.5rem 1rem",
    border: "1px solid #f59e0b",
    borderRadius: "6px",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  lessonsList: {
    display: "flex",
    flexDirection: "column",
    // border:"1px solid red",
    gap: "0.75rem",
    overflow:"auto",
    maxHeight:"90%",
  },
  lessonCard: {
    padding: "1rem",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  lessonInfo: {
    flex: 1,
  },
  lessonType: {
    color: "#6b7280",
    fontSize: "0.875rem",
    marginTop: "0.25rem",
  },
  lessonActions: {
    display: "flex",
    gap: "0.5rem",
  },
  actionButton: {
    padding: "0.5rem",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#e5e7eb",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  deleteButton: {
    padding: "0.5rem",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  noLessons: {
    textAlign: "center",
    color: "#6b7280",
    fontStyle: "italic",
    padding: "2rem",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "2rem",
    maxWidth: "600px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  contentModal: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "2rem",
    maxWidth: "800px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "1rem",
  },
  closeButton: {
    border: "none",
    background: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#6b7280",
  },
  contentBody: {
    lineHeight: 1.6,
    color: "#374151",
  },
  form: {
    maxWidth: "600px",
    padding: "2rem",
    background: "#f9fafb",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: "1.75rem",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  label: {
    marginTop: "1rem",
    marginBottom: "0.25rem",
    fontSize: "1rem",
    display: "block",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    padding: "0.6rem",
    marginTop: "0.3rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  checkboxGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    marginTop: "1.5rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "1rem",
  },
  submitBtn: {
    marginTop: "2rem",
    background: "#2563eb",
    color: "#fff",
    padding: "0.8rem 1.5rem",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    width: "100%",
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
      actions:{
      display:'flex',
      gap:'12px',
    }
};

export default WeeklyLessonPlanner;