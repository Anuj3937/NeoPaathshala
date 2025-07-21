import React, { useState } from "react";

function ContentGenerator({ data, onBack }) {
  const [selectedGrade, setSelectedGrade] = useState(data.grade_levels?.[0]);
  const [selectedType, setSelectedType] = useState(data.content_types?.[0]);

  const getContentFor = (grade, type) => {
    return data.generated_content?.[grade]?.[type] || "No content available for this combination.";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-700">📚 Generated Content</h2>
        <button
          onClick={onBack}
          className="text-sm text-white bg-gray-500 px-3 py-1 rounded hover:bg-gray-600"
        >
          ← Back
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p><strong>Topic:</strong> {data.topic}</p>
          <p><strong>Cultural References:</strong></p>
          <ul className="list-disc ml-6">
            {data.cultural_refs?.map((ref, idx) => (
              <li key={idx}>{ref}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Select Grade:</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.grade_levels?.map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-3 py-1 rounded-md text-sm ${
                selectedGrade === grade
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {grade}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Select Content Type:</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.content_types?.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-md text-sm ${
                selectedType === type
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-md shadow-md mt-4">
        <h4 className="text-md font-semibold mb-2">
          {selectedGrade} - {selectedType}
        </h4>
        <p className="whitespace-pre-wrap">{getContentFor(selectedGrade, selectedType)}</p>
      </div>
    </div>
  );
}

export default ContentGenerator;
