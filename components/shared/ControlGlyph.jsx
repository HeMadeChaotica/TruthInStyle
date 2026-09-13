export default function ControlGlyph({ item }) {
  const [left, top, right, bottom] = item.bounds;
  const side = Math.max(right - left, bottom - top) * 1.04;
  const viewBox = [(left + right - side) / 2, (top + bottom - side) / 2, side, side].join(' ');
  return <svg className="control-glyph-art" viewBox={viewBox} aria-hidden="true" focusable="false"><image href={item.src} width={item.size[0]} height={item.size[1]} /></svg>;
}
