readme.md

# Tranquil - Let's Unwind

## Description
This project is a full-stack web application for emotion detection and response generation using pre-trained models.
An emotional support AI chatbot is to provide an accessible, empathetic, and anonymous platform for individuals facing mental health challenges. The chatbot aims to bridge the gap in mental health care by offering immediate emotional support, simulating active listening, and fostering a non-judgmental environment for users who may be hesitant to seek traditional therapy due to stigma, cost, or lack of access.



## Installation

### Backend

1. *Clone the repository*:  
   git clone https://github.com/kapil1502/tranquil  
   cd your-project-folder/backend

2. *Install backend dependencies*:  
   pip install fastapi pydantic langchain transformers torch uvicorn
           or
   Just run the command pip install requirements.txt

3. *Active Directory Change*
   Now change up your active directory to /model
   cd your-project-folder/backend/model

4. *Run the backend*:  
   uvicorn app:app --reload

### Frontend

1. *Navigate to the frontend folder*:  
   cd ../frontend

2. *Install frontend dependencies*:  
   npm install

3. *Run the frontend*:  
   npm run dev

### Ollama Installation & Running

1. *Install Ollama* (if you haven't already):  
   Download and install Ollama from the official website: [Ollama Installation Guide](https://ollama.com/docs/install).

2. *Run the Llama2 model*:  
   Open a command prompt and run the following command to start the Llama2 model with Ollama:  
   ollama run llama2


## Usage

- The backend API is available at http://localhost:8000.
- The frontend is served at http://localhost:3000.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
