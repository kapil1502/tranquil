from fastapi import FastAPI
from pydantic import BaseModel
from langchain_community.llms import Ollama
from fastapi.middleware.cors import CORSMiddleware 
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

checkpoint_path = './checkpoint-500'
model_loaded = AutoModelForSequenceClassification.from_pretrained(checkpoint_path)
tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased')

class Message(BaseModel):
    message: str

@app.post("/infer")
async def infer(message: Message):
    print(message)
    text_input = message.message
    inputs = tokenizer(text_input, padding=True, truncation=True, return_tensors="pt")
    classes = ["sadness", "joy", "love", "anger", "fear", "surprise"]

    with torch.no_grad():
        outputs = model_loaded(**inputs)

    logits = outputs.logits
    predicted_class = torch.argmax(logits, dim=-1).item()
    predicted_label = classes[predicted_class]

    return {"emotion": predicted_label}

async def get_emotional_response(message: str, emotion: str) -> str:
    # Initialize Ollama with llama2 model
    llm = Ollama(model="llama2")
    
    # Create a prompt that includes the emotion context
    prompt = f"""Given that the user's message shows {emotion}, please provide an empathetic response So, That person can feel better.
    User message: {message}
    Please keep the response concise and natural."""
    
    # Get response from the model
    response = llm.invoke(prompt)
    return response

@app.post("/chat")
async def chat(message: Message):
    # First use the infer endpoint to get emotion
    emotion_result = await infer(message)
    detected_emotion = emotion_result["emotion"]
    
    # Get emotional response using the detected emotion
    response = await get_emotional_response(message.message, detected_emotion)
    
    return {
        "emotion": detected_emotion,
        "response": response
    }