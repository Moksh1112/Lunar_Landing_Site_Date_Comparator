export function bodyDirection(azimuth: number, elevation: number, longitude: number): [number, number, number] {
  const a = (azimuth + longitude) * Math.PI / 180;
  const e = elevation * Math.PI / 180;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
}

export function decodeHeights(encoded: string, width: number, height: number): Float32Array {
  const raw = atob(encoded);
  if (raw.length !== width * height * 4) throw new Error("Invalid terrain height payload.");
  const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  const result = new Float32Array(width * height);
  for (let i = 0; i < result.length; i++) {
    result[i] = view.getFloat32(i * 4, true);
    if (!Number.isFinite(result[i])) throw new Error("Terrain tile contains missing heights.");
  }
  return result;
}
