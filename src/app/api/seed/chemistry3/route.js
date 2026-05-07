/**
 * POST /api/seed/chemistry3 — Seed Chemistry Module 3 into the database
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import Chapter from '@/models/Chapter';
import Topic from '@/models/Topic';
import Note from '@/models/Note';

const TOPIC_NOTES = [
  {
    title: 'Introduction & Nanoscale Properties',
    slug: 'introduction-nanoscale-properties',
    order: 1,
    content: `# 📘 Introduction & Nanoscale Properties

## 📌 Introduction to Nanotechnology
**Nanotechnology** deals with the design, characterization, production, and application of materials whose dimensions lie between **1–100 nanometers (nm)**. At this scale, materials exhibit unique physical, chemical, electrical, optical, and magnetic properties that differ significantly from their bulk counterparts. It is not simply miniaturization; it is about **property transformation**.

* **1 nanometer (nm)** = 10⁻⁹ meters
* **Scale perspective**: 1 nm is about 100,000 times smaller than the width of a human hair.
* A typical atom is about 0.1–0.3 nm in size, meaning nanotechnology works at the fundamental level of **atoms and molecules**.

---

## 📌 Nanoscale Properties (Surface Area, Quantum Effects)
Materials behave differently at the nanoscale primarily due to their extremely small size, high surface-to-volume ratio, and quantum confinement effects.

### High Surface-to-Volume Ratio
In nanomaterials, a significant fraction of atoms reside on the surface, dramatically increasing the **surface-to-volume ratio**. 
* **More surface atoms = More active sites**.
* Leads to higher **chemical reactivity**, better **catalytic activity**, and improved interaction with external fields.
* **Example**: Bulk titanium is relatively stable, but nano-titanium dioxide is highly reactive and used in photocatalysis and solar cells.

### Quantum Confinement Effect
When material size approaches the electron wavelength, **energy levels become discrete** and electron motion is confined.
* Classical physics gives way to **quantum mechanics**.
* Electrical, optical, and magnetic properties shift significantly.
* Essential principle for technologies like **Quantum dots**, **Nanotransistors**, and **Spintronics**.`,
  },
  {
    title: 'Fabrication & Chemical Synthesis',
    slug: 'fabrication-chemical-synthesis',
    order: 2,
    content: `# 📘 Fabrication & Chemical Synthesis

## 📌 Fabrication Approaches (Top-down & Bottom-up)
The creation of nanomaterials generally falls into two fundamental strategies:

* **Top-Down Approach**: Starts with bulk material and breaks it down to nanoscale dimensions (Size Reduction Strategy). Examples include mechanical attrition and lithography. This approach offers less control over uniformity and may introduce defects.
* **Bottom-Up Approach**: Builds structures atom by atom or molecule by molecule (Atomic Assembly Strategy). This provides **precise size control**, **uniform morphology**, and **better reproducibility**. Examples include chemical synthesis and self-assembly.

---

## 📌 Chemical Synthesis Methods
Chemical synthesis engineered with precision is crucial for computing applications to control particle size, shape, composition, and crystallinity. Major techniques include:

* **High-Energy Ball Milling**: A physical-chemical hybrid where impact energy reduces particle size, sometimes reacting to form new compounds (e.g., Titanium nitride coatings).
* **Sol-Gel Method**: A colloidal solution (sol) transforms into a solid network (gel) through hydrolysis and condensation. Used for insulating layers and dielectric films.
* **Physical Vapor Deposition (PVD)**: Material transitions from solid to vapor to thin solid film in a vacuum, ensuring high purity for microprocessor interconnects.
* **Chemical Vapor Deposition (CVD)**: Gaseous precursors react at a heated substrate to form a solid thin film. Offers atomic-level thickness control for silicon and graphene layers.
* **Precipitation and Co-Precipitation**: Metal ions react with an agent to form insoluble nanoparticles. Used to produce **magnetic nanoparticles** for high-density storage.`,
  },
  {
    title: 'Nanostructures & Characterization',
    slug: 'nanostructures-characterization',
    order: 3,
    content: `# 📘 Nanostructures & Characterization

## 📌 Nanostructures & Properties
Nanostructures are classified based on their dimensions falling within the nanoscale (1–100 nm):

* **0-Dimensional (0D)**: All dimensions at nanoscale (e.g., Quantum Dots, metal nanoparticles). Strong quantum confinement in all directions.
* **1-Dimensional (1D)**: Two dimensions at nanoscale (e.g., Nanowires, Nanotubes). Used in nanoelectronics and sensors.
* **2-Dimensional (2D)**: One dimension at nanoscale (e.g., Graphene, Thin films). Ideal for flexible electronics.
* **3-Dimensional (3D)**: Bulk materials made of nanoscale blocks (e.g., Nanocomposites).

**Unique Properties**: 
* **Optical**: Driven by Surface Plasmon Resonance (SPR), allowing nanoparticles like gold to display distinct colors based on size.
* **Thermal**: Enhanced heat dissipation capacities (e.g., Graphene).
* **Mechanical**: Incredible strength-to-weight ratios.

---

## 📌 Characterization Techniques
Characterization ensures quality control, performance reliability, and material optimization.

* **Scanning Electron Microscopy (SEM)**: Uses an electron beam to reveal surface morphology, texture, and particle shape. Critical for inspecting semiconductor thin films.
* **Transmission Electron Microscopy (TEM)**: Passes electrons through an ultra-thin sample to show atomic-level details, crystal defects, and grain boundaries.
* **Atomic Force Microscopy (AFM)**: Uses a nanoscale probe to map 3D surface topography and measure roughness without needing a vacuum.
* **X-ray Diffraction (XRD)**: Determines crystal phase, structural purity, and grain size using X-ray scattering.
* **X-ray Photoelectron Spectroscopy (XPS)**: Highly sensitive surface analysis for chemical composition and oxidation states.
* **Thermal & Dynamic Analysis**: Includes Thermal Conductivity measurements (heat management) and Dynamic Light Scattering (measuring particle size in liquid suspensions).`,
  },
  {
    title: 'Nanomaterials in Computing',
    slug: 'nanomaterials-in-computing',
    order: 4,
    content: `# 📘 Nanomaterials in Computing

## 📌 Nanomaterials in Computing
As traditional silicon approaches its physical limits, advanced nanomaterials are driving the next generation of computing.

* **Graphene**: A two-dimensional carbon sheet in a hexagonal lattice. Known for exceptional **electron mobility**, high thermal conductivity, and immense mechanical strength. Crucial for ultra-fast transistors and efficient heat management.
* **Carbon Nanotubes (CNTs)**: Rolled graphene sheets offering **ballistic electron transport** and extreme tensile strength. Vital for advanced microelectronics like CNT-based field-effect transistors.
* **Quantum Dots**: Size-tunable semiconductor crystals. Their emission color depends precisely on their size, enabling high brightness and energy-efficient light emission. Used in QLED displays and quantum computing qubits.

---

## 📌 Quantum Dots & Carbon Nanotubes
* **Quantum Dots (QDs)** are revolutionary because their discrete energy levels allow for precise tuning of their optical and electronic properties simply by changing their size. Smaller dots emit blue light; larger dots emit red. They are essential for advanced displays and bio-imaging markers.
* **Carbon Nanotubes (CNTs)** come in single-walled and multi-walled varieties. Their ability to conduct current with incredibly low resistance (ballistic transport) and superior current density makes them ideal replacements for traditional metallic interconnects in chips.`,
  },
  {
    title: 'Memory Devices & Future Trends',
    slug: 'memory-devices-future-trends',
    order: 5,
    content: `# 📘 Memory Devices & Future Trends

## 📌 Nanomaterials in Memory Devices
Nanotechnology plays a pivotal role in creating next-generation, high-density data storage.

* **Magnetic Nanoparticles**: Produced often via co-precipitation, these materials are fundamental to technologies like **MRAM (Magnetoresistive Random Access Memory)**.
* **Spintronics**: A new paradigm of data storage based on the electron's spin rather than its charge, allowing for non-volatile, high-speed, and low-power memory solutions.

---

## 📌 Future of Nanotechnology in Computing
The future of computing heavily relies on overcoming the fabrication and stability challenges of the nanoscale to unlock novel architectures:

* **Molecular Electronics**: Utilizing individual molecules as fundamental circuit components.
* **Neuromorphic Computing**: Creating artificial synapses with nanoscale memristors to mimic the human brain.
* **Quantum Computing**: Utilizing quantum dots and other nanostructures as qubits for exponential processing power.
* **Overall Advantages**: These advancements promise ultra-small device fabrication, high-speed operations, drastically reduced power consumption, and unprecedented data storage capacities.`,
  }
];

export async function GET() {
  return POST();
}

export async function POST() {
  try {
    await dbConnect();

    // 1. Ensure Chemistry subject exists
    const subject = await Subject.findOneAndUpdate(
      { slug: 'chemistry' },
      {
        $setOnInsert: {
          name: 'Chemistry',
          slug: 'chemistry',
          icon: '🧪',
          color: '#4ECDC4',
          description: 'Organic, Inorganic & Physical Chemistry — Reactions, bonding, and molecular structures',
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

    const results = [];

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
        { topicId: topic._id, source: 'pdf', userId: null },
        {
          topicId: topic._id,
          content: topicData.content,
          source: 'pdf',
          userId: null,
          updatedAt: new Date(),
        },
        { upsert: true, new: true, returnDocument: 'after' }
      );

      results.push({ topic: topicData.title, topicId: topic._id });
    }

    return NextResponse.json({
      success: true,
      subject: { _id: subject._id, name: subject.name },
      chapter: { _id: chapter._id, title: chapter.title },
      topics: results,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
