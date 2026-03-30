export default function AIMachineLearning() {
  return (
    <section id="ai-machine-learning" className="mb-20 scroll-mt-24">
      
      <h2 className="text-3xl font-semibold mb-6">
        AI & Machine Learning
      </h2>

      <div className="space-y-6 text-lg leading-relaxed text-foreground">

        <p>
          Artificial intelligence (AI) forms the foundation of modern real-time 
          sign language translation systems. At its core, machine learning enables 
          models to learn patterns from visual data rather than relying on 
          explicitly programmed rules. This shift from rule-based systems to 
          data-driven architectures has dramatically improved recognition accuracy.
        </p>

        <p>
          Most sign recognition pipelines begin with computer vision preprocessing. 
          Video frames are analyzed to extract structured representations such as 
          hand landmarks, body pose keypoints and facial features. These structured 
          inputs reduce noise and allow the learning model to focus on meaningful 
          motion patterns.
        </p>

        <p>
          Early approaches relied heavily on convolutional neural networks (CNNs) 
          for spatial feature extraction. While effective for static gesture 
          recognition, CNN-based systems struggled to capture long-range temporal 
          dependencies in continuous signing.
        </p>

        <p>
          To address this limitation, sequential models such as recurrent neural 
          networks (RNNs), long short-term memory networks (LSTMs) and more 
          recently transformer architectures have been adopted. Transformers use 
          attention mechanisms to model relationships between frames across time, 
          significantly improving performance in continuous sign recognition tasks.
        </p>

        <p>
          In addition to supervised learning, emerging research explores 
          self-supervised and semi-supervised approaches to reduce dependency on 
          large labeled datasets. These methods allow models to learn motion 
          representations from unlabeled video data, which is particularly valuable 
          given the limited availability of annotated sign language corpora.
        </p>

        <p>
          Real-time deployment introduces further engineering considerations. 
          Models must balance predictive accuracy with computational efficiency. 
          Techniques such as model pruning, quantization and edge inference 
          optimization enable low-latency translation suitable for mobile and 
          browser-based applications.
        </p>

        <p>
          As AI research continues to evolve, multimodal architectures combining 
          vision, linguistic modeling and contextual reasoning are expected to 
          further enhance semantic understanding in sign language translation systems.
        </p>

      </div>
    </section>
  );
}
