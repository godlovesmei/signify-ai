export default function ResearchDevelopment() {
  return (
    <section id="research-development" className="mb-20 scroll-mt-24">
      
      <h2 className="text-3xl font-semibold mb-6">
        Research & Development
      </h2>

      <div className="space-y-6 text-lg leading-relaxed text-foreground">

        <p>
          Research and development efforts focus on improving recognition 
          accuracy, expanding linguistic coverage and reducing latency in 
          real-time sign language translation systems. Continuous experimentation 
          and validation are essential to ensure scalable and inclusive deployment.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Multimodal Learning
        </h3>
        <p>
          Current research explores multimodal architectures that integrate 
          hand pose, facial expression and upper-body movement simultaneously. 
          Since sign language relies heavily on non-manual markers, combining 
          these modalities improves semantic understanding and contextual accuracy.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Transformer-Based Architectures
        </h3>
        <p>
          Transformer models have shown strong performance in sequential 
          modeling tasks. By leveraging attention mechanisms, these architectures 
          capture long-range dependencies within gesture sequences more effectively 
          than traditional recurrent networks.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Low-Resource Sign Languages
        </h3>
        <p>
          Many sign languages lack large annotated datasets. Research initiatives 
          aim to address this through transfer learning, synthetic data generation 
          and self-supervised learning approaches. These techniques enable 
          performance improvements even in data-constrained environments.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Real-Time Optimization
        </h3>
        <p>
          Model compression techniques such as quantization and pruning are 
          actively investigated to reduce computational requirements. Efficient 
          deployment ensures that systems can operate on edge devices without 
          sacrificing prediction reliability.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Ethical & Inclusive AI
        </h3>
        <p>
          Responsible development requires evaluation across diverse signer 
          demographics to mitigate bias. Fairness testing, transparent 
          benchmarking and community collaboration are essential components 
          of long-term research strategy.
        </p>

        <p>
          Ongoing development emphasizes scalability, interpretability and 
          accessibility—ensuring that technological progress translates into 
          meaningful impact for Deaf and hard-of-hearing communities.
        </p>

      </div>
    </section>
  );
}
