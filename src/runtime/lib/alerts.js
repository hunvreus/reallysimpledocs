const alerts = {
  NOTE: { title: "Note", icon: "Info" },
  TIP: { title: "Tip", icon: "Lightbulb" },
  IMPORTANT: { title: "Important", icon: "CircleAlert" },
  WARNING: { title: "Warning", icon: "TriangleAlert", type: "warning" },
  CAUTION: { title: "Caution", icon: "OctagonAlert", type: "destructive" },
};

// Only a standalone marker on the first line of a blockquote is an alert.
export function parseAlert(text = "") {
  const match = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\r?\n|$)/.exec(text);
  return match ? { ...alerts[match[1]], content: text.slice(match[0].length) } : null;
}
