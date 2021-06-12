export function cosineRepeation(
  min: number,
  max: number,
  start: number = min,
  frequency: number = 1, // 2πf
  increasingInitially = true,
) {
  const l = (max - min) / 2; // amplitude
  const k = -1 + (start - min) / l; // relative y coordinate
  const xIntercept = Math.acos(k) * (increasingInitially ? -1 : 1);
  return (elapsed: number) =>
    l * Math.cos(frequency * (elapsed - xIntercept)) + min + l;
}
