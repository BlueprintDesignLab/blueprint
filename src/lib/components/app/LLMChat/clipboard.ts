function stripHtml(html: string) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

export async function copyToClipboard(rawHtml: string) {
    const text = stripHtml(rawHtml);      // plain text
    try {
      // Try the richer API first (Chromium, Firefox 122+, Edge).
      if (navigator.clipboard.write) {
        const item = new ClipboardItem({
          // Provide BOTH flavours so every target can paste something.
          "text/plain": new Blob([text], { type: "text/plain" }),
          "text/html":  new Blob([rawHtml], { type: "text/html" })
        });
        await navigator.clipboard.write([item]);
      } else {
        // Fallback for Safari / older Firefox
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.error("Clipboard write failed:", err);
    }
  }