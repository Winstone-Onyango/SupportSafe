# Import Python's regular-expression engine used to parse the LLM's structured output
import re


def extract_info(text):
    # Define regex pattern to extract key-value pairs
    # Matches numbered lines like: "3. Location: Nairobi" -> captures (3, "Location", "Nairobi")
    pattern = r"(\d+)\.\s*(.*?):\s*(.*)"

    # Find all matches
    # Run the pattern over the whole text and collect every (number, key, value) triple
    matches = re.findall(pattern, text)

    # Convert to dictionary
    # Build {key: value}, stripping stray whitespace; duplicate keys keep the LAST value
    data_dict = {key.strip(): value.strip() for _, key, value in matches}

    # Return the parsed key/value mapping to the caller
    return data_dict

