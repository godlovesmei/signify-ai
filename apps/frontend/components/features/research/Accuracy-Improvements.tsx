export default function AccuracyImprovements() {
  return (
    <section>
      
      <h2 className="mb-6 text-[32px] leading-[1.2] text-[var(--color-text-primary)]">
        Accuracy & Improvements
      </h2>

      <div className="space-y-6 text-[18px] leading-[1.5] text-[var(--color-text-secondary)]">

        <p>
          Achieving high accuracy in real-time sign language translation is a 
          complex challenge due to variations in signing speed, regional dialects, 
          lighting conditions, camera angles and individual signer differences. 
          Unlike static image classification, sign recognition requires modeling 
          temporal motion patterns across sequential frames.
        </p>

        <p>
          One of the primary factors influencing performance is dataset quality. 
          Larger and more diverse datasets significantly improve model 
          generalization. Data augmentation techniques—such as random rotation, 
          brightness adjustment and temporal scaling—help models remain robust 
          under real-world conditions.
        </p>

        <p>
          Model architecture also plays a critical role. While early systems 
          relied on convolutional neural networks (CNNs), modern approaches 
          incorporate transformer-based sequence modeling to better capture 
          long-range temporal dependencies. Attention mechanisms allow the model 
          to focus on relevant gesture segments rather than treating all frames 
          equally.
        </p>

        <p>
          Another major improvement comes from multimodal learning. Combining 
          hand landmarks, body pose estimation and facial expression analysis 
          enhances contextual understanding. Non-manual markers such as eyebrow 
          movements and mouth shapes often carry grammatical meaning in sign 
          languages.
        </p>

        <p>
          Latency optimization is equally important. Real-time systems must 
          balance inference speed and prediction accuracy. Techniques such as 
          model quantization, pruning and edge-device optimization reduce 
          computational cost without significantly sacrificing performance.
        </p>

        <p>
          Ongoing research continues to explore self-supervised learning, 
          cross-lingual sign adaptation and bias mitigation strategies to 
          ensure fair and inclusive AI systems. As datasets grow and modeling 
          techniques evolve, real-time sign language translation systems are 
          expected to achieve higher semantic fidelity and broader deployment 
          capability.
        </p>

      </div>
    </section>
  );
}
