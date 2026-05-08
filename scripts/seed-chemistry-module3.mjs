/**
 * Seed Module 3 directly to production
 */
import mongoose from 'mongoose';

const TOPIC_NOTES = [
  {
    title: 'Introduction and Nanoscale Properties',
    slug: 'introduction-nanoscale-properties',
    order: 1,
    content: `# Introduction and Nanoscale Properties

## Introduction to Nanotechnology
**Nanotechnology** involves the design, characterization, production, and application of materials with dimensions between **1 and 100 nanometers (nm)**. At this scale, materials exhibit unique physical, chemical, electrical, optical, and magnetic properties that differ significantly from their bulk counterparts. This field is not merely about miniaturization; it is centered on **property transformation**.

- **1 nanometer (nm)** = 10⁻⁹ meters.
- **Scale Perspective**: 1 nm is approximately 100,000 times smaller than the width of a human hair.
- A typical atom is roughly 0.1 to 0.3 nm in size, meaning nanotechnology operates at the fundamental level of **atoms and molecules**.

---

## Nanoscale Properties: Surface Area and Quantum Effects
Materials behave differently at the nanoscale primarily due to their extremely small size, high surface-to-volume ratio, and quantum confinement effects.

### High Surface-to-Volume Ratio
In nanomaterials, a significant fraction of atoms reside on the surface, which dramatically increases the **surface-to-volume ratio**.
- **Increased Active Sites**: A higher percentage of surface atoms leads to more active sites.
- **Enhanced Properties**: This results in higher **chemical reactivity**, superior **catalytic activity**, and improved interaction with external fields.
- **Example**: While bulk titanium is relatively stable, nano-titanium dioxide is highly reactive and is used in photocatalysis and solar cells.

### Quantum Confinement Effect
When the size of a material approaches the wavelength of an electron, **energy levels become discrete** and electron motion is confined.
- **Physics Shift**: Classical physics principles are replaced by **quantum mechanics**.
- **Property Shifts**: Electrical, optical, and magnetic properties shift significantly at this scale.
- **Applications**: This principle is essential for technologies such as **Quantum dots**, **Nanotransistors**, and **Spintronics**.`,
  },
  {
    title: 'Fabrication and Chemical Synthesis',
    slug: 'fabrication-chemical-synthesis',
    order: 2,
    content: `# Fabrication and Chemical Synthesis

## Fabrication Approaches: Top-down and Bottom-up
The creation of nanomaterials generally follows two fundamental strategies:

- **Top-Down Approach**: This strategy starts with a bulk material and reduces it to nanoscale dimensions (Size Reduction Strategy). Examples include mechanical attrition and lithography. While effective, this approach often offers less control over uniformity and may introduce structural defects.
- **Bottom-Up Approach**: This strategy builds structures atom by atom or molecule by molecule (Atomic Assembly Strategy). It provides **precise size control**, **uniform morphology**, and **superior reproducibility**. Examples include chemical synthesis and self-assembly.

---

## Chemical Synthesis Methods
Chemical synthesis engineered with precision is crucial for computing applications to control particle size, shape, composition, and crystallinity. Major techniques include:

- **High-Energy Ball Milling**: A physical-chemical hybrid method where impact energy is used to reduce particle size, sometimes causing reactions that form new compounds, such as Titanium nitride coatings.
- **Sol-Gel Method**: A process where a colloidal solution (sol) transforms into a solid network (gel) through hydrolysis and condensation. This method is used to create insulating layers and dielectric films.
- **Physical Vapor Deposition (PVD)**: A technique where material transitions from a solid to a vapor and then back to a thin solid film in a vacuum, ensuring the high purity required for microprocessor interconnects.
- **Chemical Vapor Deposition (CVD)**: Gaseous precursors react on a heated substrate to form a solid thin film. This provides atomic-level thickness control for silicon and graphene layers.
- **Precipitation and Co-Precipitation**: Metal ions react with a chemical agent to form insoluble nanoparticles. This is used to produce **magnetic nanoparticles** for high-density data storage.`,
  },
  {
    title: 'Nanostructures and Characterization',
    slug: 'nanostructures-characterization',
    order: 3,
    content: `# Nanostructures and Characterization

## Nanostructures and Their Properties
Nanostructures are classified based on the number of dimensions that fall within the nanoscale (1-100 nm):

- **0-Dimensional (0D)**: All dimensions are at the nanoscale (e.g., Quantum Dots, metal nanoparticles). These exhibit strong quantum confinement in all directions.
- **1-Dimensional (1D)**: Two dimensions are at the nanoscale (e.g., Nanowires, Nanotubes). These are primarily used in nanoelectronics and sensors.
- **2-Dimensional (2D)**: One dimension is at the nanoscale (e.g., Graphene, Thin films). These materials are ideal for flexible electronics.
- **3-Dimensional (3D)**: Bulk materials composed of nanoscale building blocks (e.g., Nanocomposites).

### Unique Properties
- **Optical**: Driven by Surface Plasmon Resonance (SPR), allowing nanoparticles like gold to display distinct colors based on their size.
- **Thermal**: Enhanced heat dissipation capabilities, as seen in materials like Graphene.
- **Mechanical**: Nanomaterials often possess incredible strength-to-weight ratios.

---

## Characterization Techniques
Characterization is essential for ensuring quality control, performance reliability, and material optimization in computing systems.

- **Scanning Electron Microscopy (SEM)**: Uses an electron beam to reveal surface morphology, texture, and particle shape. It is critical for inspecting semiconductor thin films.
- **Transmission Electron Microscopy (TEM)**: Passes electrons through an ultra-thin sample to reveal atomic-level details, crystal defects, and grain boundaries.
- **Atomic Force Microscopy (AFM)**: Uses a nanoscale probe to map 3D surface topography and measure roughness without the need for a vacuum environment.
- **X-ray Diffraction (XRD)**: Used to determine the crystal phase, structural purity, and grain size through X-ray scattering patterns.
- **X-ray Photoelectron Spectroscopy (XPS)**: A highly sensitive surface analysis technique used to determine chemical composition and oxidation states.
- **Thermal and Dynamic Analysis**: Includes thermal conductivity measurements for heat management and Dynamic Light Scattering (DLS) for measuring particle size in liquid suspensions.`,
  },
  {
    title: 'Nanomaterials in Computing',
    slug: 'nanomaterials-in-computing',
    order: 4,
    content: `# Nanomaterials in Computing

## The Role of Nanomaterials in Computing
As traditional silicon approaches its physical limits, advanced nanomaterials are driving the development of the next generation of computing hardware.

- **Graphene**: A two-dimensional carbon sheet arranged in a hexagonal lattice. It is known for its exceptional **electron mobility**, high thermal conductivity, and immense mechanical strength. Graphene is crucial for ultra-fast transistors and efficient heat management.
- **Carbon Nanotubes (CNTs)**: Rolled graphene sheets that offer **ballistic electron transport** and extreme tensile strength. They are vital for advanced microelectronics, such as CNT-based field-effect transistors.
- **Quantum Dots**: Size-tunable semiconductor crystals whose emission color depends precisely on their size. They enable high brightness and energy-efficient light emission, making them ideal for QLED displays and quantum computing qubits.

---

## Quantum Dots and Carbon Nanotubes
- **Quantum Dots (QDs)** are revolutionary because their discrete energy levels allow for precise tuning of optical and electronic properties simply by changing their physical size. Smaller dots emit blue light, while larger dots emit red. They are essential for advanced displays and biological imaging markers.
- **Carbon Nanotubes (CNTs)** are available in single-walled and multi-walled varieties. Their ability to conduct current with incredibly low resistance (ballistic transport) and superior current density makes them ideal replacements for traditional metallic interconnects in high-performance chips.`,
  },
  {
    title: 'Memory Devices and Future Trends',
    slug: 'memory-devices-future-trends',
    order: 5,
    content: `# Memory Devices and Future Trends

## Nanomaterials in Memory Devices
Nanotechnology plays a pivotal role in the creation of next-generation, high-density data storage solutions.

- **Magnetic Nanoparticles**: Often produced via co-precipitation, these materials are fundamental to technologies like **MRAM (Magnetoresistive Random Access Memory)**.
- **Spintronics**: A new paradigm of data storage based on the electron's spin rather than its charge, allowing for non-volatile, high-speed, and low-power memory solutions.

---

## The Future of Nanotechnology in Computing
The future of computing relies on overcoming the fabrication and stability challenges of the nanoscale to unlock novel architectures:

- **Molecular Electronics**: Utilizing individual molecules as fundamental circuit components.
- **Neuromorphic Computing**: Creating artificial synapses with nanoscale memristors to mimic the neural architecture of the human brain.
- **Quantum Computing**: Utilizing quantum dots and other nanostructures as qubits to achieve exponential processing power.
- **Key Advantages**: These advancements promise ultra-small device fabrication, high-speed operations, drastically reduced power consumption, and unprecedented data storage capacities.`,
  }
];

