export default function HowItWorks() {
  return (
    <section>
      
      <h2 className="mb-4 text-[32px] leading-[1.2] text-[var(--color-text-primary)]">
        How It Works
      </h2>

      <div className="space-y-5 text-[18px] leading-[1.5] text-[var(--color-text-secondary)]">

        <p>
          A real-time sign language translation system operates through a 
          multi-stage pipeline that converts visual input into structured 
          linguistic output. The process integrates computer vision, sequence 
          modeling and language interpretation within a low-latency framework.
        </p>

        <h3 className="mt-6 text-[24px] leading-[1.3] text-[var(--color-text-primary)]">
          1. Video Capture
        </h3>
        <p>
          The system begins by capturing live video input from a camera. 
          Frames are processed continuously to ensure smooth temporal analysis. 
          Frame rate stability is critical to maintaining accurate motion tracking.
        </p>

        <h3 className="mt-6 text-[24px] leading-[1.3] text-[var(--color-text-primary)]">
          2. Landmark Detection
        </h3>
        <p>
          Computer vision models detect key landmarks on the hands, body and 
          face. These landmarks represent spatial coordinates of joints and 
          facial features. Extracting structured keypoints reduces background 
          noise and standardizes visual input for downstream models.
        </p>

        <h3 className="mt-6 text-[24px] leading-[1.3] text-[var(--color-text-primary)]">
          3. Temporal Modeling
        </h3>
        <p>
          Since sign language is inherently dynamic, the system analyzes 
          sequences of frames rather than isolated images. Temporal models—such 
          as recurrent neural networks (RNNs) or transformer architectures—learn 
          motion patterns and contextual dependencies across time.
        </p>

        <h3 className="mt-6 text-[24px] leading-[1.3] text-[var(--color-text-primary)]">
          4. Gesture Classification
        </h3>
        <p>
          The processed sequence is passed into a classification layer that 
          predicts the most probable sign label. For continuous signing, 
          segmentation algorithms identify boundaries between individual signs.
        </p>

        <h3 className="mt-6 text-[24px] leading-[1.3] text-[var(--color-text-primary)]">
          5. Language Output
        </h3>
        <p>
          Finally, predicted sign sequences are converted into readable text 
          or synthesized speech. Some systems incorporate natural language 
          processing (NLP) modules to restructure output into grammatically 
          coherent spoken language.
        </p>

        <p>
          The entire pipeline must operate within milliseconds to maintain 
          real-time responsiveness. Efficient inference, optimized model size 
          and hardware acceleration are therefore essential for practical deployment.
        </p>

      </div>
    </section>
  );
}
