import type { DistortionRule } from "@/lib/cognitive/cognitiveDistortions";

export function DistortionAlert({ distortions }: { distortions: DistortionRule[] }) {
  if (!distortions.length) return null;

  return (
    <aside className="distortion-alert" aria-label="Sugestões de revisão do tom">
      {distortions.map((distortion) => (
        <div key={distortion.id}>
          <strong>{distortion.name}</strong>
          <p>{distortion.suggestion}</p>
        </div>
      ))}
    </aside>
  );
}
