export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function attrs(values = {}) {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => (value === true ? ` ${key}` : ` ${key}="${escapeHtml(value)}"`))
    .join("");
}

export function addSvgClass(svg, className) {
  if (!svg || !className) return svg || "";
  if (svg.includes('class="')) return svg.replace('class="', `class="${className} `);
  return svg.replace("<svg", `<svg class="${escapeHtml(className)}"`);
}
