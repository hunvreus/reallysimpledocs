const previewTag = "Preview";
const scriptTagPattern = /<script(?<attrs>[^>]*)>(?<content>[\s\S]*?)<\/script>/g;

export function transformPreviewScripts(source) {
  let output = "";
  let cursor = 0;

  while (cursor < source.length) {
    const open = findNextTag(source, previewTag, cursor);
    if (!open) {
      output += source.slice(cursor);
      break;
    }

    const close = findMatchingCloseTag(source, open);
    if (!close) {
      output += source.slice(cursor);
      break;
    }

    const body = source.slice(open.end, close.start);
    const rewrittenBody = transformPreviewScriptBody(body);

    output += source.slice(cursor, open.start);
    if (rewrittenBody === body) {
      output += source.slice(open.start, close.end);
    } else {
      output += addPreviewCodeAttribute(source.slice(open.start, open.end), body);
      output += rewrittenBody;
      output += source.slice(close.start, close.end);
    }

    cursor = close.end;
  }

  return output;
}

function transformPreviewScriptBody(body) {
  return body.replace(scriptTagPattern, (match, attrs = "", content = "") => {
    if (/\ssrc\s*=/.test(attrs) || /(?:^|\s)is:inline(?:\s|=|$)/.test(attrs)) return match;
    return `<script${attrs} is:inline>{${JSON.stringify(content)}}</script>`;
  });
}

function addPreviewCodeAttribute(openTag, body) {
  if (/(?:^|\s)code(?:\s|=|>)/.test(openTag)) return openTag;
  return `${openTag.slice(0, -1)} code={${JSON.stringify(body.trim())}}>`;
}

function findMatchingCloseTag(source, open) {
  if (open.selfClosing) return null;
  let depth = 1;
  let cursor = open.end;

  while (cursor < source.length) {
    const tag = findNextTag(source, previewTag, cursor);
    if (!tag) return null;
    if (tag.closing) depth -= 1;
    else if (!tag.selfClosing) depth += 1;
    if (depth === 0) return tag;
    cursor = tag.end;
  }

  return null;
}

function findNextTag(source, name, fromIndex) {
  let cursor = fromIndex;
  while (cursor < source.length) {
    const start = source.indexOf("<", cursor);
    if (start === -1) return null;
    if (source.startsWith("<!--", start)) {
      const commentEnd = source.indexOf("-->", start + 4);
      cursor = commentEnd === -1 ? source.length : commentEnd + 3;
      continue;
    }

    const tag = readTag(source, start);
    if (!tag) {
      cursor = start + 1;
      continue;
    }
    if (tag.name === name) return tag;
    if (!tag.closing && !tag.selfClosing && tag.name.toLowerCase() === "script") {
      const scriptEnd = source.toLowerCase().indexOf("</script>", tag.end);
      cursor = scriptEnd === -1 ? source.length : scriptEnd + "</script>".length;
      continue;
    }
    cursor = tag.end;
  }
  return null;
}

function readTag(source, start) {
  let cursor = start + 1;
  let closing = false;

  if (source[cursor] === "/") {
    closing = true;
    cursor += 1;
  }

  const nameStart = cursor;
  while (/[$A-Z_a-z0-9-]/.test(source[cursor] || "")) cursor += 1;
  const name = source.slice(nameStart, cursor);
  if (!name) return null;

  let quote = "";
  while (cursor < source.length) {
    const char = source[cursor];
    if (quote) {
      if (char === "\\" && source[cursor + 1]) {
        cursor += 2;
        continue;
      }
      if (char === quote) quote = "";
      cursor += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      cursor += 1;
      continue;
    }
    if (char === ">") {
      const beforeEnd = source.slice(start, cursor).trimEnd();
      return {
        start,
        end: cursor + 1,
        name,
        closing,
        selfClosing: beforeEnd.endsWith("/"),
      };
    }
    cursor += 1;
  }

  return null;
}
