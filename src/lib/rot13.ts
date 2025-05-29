// ROT13 encoding/decoding for geocache hints

export function rot13(str: string): string {
  return str.replace(/[A-Za-z]/g, (char) => {
    const code = char.charCodeAt(0);
    const base = code < 97 ? 65 : 97; // uppercase or lowercase
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}

// Encode and decode are the same operation for ROT13
export const encodeHint = rot13;
export const decodeHint = rot13;