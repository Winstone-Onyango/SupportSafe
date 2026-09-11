# os reads provider API keys from the environment
import os

# python-dotenv loads .env variables (GEMINI/GROQ keys)
from dotenv import load_dotenv
# Official Groq SDK client for Llama/GPT-OSS models on Groq's free tier
from groq import Groq

# The three prompt templates this module fills with user data
from haven.prompts import (INSPIRATION_POEM_PROMPT,
                           USER_POST_TEXT_DECOMPOSITION_PROMPT,
                           USER_POST_TEXT_EXPANSION_PROMPT)

# Load environment variables from the .env file at import time
load_dotenv()


def _gemini_generate(prompt):
    """Generate text with Gemini. Raises when Gemini is unavailable."""
    # Import inside the function so a missing SDK doesn't break app startup
    import google.generativeai as genai

    # Authenticate with the Gemini API using the key from the environment
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    # Use the fast, cheap flash variant of Gemini
    model = genai.GenerativeModel("gemini-3.6-flash")
    # Send the fully assembled prompt and wait for the completion
    response = model.generate_content(prompt)
    # Return just the generated text
    return response.text


def _groq_generate(prompt):
    """Generate text with Groq (free tier, used as Gemini fallback)."""
    # Create a Groq client authenticated with the free-tier token
    client = Groq(api_key=os.getenv("GROQ_API_TOKEN"))
    # Request a chat completion from Groq's hosted model
    chat_completion = client.chat.completions.create(
        # The messages array follows the standard chat format
        messages=[
            {
                # A plain user message containing our whole prompt
                "role": "user",
                # The prompt text (template + user data)
                "content": prompt,
            }
        ],
        # Groq-hosted OpenAI-compatible model used as the backup generator
        model="openai/gpt-oss-120b",
    )
    # Pull the generated message out of the first (only) choice
    return chat_completion.choices[0].message.content


def _generate_with_fallback(prompt):
    """Try Gemini first; fall back to Groq when the quota is exhausted."""
    # Attempt the primary provider
    try:
        # Gemini produces the best-quality output
        return _gemini_generate(prompt)
    # Any failure (quota, network, bad key) triggers the fallback
    except Exception as gemini_err:
        # Log why the primary provider failed so operators can diagnose
        print(f"Gemini text generation failed ({gemini_err}); falling back to Groq")
        # Serve the request with Groq instead of failing outright
        return _groq_generate(prompt)


def expand_user_text_using_gemini(user_input):
    # Fill the report-expansion template with the victim's form answers
    return _generate_with_fallback(
        f"{USER_POST_TEXT_EXPANSION_PROMPT}. The data is {user_input}"
    )


def expand_user_text_using_gemma(user_input):
    # Same expansion but explicitly via Groq (always the secondary provider)
    return _groq_generate(
        f"{USER_POST_TEXT_EXPANSION_PROMPT}. The data is {user_input}"
    )


def decompose_user_text(user_input):
    # Fill the decomposition template to get structured key/value output
    return _generate_with_fallback(
        f"{USER_POST_TEXT_DECOMPOSITION_PROMPT}. The data is {user_input}"
    )


def create_poem(user_input):
    # Fill the poem template to generate a short supportive poem
    return _generate_with_fallback(
        f"{INSPIRATION_POEM_PROMPT}. The data is {user_input}"
    )

