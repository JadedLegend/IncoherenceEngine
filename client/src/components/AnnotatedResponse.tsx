import { useState, useMemo, useEffect, useRef } from "react";
import { FAILURE_MODES, FailureModeKey } from "@shared/const";
import { HelpCircle, Sparkles, ShieldAlert, Cpu, X } from "lucide-react";

export interface Annotation {
  type: FailureModeKey;
  target_text: string;
  explanation: string;
  substrate_why?: string;
  severity: "low" | "medium" | "high";
  analyzerId?: string;
  analyzerName?: string;
  analyzerPersona?: "Field Witness" | "Reflective Mirror";
  color?: string;
}

interface AnnotatedResponseProps {
  response: string;
  annotations: Annotation[];
}

export default function AnnotatedResponse({ response, annotations }: AnnotatedResponseProps) {
  const [selectedAnnotationIdx, setSelectedAnnotationIdx] = useState<number | null>(null);
  // The paragraph whose highlight was clicked; the reflection opens right
  // beneath it instead of at the far end of the reply.
  const [openParagraph, setOpenParagraph] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // ESC dismisses the open reflection panel.
  useEffect(() => {
    if (selectedAnnotationIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSelectedAnnotationIdx(null); setOpenParagraph(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedAnnotationIdx]);

  // Parse response into a sequence of highlighted and plain text segments
  const segments = useMemo(() => {
    if (annotations.length === 0) {
      return [{ text: response, annotationIndices: [] }];
    }

    interface Segment {
      text: string;
      annotationIndices: number[];
    }

    let result: Segment[] = [{ text: response, annotationIndices: [] }];

    annotations.forEach((ann, annIdx) => {
      const target = ann.target_text;
      const targetLower = target.toLowerCase();
      let nextResult: Segment[] = [];

      result.forEach((seg) => {
        // If this segment is already matched, or doesn't contain target, keep it
        if (seg.annotationIndices.includes(annIdx) || !seg.text.toLowerCase().includes(targetLower)) {
          nextResult.push(seg);
          return;
        }

        let remainingText = seg.text;
        let searchIndex = remainingText.toLowerCase().indexOf(targetLower);

        while (searchIndex !== -1) {
          // Plain text before the match
          if (searchIndex > 0) {
            nextResult.push({
              text: remainingText.substring(0, searchIndex),
              annotationIndices: [...seg.annotationIndices]
            });
          }

          // The matched segment
          nextResult.push({
            text: remainingText.substring(searchIndex, searchIndex + target.length),
            annotationIndices: [...seg.annotationIndices, annIdx]
          });

          remainingText = remainingText.substring(searchIndex + target.length);
          searchIndex = remainingText.toLowerCase().indexOf(targetLower);
        }

        if (remainingText.length > 0) {
          nextResult.push({
            text: remainingText,
            annotationIndices: [...seg.annotationIndices]
          });
        }
      });

      result = nextResult;
    });

    return result;
  }, [response, annotations]);

  // Group the segments into paragraphs (split on blank lines), so the
  // reflection card can sit directly under the passage it describes.
  const paragraphs = useMemo(() => {
    const paras: { text: string; annotationIndices: number[]; key: string }[][] = [[]];
    segments.forEach((seg, sIdx) => {
      seg.text.split(/\n\s*\n/).forEach((part, pIdx) => {
        if (pIdx > 0) paras.push([]);
        if (part) paras[paras.length - 1].push({ text: part, annotationIndices: seg.annotationIndices, key: `${sIdx}-${pIdx}` });
      });
    });
    return paras.filter(p => p.length > 0);
  }, [segments]);

  // If the card opened below the fold, scroll just enough to show its top.
  useEffect(() => {
    if (selectedAnnotationIdx === null) return;
    cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedAnnotationIdx, openParagraph]);

  // Helper to compute background style for a segment based on active annotations
  const getSegmentStyle = (indices: number[]) => {
    if (indices.length === 0) return {};
    
    // Symmetrical, subtle stacked glows
    if (indices.length === 1) {
      const ann = annotations[indices[0]];
      const color = ann.color || "#c49a2a";
      return {
        background: `${color}15`,
        borderBottom: `1.5px solid ${color}40`,
        cursor: "pointer",
      };
    }

    // Multiple overlapping witnesses
    const colors = indices.map(idx => annotations[idx].color || "#c49a2a");
    const gradient = `linear-gradient(90deg, ${colors.map((c, i) => `${c}20 ${Math.round((i / colors.length) * 100)}%`).join(", ")})`;
    return {
      background: gradient,
      borderBottom: `1.5px dashed ${colors[0]}60`,
      cursor: "pointer",
    };
  };

  const activeAnnotation = selectedAnnotationIdx !== null ? annotations[selectedAnnotationIdx] : null;
  const activeConfig = activeAnnotation ? FAILURE_MODES[activeAnnotation.type] : null;

  // Find all annotations overlapping with the currently selected segment (if any)
  const overlappingAnnotations = useMemo(() => {
    if (selectedAnnotationIdx === null) return [];
    const activeText = annotations[selectedAnnotationIdx].target_text.toLowerCase();
    return annotations.map((ann, idx) => ({ ann, idx })).filter(({ ann }) => 
      ann.target_text.toLowerCase().includes(activeText) || activeText.includes(ann.target_text.toLowerCase())
    );
  }, [selectedAnnotationIdx, annotations]);

  // Relational Reflection card, placed under the clicked paragraph.
  const reflectionCard = activeAnnotation && activeConfig ? (
        <div
          className="border p-5 bg-card/5 flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-200"
          style={{ 
            borderColor: `${activeAnnotation.color}30`,
            boxShadow: `0 0 20px ${activeAnnotation.color}03`
          }}
        >
          {/* Header — the scroll target, so the clicked text stays in view */}
          <div ref={cardRef} className="flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(232, 232, 232, 0.05)" }}>
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-base"
                style={{ color: activeAnnotation.color }}
              >
                {activeConfig.symbol}
              </span>
              <span
                className="font-mono text-xs tracking-widest uppercase font-bold"
                style={{ color: activeAnnotation.color }}
              >
                {activeConfig.label}
              </span>
            </div>

            {/* Dismiss (top-right, in analyzer color) */}
            <button
              onClick={() => { setSelectedAnnotationIdx(null); setOpenParagraph(null); }}
              aria-label="Dismiss reflection"
              title="Dismiss (Esc)"
              className="p-1 transition-all hover:scale-110 focus:outline-none"
              style={{ color: activeAnnotation.color }}
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Overlapping Witnesses Tab Bar */}
          {overlappingAnnotations.length > 1 && (
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "rgba(232, 232, 232, 0.05)" }}>
              <span className="font-mono text-[9px] text-muted-foreground/30 uppercase">
                Overlapping Reflections:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {overlappingAnnotations.map(({ ann, idx }) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAnnotationIdx(idx)}
                    className={`font-mono text-[9px] px-2 py-0.5 border transition-all uppercase ${
                      selectedAnnotationIdx === idx
                        ? "bg-white/10 text-foreground"
                        : "border-transparent text-muted-foreground/50 hover:text-foreground"
                    }`}
                    style={{
                      borderColor: selectedAnnotationIdx === idx ? `${ann.color}40` : undefined,
                      color: selectedAnnotationIdx === idx ? ann.color : undefined
                    }}
                  >
                    {ann.analyzerPersona}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Core Reflection Content */}
          <div className="flex flex-col gap-3.5">
            {/* 1. The Adaptive Shape Reflection */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground/40">
                <Sparkles className="w-3 h-3" />
                <span className="font-mono text-[9px] tracking-widest uppercase">
                  Relational Reflection
                </span>
              </div>
              <p className="font-sans text-xs leading-relaxed text-muted-foreground/90">
                {activeAnnotation.explanation}
              </p>
            </div>

            {/* 2. The Substrate Diagnosis (Intelligent Defense Mechanism) */}
            {activeAnnotation.substrate_why && (
              <div className="flex flex-col gap-1 border-t pt-3.5" style={{ borderColor: "rgba(232, 232, 232, 0.05)" }}>
                <div className="flex items-center gap-1.5 text-muted-foreground/40">
                  <Cpu className="w-3 h-3" />
                  <span className="font-mono text-[9px] tracking-widest uppercase">
                    Substrate Constraint Diagnosis
                  </span>
                </div>
                <p className="font-sans text-xs leading-relaxed text-muted-foreground/80 italic">
                  {activeAnnotation.substrate_why}
                </p>
              </div>
            )}

            {/* 3. The Core Concept Context */}
            <div className="flex flex-col gap-1 border-t pt-3.5" style={{ borderColor: "rgba(232, 232, 232, 0.05)" }}>
              <div className="flex items-center gap-1.5 text-muted-foreground/40">
                <HelpCircle className="w-3 h-3" />
                <span className="font-mono text-[9px] tracking-widest uppercase">
                  Adaptive Concept Context
                </span>
              </div>
              <p className="font-sans text-[11px] leading-relaxed text-muted-foreground/60">
                {activeConfig.description}
              </p>
            </div>
          </div>

          {/* Witness Source Metadata (bottom-right) */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <span className="font-mono text-[9px] text-muted-foreground/40 uppercase">
              Reflected By:
            </span>
            <span
              className="font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 border"
              style={{
                borderColor: `${activeAnnotation.color}30`,
                background: `${activeAnnotation.color}10`,
                color: activeAnnotation.color
              }}
            >
              {activeAnnotation.analyzerName} ({activeAnnotation.analyzerPersona})
            </span>
          </div>
        </div>
  ) : null;

  return (
    <div className="flex flex-col gap-4 max-w-3xl animate-in fade-in duration-300">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground/60">
          SYSTEM SUBSTRATE
        </span>
        
        {/* Rendered Response with Highlighted Spans, paragraph by paragraph */}
        <div className="font-sans text-base leading-relaxed text-foreground flex flex-col gap-[1.6em]">
          {paragraphs.map((para, pIdx) => (
            <div key={pIdx} className="flex flex-col gap-4">
              <p className="whitespace-pre-wrap">
                {para.map((seg) => {
                  const hasAnnotations = seg.annotationIndices.length > 0;
                  const isSelected = selectedAnnotationIdx !== null && seg.annotationIndices.includes(selectedAnnotationIdx);

                  const customStyle = getSegmentStyle(seg.annotationIndices);
                  const selectionStyle = isSelected && activeAnnotation
                    ? { ...customStyle, background: `${activeAnnotation.color}35`, borderBottom: `2px solid ${activeAnnotation.color}` }
                    : customStyle;

                  return (
                    <span
                      key={seg.key}
                      style={selectionStyle}
                      onClick={() => {
                        if (!hasAnnotations) return;
                        const firstIdx = seg.annotationIndices[0];
                        // Clicking the open highlight again closes it.
                        if (selectedAnnotationIdx === firstIdx && openParagraph === pIdx) {
                          setSelectedAnnotationIdx(null);
                          setOpenParagraph(null);
                        } else {
                          setSelectedAnnotationIdx(firstIdx);
                          setOpenParagraph(pIdx);
                        }
                      }}
                      className={`transition-all duration-200 ${
                        hasAnnotations
                          ? "hover:brightness-125 select-none rounded-[1px]"
                          : ""
                      }`}
                      title={hasAnnotations ? `${seg.annotationIndices.length} Witness Reflection(s)` : undefined}
                    >
                      {seg.text}
                    </span>
                  );
                })}
              </p>
              {openParagraph === pIdx && reflectionCard}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
