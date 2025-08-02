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

## 🎥 Demo Video
[**Watch the NeoPaathshala Demo Video**](https://drive.google.com/file/d/1Pselm7ownzSSSMEraUbM3_pA6YvqjMKB/view?usp=sharing)


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

This project is structured into two main folders: `app` (Python backend) and `neo` (React frontend). Follow the steps below to get both services running locally.
### Prerequisites

* Node.js and npm installed
* A Firebase account and a new project created
* Access to Google Cloud Platform for API keys (Gemini, Cloud Translate)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/Anuj3937/NeoPaathshala.git
    cd NeoPaathshala
    ```
### 1. Backend Setup (`app` folder)

The backend is a Python application that serves the core AI logic.

1.  **Navigate to the Backend Directory:**
    Open your terminal and navigate into the `app` folder.
    ```sh
    cd app
    ```

2.  **Create a Virtual Environment:**
    It's highly recommended to create a virtual environment to manage project-specific dependencies.
    ```sh
    # For Windows
    python -m venv venv
    venv\Scripts\activate

    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Required Packages:**
    With your virtual environment activated, install all the necessary Python packages.
    ```sh
    pip install -r requirements.txt
    ```

4.  **Set Up Environment Variables:**
    * Inside the `app` folder, create a new file named `.env`.
    * Copy the following keys into the file and fill in your values.

    ```
    GOOGLE_API_KEY=""
    MAPS_API=""
    SUPPABASE_PWD=""
    ELEVENLABS_API_KEY=""
    GOOGLE_CLIENT_ID=""
    GOOGLE_CLIENT_SECRET=""
    SECRET_KEY=""
    ```
    **Note:** For `SECRET_KEY`, you can generate a secure random string. One way is to run this in a Python shell: `import secrets; secrets.token_hex(32)`.

5.  **Run the Backend Server:**
    Use `uvicorn` to run the FastAPI application. The `--reload` flag automatically restarts the server when you save code changes.
    ```sh
    uvicorn main:app --reload
    ```
    The backend API should now be running, typically on `http://127.0.0.1:8000`.

### 2. Frontend Setup (`neo` folder)

The frontend is a React application built with Vite.

1.  **Navigate to the Frontend Directory:**
    In a **new terminal window**, navigate into the `neo` folder.
    ```sh
    cd neo
    ```

2.  **Install NPM Dependencies:**
    Install all the necessary Node.js packages.
    ```sh
    npm install
    ```

3.  **Run the Frontend Application:**
    Start the frontend development server.
    ```sh
    npm start
    ```
    The React application should now be running, typically on `http://localhost:3000`. Open this URL in your browser to use NeoPaathshala.

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
