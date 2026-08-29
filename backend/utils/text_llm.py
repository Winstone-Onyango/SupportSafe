import os

from dotenv import load_dotenv
from groq import Groq

from backend.prompts import (INSPIRATION_POEM_PROMPT,
                             USER_POST_TEXT_DECOMPOSITION_PROMPT,
                             USER_POST_TEXT_EXPANSION_PROMPT)

load_dotenv()


async def expand_user_text_using_gemini(user_input):
    import google.generativeai as genai

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-3.6-flash")
    response = model.generate_content(
        f"{USER_POST_TEXT_EXPANSION_PROMPT}. The data is {user_input}"
    )
    return response.text


async def expand_user_text_using_gemma(user_input):
    client = Groq(api_key=os.getenv("GROQ_API_TOKEN"))
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": f"{USER_POST_TEXT_EXPANSION_PROMPT}. The data is {user_input}",
            }
        ],
        model="openai/gpt-oss-120b",
    )
    return chat_completion.choices[0].message.content


def decompose_user_text(user_input):
    import google.generativeai as genai

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-3.6-flash")
    response = model.generate_content(
        f"{USER_POST_TEXT_DECOMPOSITION_PROMPT}. The data is {user_input}"
    )
    return response.text


def create_poem(user_input):
    import google.generativeai as genai

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-3.6-flash")
    response = model.generate_content(
        f"{INSPIRATION_POEM_PROMPT}. The data is {user_input}"
    )
    return response.text
