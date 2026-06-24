export function parseCodeMeta(meta) {
  const value = String(meta || "");
  const title = value.match(/(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|([^\s]+))/);

  return {
    title: title?.[1] ?? title?.[2] ?? title?.[3] ?? "",
  };
}
