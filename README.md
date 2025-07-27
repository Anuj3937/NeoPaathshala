# NeoPaathshaala

**Build the next generation of intelligent agents to empower teachers in multi-grade classrooms.**

NeoPaathshaala is an AI-powered platform designed to support teachers, especially those in the challenging environment of multi-grade classrooms in rural India. It addresses the critical issues of teacher burnout, the shortage of educators, and the need for personalized, engaging, and culturally relevant educational content.

---

## 🧐 The Problem

* **Teacher Burnout:** Teachers often spend 60-90 minutes preparing for a single lesson. They struggle to meet diverse student needs due to the immense time and effort required to create varied, personalized materials.
* **One-Size-Fits-All Doesn't Work:** Generic educational content often fails to engage students because it lacks cultural relevance and cannot cater to varied learning styles.
* **The Multi-Grade Challenge:** Over 10.2% of schools in India have one teacher responsible for educating multiple grades simultaneously, placing an enormous strain on them to deliver different lessons effectively.
* **Critical Learning Gaps:** Only half of rural Grade 5 students can read texts at a Grade 2 level, highlighting an urgent need for better assessments, personalized learning, and focused support.

---

## ✨ Our Solution: NeoPaathshaala

NeoPaathshaala is an AI assistant that revolutionizes the teaching workflow by providing instant, high-quality, and context-aware educational resources.

### Key Features

* **Instant Lesson Kits:** Go from a simple voice prompt or a textbook photo to a complete lesson kit—including diagrams, stories, and worksheets—in 90 seconds.
* **True Multi-Grade Differentiation:** A single input generates grade-specific worksheets and activities, perfectly tailored for a single-teacher, multi-grade classroom.
* **Cultural & Linguistic Relevance:** Explains complex topics through local folk stories, analogies, and rhymes in the teacher's native language, making concepts easier for students to grasp.
* **Hands-On, Low-Cost Activities:** Suggests engaging DIY models and games using everyday classroom items, promoting interactive and experiential learning.
* **Auto-Planning & Assessments:** Automatically generates weekly teaching plans from a syllabus and creates quizzes and mock tests using Google Forms.
* **Tech-Light & Accessible:** Deployed as a Progressive Web App (PWA), it runs smoothly on low-end smartphones, works offline, supports local languages, and requires no advanced tech skills.

---

## 🛠️ Technology Stack

| Layer                | Technologies                                      |
| :------------------- | :------------------------------------------------ |
| **Frontend** | React.js, Vite, Tailwind, Web Speech API, Tesseract.js |
| **Backend/API** | Gemini 2.5, Firebase Functions                     |
| **Cloud/Infra** | Firebase (Auth, Hosting, Storage, Analytics)      |
| **Progressive Web App** | Vite PWA plugin, IndexedDB, Service Worker        |
| **Multilingual** | Gemini / Cloud Translate, Web TTS                 |

---



---

## 🚀 Getting Started

Follow these instructions to set up and run the project on your local machine for development and testing purposes.

### Prerequisites

* Node.js and npm installed
* A Firebase account and a new project created
* Access to Google Cloud Platform for API keys (Gemini, Cloud Translate)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/neopaathshaala.git](https://github.com/your-username/neopaathshaala.git)
    cd neopaathshaala
    ```

2.  **Install frontend dependencies:**
    ```sh
    npm install
    ```

3.  **Set up Firebase:**
    * Navigate to your Firebase project settings.
    * Get your Firebase configuration object (apiKey, authDomain, etc.).
    * Create a `.env.local` file in the root of the project.
    * Add your Firebase configuration to the `.env.local` file. **Replace the placeholder values with your actual Firebase project keys.**
    ```
    GOOGLE_API_KEY=""
    MAPS_API = ""
    SUPPABASE_PWD = ""
    ELEVENLABS_API_KEY = ""
    GOOGLE_CLIENT_ID=""
    GOOGLE_CLIENT_SECRET=""
    SECRET_KEY="" # Generate a random string for this
    ```

4.  **Set up Backend Functions:**
    * Navigate to the `functions` directory (`cd functions`).
    * Install backend dependencies: `npm install`.
    * Set up your environment variables for the Gemini API key using Firebase Functions configuration:
    ```sh
    firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"
    ```

5.  **Run the development server:**
    * Go back to the root directory (`cd ..`).
    * Start the Vite development server:
    ```sh
    npm run dev
    ```
    The application should now be running on `http://localhost:5173` (or another port if 5173 is busy).

---

## 🔮 Future Scope

* **LMS Integration:** Allow teachers to directly export lesson plans and resources into popular Learning Management Systems like Google Classroom.
* **Student-Facing Quizzes:** Expand content generation to include interactive quizzes and assessments that can be directly administered to students.
* **Analytics & Feedback Loop:** Provide teachers with insights into content effectiveness and allow them to give feedback to fine-tune the AI models.
* **Parallel Task Processing:** Implement parallel processing to generate multiple content types simultaneously, drastically reducing wait times.

---

## 👥 Team

* **Team Name:** NeoPaathshaala
* **Team Leader:** Shabbir Talib