// ── Schemas (inline to avoid ESM import issues) ──────────────────
const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  icon: { type: String, default: '📚' },
  color: { type: String, default: '#6C63FF' },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
});
const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);

const ChapterSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, lowercase: true },
  order: { type: Number, default: 0 },
  description: { type: String, default: '' },
});
ChapterSchema.index({ subjectId: 1, slug: 1 }, { unique: true });
const Chapter = mongoose.models.Chapter || mongoose.model('Chapter', ChapterSchema);

const TopicSchema = new mongoose.Schema({
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, lowercase: true },
  order: { type: Number, default: 0 },
  videoUrl: { type: String, default: '' },
});
TopicSchema.index({ chapterId: 1, slug: 1 }, { unique: true });
const Topic = mongoose.models.Topic || mongoose.model('Topic', TopicSchema);

const NoteSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  content: { type: String, default: '' },
  source: { type: String, enum: ['system', 'user', 'pdf', 'ai'], default: 'system' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
NoteSchema.index({ topicId: 1, userId: 1 });
const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

// ── Connect to DB (same logic as src/lib/db.js) ─────────────────
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studyos';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('✓ Connected to MongoDB');
  } catch {
    console.log('⚠ Primary MongoDB unavailable, trying memory server...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log('✓ Connected to MongoMemoryServer');
  }
}

