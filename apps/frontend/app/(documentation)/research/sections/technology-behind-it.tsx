export default function TechnologyBehindIt() {
  return (
    <section id="technology-behind-it" className="mb-20 scroll-mt-24">
      
      <h2 className="text-3xl font-semibold mb-6">
        Technology Behind It
      </h2>

      <div className="space-y-6 text-lg leading-relaxed text-foreground">

        <p>
          The sign language translation system is powered by an integrated stack 
          of computer vision, deep learning and natural language processing 
          technologies. Each component contributes to transforming visual gestures 
          into structured and meaningful language output.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Computer Vision
        </h3>
        <p>
          Computer vision models extract spatial features from live video input. 
          Keypoint detection algorithms identify hand joints, body pose and facial 
          landmarks. These structured representations reduce noise and provide 
          consistent inputs for sequence modeling.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Deep Learning Models
        </h3>
        <p>
          Convolutional neural networks (CNNs) and transformer-based architectures 
          process visual and temporal information. CNNs capture spatial patterns, 
          while temporal models learn motion dynamics across sequential frames. 
          Attention mechanisms further enhance contextual understanding.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Sequence Modeling
        </h3>
        <p>
          Since sign language relies on continuous movement, the system applies 
          sequence modeling techniques such as recurrent neural networks (RNNs), 
          long short-term memory (LSTM) networks or transformers. These models 
          analyze frame-by-frame transitions to recognize complete sign phrases.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Natural Language Processing
        </h3>
        <p>
          After gesture classification, natural language processing modules 
          restructure predicted sign sequences into grammatically coherent text. 
          This step ensures output readability and improves usability in 
          real-world communication contexts.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Deployment & Infrastructure
        </h3>
        <p>
          Optimized inference pipelines enable real-time performance. Techniques 
          such as model quantization, hardware acceleration and edge deployment 
          strategies reduce latency while maintaining accuracy. Scalable cloud 
          infrastructure supports dataset expansion and continuous retraining.
        </p>

        <p>
          Together, these technologies form a cohesive system capable of 
          interpreting complex human gestures into accessible digital language.
        </p>

      </div>
    </section>
  );
}
