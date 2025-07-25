# Sahayak AI - Your AI-Powered Teaching Assistant

This is a Next.js application built with Firebase Studio that acts as an AI-powered teaching assistant for multi-grade classrooms. It can generate lesson plans, visual aids, worksheets, and more, all localized to various regional languages.

## Getting Started

To get this project up and running on your local machine, please follow the steps below.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running Locally

1.  **Download the Code**

    First, you'll need to get the code onto your machine. If this were a Git repository, you would clone it. For now, simply download the project files.

2.  **Install Dependencies**

    Navigate to the project's root directory in your terminal and run the following command to install all the necessary packages:

    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**

    The application uses a Gemini API Key to power its AI features. You'll need to create a local environment file to store this key securely.

    - Create a new file named `.env` in the root of your project.
    - Add the following line to the `.env` file, replacing `YOUR_API_KEY_HERE` with your actual Gemini API key:

    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

4.  **Run the Development Servers**

    This application requires two separate processes to be running simultaneously in two different terminal windows:

    -   **Terminal 1: Run the Next.js App**
        This command starts the main web application.

        ```bash
        npm run dev
        ```

        Your application should now be accessible at [http://localhost:9002](http://localhost:9002).

    -   **Terminal 2: Run the Genkit AI Flows**
        This command starts the Genkit server that handles all the AI-related tasks in the background.

        ```bash
        npm run genkit:dev
        ```

Once both servers are running, you can open your browser to `http://localhost:9002` to use the application.