async function seed() {
  await connectDB();

  // 1. Ensure Chemistry subject exists
  const subject = await Subject.findOneAndUpdate(
    { slug: 'chemistry' },
    {
      $setOnInsert: {
        name: 'Chemistry',
        slug: 'chemistry',
        icon: '🧪',
        color: '#4ECDC4',
        description: 'Organic, Inorganic & Physical Chemistry - Reactions, bonding, and molecular structures',
        order: 2,
      },
    },
    { upsert: true, new: true, returnDocument: 'after' }
  );

  // 2. Upsert Module 3 chapter
  const chapter = await Chapter.findOneAndUpdate(
    { subjectId: subject._id, slug: 'module-3-nanotechnology' },
    {
      $setOnInsert: {
        subjectId: subject._id,
        title: 'Module 3: Nanotechnology',
        slug: 'module-3-nanotechnology',
        order: 3,
        description: 'Nanoscale Properties, Fabrication, Characterization, and Applications in Computing',
      },
    },
    { upsert: true, new: true, returnDocument: 'after' }
  );

  // 3. Create topics and notes
  for (const topicData of TOPIC_NOTES) {
    const topic = await Topic.findOneAndUpdate(
      { chapterId: chapter._id, slug: topicData.slug },
      {
        $setOnInsert: {
          chapterId: chapter._id,
          subjectId: subject._id,
          title: topicData.title,
          slug: topicData.slug,
          order: topicData.order,
        },
      },
      { upsert: true, new: true, returnDocument: 'after' }
    );

    await Note.findOneAndUpdate(
      { topicId: topic._id, userId: null },
      {
        topicId: topic._id,
        content: topicData.content,
        source: 'pdf',
        userId: null,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, returnDocument: 'after' }
    );
    console.log('  ✓ Inserted topic:', topicData.title);
  }

  console.log('🎉 Chemistry Module 3 seeded to remote database successfully!');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
