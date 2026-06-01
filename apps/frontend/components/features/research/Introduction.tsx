export default function Introduction() {
  return (
    <section id="introduction" className="scroll-mt-32">
      
      <h2 className="mb-6 text-[32px] leading-[1.2] text-cohere-ink">
        Introduction
      </h2>

      <div className="space-y-6 text-[18px] leading-[1.5] text-cohere-body-muted">
        <p>
          A real-time sign language translator is an artificial intelligence (AI)
          system designed to interpret hand gestures, facial expressions and body
          movements into structured linguistic output such as text or speech.
        </p>

        <p>
          Unlike conventional translation systems that convert between spoken
          languages, sign language translation involves multimodal understanding.
          Sign languages are complete natural languages with their own grammar,
          spatial structure and non-manual markers.
        </p>

        <p>
          Modern systems rely on computer vision pipelines to detect hand and
          body landmarks. These extracted keypoints are then processed using deep
          learning architectures capable of modeling temporal dependencies across
          motion sequences.
        </p>

        <p>
          The goal of real-time translation systems is to minimize latency while
          maintaining semantic accuracy, enabling natural and inclusive
          communication between deaf and hearing communities.
        </p>
      </div>

    </section>
  );
}
