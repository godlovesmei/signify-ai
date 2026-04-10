export default function ModelTraining() {
  return (
    <section id="model-training" className="mb-20 scroll-mt-24">
      
      <h2 className="text-3xl font-semibold mb-6">
        Model Training
      </h2>

      <div className="space-y-6 text-lg leading-relaxed text-foreground">

        <p>
          Model training is the process through which a sign language translation 
          system learns to map visual gesture sequences to structured linguistic 
          outputs. Rather than relying on predefined rules, the model optimizes 
          its internal parameters by minimizing prediction error across a labeled dataset.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Dataset Collection
        </h3>
        <p>
          Training begins with curated video datasets containing annotated sign 
          sequences. Each video clip is labeled with corresponding sign glosses 
          or textual meaning. Dataset diversity is critical to ensure that the 
          model generalizes across different signers, dialects and environments.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Data Preprocessing
        </h3>
        <p>
          Raw video frames are transformed into structured representations such 
          as hand landmarks, body pose coordinates or pixel embeddings. Feature 
          normalization and temporal alignment are applied to standardize inputs 
          before training.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Supervised Learning Objective
        </h3>
        <p>
          Most sign recognition systems use supervised learning. During training, 
          the model predicts a sign label for each input sequence and compares 
          it against the ground truth annotation. A loss function—such as 
          cross-entropy loss—is computed to measure prediction error.
        </p>

        <p>
          Optimization algorithms like stochastic gradient descent (SGD) or Adam 
          adjust the model’s parameters iteratively to minimize this loss. Over 
          time, the model learns statistical patterns that associate motion 
          sequences with linguistic meaning.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Validation & Generalization
        </h3>
        <p>
          To prevent overfitting, training data is split into training and 
          validation subsets. Performance is evaluated on unseen validation 
          samples to assess generalization capability. Techniques such as 
          dropout, regularization and data augmentation further improve robustness.
        </p>

        <h3 className="text-xl font-semibold mt-8">
          Fine-Tuning & Continuous Learning
        </h3>
        <p>
          After initial training, models may undergo fine-tuning using domain-
          specific datasets or new signer data. Continuous improvement pipelines 
          allow periodic retraining as more annotated samples become available.
        </p>

        <p>
          Effective model training requires not only large datasets and 
          computational resources, but also careful evaluation protocols to 
          ensure fairness, bias mitigation and consistent performance across 
          demographic groups.
        </p>

      </div>
    </section>
  );
}
