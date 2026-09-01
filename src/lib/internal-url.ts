export function internalUrl(path: string, base: string): string {
  const baseSegment = base.replace(/^\/+|\/+$/g, "");
  const normalizedBase = baseSegment === "" ? "/" : `/${baseSegment}/`;
  return `${normalizedBase}${path.replace(/^\/+/, "")}`;
}
