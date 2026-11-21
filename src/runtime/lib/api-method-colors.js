const write = "[--color-destructive:var(--color-amber-700)] dark:[--color-destructive:var(--color-amber-400)]";
export const successBadgeColor = "[--color-destructive:var(--color-green-700)] dark:[--color-destructive:var(--color-green-400)]";

export const methodColors = {
  GET: "[--color-destructive:var(--color-blue-700)] dark:[--color-destructive:var(--color-blue-400)]",
  POST: successBadgeColor,
  PUT: write,
  PATCH: write,
  DELETE: "",
};
