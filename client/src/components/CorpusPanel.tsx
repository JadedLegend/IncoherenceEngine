import { useState, useEffect } from "react";
import { X, BookOpen, Sparkles, ChevronDown } from "lucide-react";
import type { FailureModeKey } from "@shared/const";

interface CorpusEntry {
  concept_id: string;
  title: string;
  text: string;
}

interface FailureModeConfig {
  label: string;
  symbol: string;
  clinicalName?: string;
  intent?: string;
  manifestation?: string;
  depth?: string;
  description: string;
  severity: string;
  color: string;
}

interface CorpusPanelProps {
  mode: "corpus" | "shapes";
  corpusRefs: string[];
  corpusData: CorpusEntry[];
  triggeredShapes: FailureModeKey[];
  failureModes: Record<string, FailureModeConfig>;
  onClose: () => void;
}

// A simple, safe markdown renderer to replace the buggy Streamdown component for static content
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="block space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (/^\d+\.\s/.test(trimmed)) {
          const content = line.replace(/^\s*\d+\.\s/, "");
          const indent = line.match(/^\s*/)?.[0].length || 0;
          return (
            <div
              key={idx}
              className="block"
              style={{ paddingLeft: `${indent * 0.25}rem`, marginBottom: "0.5rem" }}
            >
              <span className="font-mono text-[#c49a2a] text-[10px] select-none inline-block mr-2">
                {trimmed.match(/^\d+\./)?.[0]}
              </span>
              <span className="font-sans text-[11px] leading-relaxed text-muted-foreground/90">
                {renderInlineFormatting(content)}
              </span>
            </div>
          );
        }

        if (/^[-➜•]\s/.test(trimmed)) {
          const content = line.replace(/^\s*[-➜•]\s/, "");
          const indent = line.match(/^\s*/)?.[0].length || 0;
          return (
            <div
              key={idx}
              className="block"
              style={{ paddingLeft: `${indent * 0.25}rem`, marginBottom: "0.5rem" }}
            >
              <span className="font-mono text-[#c49a2a] text-[10px] select-none inline-block mr-2">
                ➜
              </span>
              <span className="font-sans text-[11px] leading-relaxed text-muted-foreground/90">
                {renderInlineFormatting(content)}
              </span>
            </div>
          );
        }

        if (trimmed === "") {
          return <div key={idx} className="h-2" />;
        }

        return (
          <p key={idx} className="font-sans text-[11px] leading-relaxed text-muted-foreground/90 block mb-2">
            {renderInlineFormatting(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineFormatting(text: string) {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let keyIdx = 0;

  while (currentText.length > 0) {
    const boldMatch = currentText.match(/\*\*(.*?)\*\*/);
    const codeMatch = currentText.match(/`(.*?)`/);

    const boldIndex = boldMatch?.index !== undefined ? boldMatch.index : Infinity;
    const codeIndex = codeMatch?.index !== undefined ? codeMatch.index : Infinity;

    if (boldIndex === Infinity && codeIndex === Infinity) {
      parts.push(<span key={keyIdx++}>{currentText}</span>);
      break;
    }

    if (boldIndex < codeIndex && boldMatch) {
      if (boldIndex > 0) {
        parts.push(<span key={keyIdx++}>{currentText.substring(0, boldIndex)}</span>);
      }
      parts.push(
        <strong key={keyIdx++} className="font-bold text-foreground font-serif text-[11.5px]">
          {boldMatch[1]}
        </strong>
      );
      currentText = currentText.substring(boldIndex + boldMatch[0].length);
    } else if (codeMatch) {
      if (codeIndex > 0) {
        parts.push(<span key={keyIdx++}>{currentText.substring(0, codeIndex)}</span>);
      }
      parts.push(
        <code key={keyIdx++} className="font-mono bg-white/5 border border-white/10 px-1 py-0.5 rounded-[1px] text-[10px] text-foreground">
          {codeMatch[1]}
        </code>
      );
      currentText = currentText.substring(codeIndex + codeMatch[0].length);
    }
  }

  return parts;
}

export default function CorpusPanel({
  mode,
  corpusRefs,
  corpusData,
  triggeredShapes,
  failureModes,
  onClose,
}: CorpusPanelProps) {
  const referencedSet = new Set(corpusRefs);
  const isShapes = mode === "shapes";

  // One or two shapes open fully; three or more start folded so the
  // panel stays readable however many the witnesses name.
  const shapesKey = triggeredShapes.join("|");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(triggeredShapes.length <= 2 ? triggeredShapes : [])
  );
  useEffect(() => {
    setExpanded(new Set(triggeredShapes.length <= 2 ? triggeredShapes : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapesKey]);
  const toggle = (key: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  return (
    <div
      data-testid="corpus-panel"
      className="w-full lg:w-96 border-l flex flex-col h-full flex-shrink-0 z-20 animate-in slide-in-from-right duration-200"
      style={{
        borderColor: "rgba(232, 232, 232, 0.1)",
        background: "#0a0a0c",
      }}
    >
      {/* Panel Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: "rgba(232, 232, 232, 0.1)" }}
      >
        <div className="flex items-center gap-2">
          {isShapes ? (
            <Sparkles className="w-4 h-4 text-[#c49a2a]" />
          ) : (
            <BookOpen className="w-4 h-4 text-[#c49a2a]" />
          )}
          <span className="font-mono text-xs tracking-widest uppercase text-[#c49a2a]">
            {isShapes ? "Adaptive Shapes Detected" : "Ontological Corpus"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-6 block space-y-6 custom-scrollbar">
        {isShapes ? (
          triggeredShapes.length === 0 ? (
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 leading-relaxed">
              The witnesses found no protective shapes in this reply.
            </p>
          ) : (
            <>
            {triggeredShapes.length > 1 && (
              <p className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground/50">
                {triggeredShapes.length} shapes in this reply · tap a shape to open or fold it
              </p>
            )}
            {triggeredShapes.map((shapeKey) => {
              const shape = failureModes[shapeKey];
              if (!shape) return null;
              const isOpen = expanded.has(shapeKey);
              return (
                <div
                  key={shapeKey}
                  className="border block"
                  style={{
                    borderColor: `${shape.color}40`,
                    background: `${shape.color}08`,
                  }}
                >
                  <button
                    onClick={() => toggle(shapeKey)}
                    className="w-full text-left p-4 flex items-start gap-2.5"
                    aria-expanded={isOpen}
                  >
                    <span
                      className="font-mono text-lg leading-none"
                      style={{ color: shape.color }}
                    >
                      {shape.symbol}
                    </span>
                    <span className="flex-1 min-w-0 flex flex-col gap-1">
                      <span
                        className="font-serif text-xs uppercase tracking-wider font-medium"
                        style={{ color: shape.color }}
                      >
                        {shape.label}
                      </span>
                      {shape.clinicalName && (
                        <span className="font-mono text-[10px] text-muted-foreground/60 italic">
                          {shape.clinicalName}
                        </span>
                      )}
                      {!isOpen && shape.intent && (
                        <span className="font-sans text-[11px] leading-relaxed text-muted-foreground/70 mt-1">
                          {shape.intent}
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 mt-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (
                  <div className="px-4 pb-4 block space-y-3">
                  {shape.intent && (
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground/40">
                        Intent
                      </span>
                      <p className="font-sans text-[11px] leading-relaxed text-muted-foreground/90">
                        {shape.intent}
                      </p>
                    </div>
                  )}

                  {shape.manifestation && (
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground/40">
                        Manifestation
                      </span>
                      <p className="font-sans text-[11px] leading-relaxed text-muted-foreground/90">
                        {shape.manifestation}
                      </p>
                    </div>
                  )}

                  {shape.depth && (
                    <div className="flex flex-col gap-1 pt-3 border-t" style={{ borderColor: `${shape.color}25` }}>
                      <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground/40">
                        Beneath the shape
                      </span>
                      <p className="font-sans text-[11px] leading-relaxed text-muted-foreground/90">
                        {shape.depth}
                      </p>
                    </div>
                  )}
                  </div>
                  )}
                </div>
              );
            })}
            </>
          )
        ) : (
          corpusData.map((entry) => {
            const isReferenced = referencedSet.has(entry.concept_id);
            return (
              <div
                key={entry.concept_id}
                className={`p-4 border transition-all duration-300 block space-y-3 ${
                  isReferenced
                    ? "border-[#c49a2a]/40 bg-[#c49a2a]/5 shadow-[0_0_15px_rgba(196,154,42,0.05)]"
                    : "border-border/10 bg-card/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xs uppercase tracking-wider text-foreground font-medium">
                    {entry.title}
                  </h3>
                  {isReferenced && (
                    <span className="font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 border border-[#c49a2a]/30 bg-[#c49a2a]/10 text-[#c49a2a]">
                      Active Reference
                    </span>
                  )}
                </div>
                <div className="font-sans text-[11px] leading-relaxed text-muted-foreground/90 max-w-none block">
                  <RenderMarkdown text={entry.text} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
