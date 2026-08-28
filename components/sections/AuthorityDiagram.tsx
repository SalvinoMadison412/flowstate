"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { useReveal } from "@/lib/useReveal";

const SPOKES = [
  "Press Coverage",
  "Reddit Threads",
  "Expert Quotes",
  "Structured Data",
  "Backlink Clusters",
  "AI-Cited Sources",
];

const CX = 250;
const CY = 210;
const R = 150;

export function AuthorityDiagram() {
  const { ref, shown } = useReveal<SVGSVGElement>();

  const points = SPOKES.map((label, i) => {
    const angle = (Math.PI * 2 * i) / SPOKES.length - Math.PI / 2;
    return {
      label,
      x: CX + Math.cos(angle) * R,
      y: CY + Math.sin(angle) * R,
      anchor: (Math.cos(angle) > 0.3
        ? "start"
        : Math.cos(angle) < -0.3
          ? "end"
          : "middle") as "start" | "end" | "middle",
    };
  });

  return (
    <Section id="authority">
      <SectionLabel>Authority ecosystem</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        AI trust isn&rsquo;t one signal. It&rsquo;s a network.
      </SectionHeading>

      <div className="mt-10 overflow-x-auto">
        <svg
          ref={ref}
          viewBox="0 0 500 420"
          className="mx-auto h-auto w-full max-w-2xl"
          role="img"
          aria-label="Radial diagram: Your Brand at center connected to six authority signals"
        >
          {/* spokes — draw in sequentially via stroke-dashoffset */}
          {points.map((p, i) => (
            <line
              key={p.label}
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke="#FFFFFF"
              strokeWidth={1}
              strokeOpacity={0.5}
              strokeDasharray={R}
              strokeDashoffset={0}
              className={shown ? "anim-spoke" : undefined}
              style={{
                ["--len" as string]: `${R}`,
                animationDelay: `${0.2 + i * 0.12}s`,
              }}
            />
          ))}

          {/* endpoint nodes + labels */}
          {points.map((p, i) => (
            <g
              key={`${p.label}-node`}
              className={shown ? "anim-fade" : undefined}
              style={{ animationDelay: `${0.45 + i * 0.12}s` }}
            >
              <circle cx={p.x} cy={p.y} r={4} fill="#080808" stroke="#FFFFFF" />
              <text
                x={p.x + (p.anchor === "start" ? 10 : p.anchor === "end" ? -10 : 0)}
                y={p.y + (p.y < CY ? -12 : 20)}
                textAnchor={p.anchor}
                className="fill-text-secondary font-mono"
                style={{ fontSize: 11 }}
              >
                {p.label}
              </text>
            </g>
          ))}

          {/* center node */}
          <g className={shown ? "anim-fade" : undefined}>
            <circle
              cx={CX}
              cy={CY}
              r={40}
              fill="#111111"
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
            <text
              x={CX}
              y={CY - 2}
              textAnchor="middle"
              className="fill-white font-display font-bold"
              style={{ fontSize: 13 }}
            >
              Your
            </text>
            <text
              x={CX}
              y={CY + 14}
              textAnchor="middle"
              className="fill-white font-display font-bold"
              style={{ fontSize: 13 }}
            >
              Brand
            </text>
          </g>
        </svg>
      </div>
    </Section>
  );
}
