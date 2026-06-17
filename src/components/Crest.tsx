// Escudo del equipo desde la API. Usa <img> normal (no next/image) para evitar
// configurar remotePatterns y el optimizador de imágenes.
export default function Crest({
  src,
  size = 22,
}: {
  src: string | null;
  size?: number;
}) {
  if (!src) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full bg-white/10"
        style={{ width: size, height: size, fontSize: size * 0.6 }}
      >
        ⚽
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      style={{ objectFit: "contain", width: size, height: size }}
    />
  );
}
