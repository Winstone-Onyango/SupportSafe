import os

from dotenv import load_dotenv
from groq import Groq

from haven.prompts import (INSPIRATION_POEM_PROMPT,
                           USER_POST_TEXT_DECOMPOSITION_PROMPT,
                           USER_POST_TEXT_EXPANSION_PROMPT)

load_dotenv()


def _gemini_generate(prompt):
    """Generate text with Gemini. Raises when Gemini is unavailable."""
    import google.generativeai as genai

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-3.6-flash")
    response = model.generate_content(prompt)
    return response.text


def _groq_generate(prompt):
    """Generate text with Groq (free tier, used as Gemini fallback)."""
    client = Groq(api_key=os.getenv("GROQ_API_TOKEN"))
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="openai/gpt-oss-120b",
    )
    return chat_completion.choices[0].message.content


def _generate_with_fallback(prompt):
    """Try Gemini first; fall back to Groq when the quota is exhausted."""
    try:
        return _gemini_generate(prompt)
    except Exception as gemini_err:
        print(f"Gemini text generation failed ({gemini_err}); falling back to Groq")
        return _groq_generate(prompt)


def expand_user_text_using_gemini(user_input):
    return _generate_with_fallback(
        f"{USER_POST_TEXT_EXPANSION_PROMPT}. The data is {user_input}"
    )


def expand_user_text_using_gemma(user_input):
    return _groq_generate(
        f"{USER_POST_TEXT_EXPANSION_PROMPT}. The data is {user_input}"
    )


def decompose_user_text(user_input):
    return _generate_with_fallback(
        f"{USER_POST_TEXT_DECOMPOSITION_PROMPT}. The data is {user_input}"
    )


def create_poem(user_input):
    return _generate_with_fallback(
        f"{INSPIRATION_POEM_PROMPT}. The data is {user_input}"
    )
