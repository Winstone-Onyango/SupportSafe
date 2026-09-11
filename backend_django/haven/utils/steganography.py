# PIL (Pillow) provides the Image class used for pixel-level steganography
from PIL import Image


def encode_text_in_image(image: Image.Image, text: str) -> Image.Image:
    """
    Encodes text into the image using LSB steganography on the RGB values.
    """
    # Convert image to RGB if it's in a different mode
    # Modes like P (palette) or L (grayscale) can't hold RGB triples, so normalize first
    if image.mode not in ("RGB", "RGBA"):
        # Re-encode the image as RGB before touching pixels
        image = image.convert("RGB")

    # Work on a copy so the original image object is never mutated
    encoded_image = image.copy()
    # Build the bit string: each character -> 8 bits, then append the 16-bit end marker
    binary_text = (
        "".join(format(ord(char), "08b") for char in text) + "1111111111111110"
    )  # End marker
    # Get a fast pixel-access object for reading/writing individual pixels
    pixels = encoded_image.load()
    # Unpack the image dimensions for the scan loops
    width, height = encoded_image.size
    # Index into binary_text — the next bit we need to hide
    idx = 0

    # Walk the image row by row (top to bottom)
    for y in range(height):
        # Walk each column in the row (left to right)
        for x in range(width):
            # Only keep writing while there are secret bits left
            if idx < len(binary_text):
                # Get pixel values
                # Read the current pixel as a tuple of channel values
                pixel = pixels[x, y]

                # Handle RGB and RGBA formats
                # RGBA pixels have a 4th alpha channel that must be preserved
                if image.mode == "RGBA":
                    # Unpack all four channels
                    r, g, b, a = pixel
                else:
                    # RGB pixels have exactly three channels
                    r, g, b = pixel
                    # Mark alpha as absent so we don't write it back later
                    a = None

                # Modify LSB of the red channel
                # Clear the lowest bit of red, then set it to the current secret bit
                r = (r & ~1) | int(binary_text[idx])  # Modify LSB of red channel
                # Advance to the next secret bit
                idx += 1

                # Set modified pixel back
                # Rebuild the pixel tuple with the correct number of channels
                if a is not None:
                    # Write RGBA pixel back with the tweaked red channel
                    pixels[x, y] = (r, g, b, a)
                else:
                    # Write RGB pixel back with the tweaked red channel
                    pixels[x, y] = (r, g, b)
            # All secret bits have been embedded — stop scanning
            else:
                # Exit the column loop early
                break
    # Return the image that now carries the hidden message
    return encoded_image


def decode_text_from_image(image: Image.Image) -> str:
    """
    Decodes text from the image using LSB steganography on the RGB values.
    """
    # Convert the image to RGB if it's not in RGB or RGBA
    # Normalize the mode exactly like the encoder did so bit positions line up
    if image.mode not in ("RGB", "RGBA"):
        # Convert any exotic mode to RGB before reading pixels
        image = image.convert("RGB")

    # Accumulator for the recovered bit string
    binary_text = ""
    # Fast pixel-access object for reading the image
    pixels = image.load()
    # Unpack image dimensions for the scan loops
    width, height = image.size

    # Scan the image row by row
    for y in range(height):
        # Scan each pixel across the row
        for x in range(width):
            # Handle both RGB and RGBA pixel formats
            # Read the current pixel tuple
            pixel = pixels[x, y]
            # RGBA pixels carry an extra alpha channel
            if image.mode == "RGBA":
                # Unpack all four channels (alpha is ignored)
                r, g, b, a = pixel
            else:
                # RGB pixels have three channels
                r, g, b = pixel

            # Extract the LSB of the red channel
            # r & 1 isolates the lowest bit — the bit the encoder hid here
            binary_text += str(r & 1)

            # Check for end marker
            # The encoder appends 16 ones followed by a zero; detect it to stop
            if binary_text[-16:] == "1111111111111110":
                # Remove end marker
                # Strip the marker so only the payload bits remain
                binary_text = binary_text[:-16]  # Remove end marker
                # Convert each 8-bit group back into a character
                decoded_text = "".join(
                    chr(int(binary_text[i : i + 8], 2))
                    for i in range(0, len(binary_text), 8)
                )
                # Return the fully recovered hidden message
                return decoded_text

    # If no end marker is found, return an empty string
    # Means the image carries no message (or was re-compressed and the data is lost)
    return ""

