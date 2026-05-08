/**
 * POST /api/seed/chemistry — Seed Chemistry Module 1 into the database
 * This is a one-time setup endpoint.
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import Chapter from '@/models/Chapter';
import Topic from '@/models/Topic';
import Note from '@/models/Note';

const TOPIC_NOTES = [  {
    title: 'Overview of Materials Chemistry',
    slug: 'overview-of-materials-chemistry',
    order: 1,      content: `# Overview of Materials Chemistry
    
## 📌 What Is Materials Chemistry?

### 🔹 Key Concepts
- **Materials Chemistry** = study of how the internal structure of a material (atomic arrangement + bonding) determines its physical, chemical & electrical properties.
- **Interdisciplinary field** integrating chemistry, physics & engineering.
- Two materials can look identical but behave differently due to different atomic arrangements.
- By modifying composition or structure -> materials can be tailored for specific tech needs.

### 🔹 Important Points
- Every electronic device depends on carefully selected materials.
- Computers are not just code - beneath every program lies hardware governed by chemistry.
- Materials chemistry provides the scientific foundation for selecting & modifying computing materials.

---

## 📌 Role of Atomic Composition, Bonding & Structure

| Factor | Role | Example |
|--------|------|---------|
| **Atomic Composition** | Determines valence electrons for bonding/conduction | Si has 4 valence e- -> semiconductor; Cu has loose e- -> conductor |
| **Chemical Bonding** | Defines electrical behavior | Metallic -> conductor; Covalent -> semiconductor; Ionic -> insulator |
| **Structure** | Crystalline vs Amorphous | Single-crystal Si -> microchips; Amorphous -> thin-film transistors |

- **Metallic bonding** -> free electron movement -> high conductivity.
- **Covalent bonding** -> restricted but controllable -> semiconductors.
- **Ionic bonding** -> strongly bound electrons -> insulators.
- **Crystalline**: regular repeating pattern -> predictable electron motion.
- **Amorphous**: no long-range order -> flexible (displays).

---

## 📌 Classification of Materials in Computing

### Conductors
- Allow current to flow easily - large number of free/mobile electrons.
- **Copper (Cu)**: High conductivity + mechanical strength.
- **Aluminum (Al)**: Lightweight + cost-effective.
- **Silver (Ag)**: Highest electrical conductivity among all metals.
- **Used in**: wiring, IC interconnects, PCB copper tracks.

### Semiconductors
- Conductivity lies between conductors and insulators.
- **Most important**: conductivity can be precisely controlled.
- **Silicon (Si)**: Abundant, cheap, thermally stable, forms SiO2.
- **Germanium (Ge)**: High carrier mobility, poor thermal stability.
- **Gallium Arsenide (GaAs)**: Higher electron mobility - high-speed/RF.

### Insulators
- Strongly resist current flow - electrons tightly bound.
- **SiO2**: gate oxide, dielectric in ICs.
- **Glass**: display panels.
- **Ceramics**: electrical insulation + heat resistance.
- **Polymers**: cable insulation, coatings.

---

## 📌 Electronic, Magnetic & Nanomaterials

### Electronic Materials
- Conductivity can be controlled -> transistors, ICs.
- **Analogy**: Conductors = wide pipes; Insulators = blocked; Semiconductors = adjustable valves.

### Magnetic Materials
- Used for data storage (magnetic domains -> binary 0/1).
- **Ferromagnetic**: strongly attracted (hard disks).
- **Paramagnetic**: weakly attracted.
- **Diamagnetic**: slightly repelled.

### Nanomaterials (1-100 nm)
- Unique properties different from bulk.
- High surface-to-volume ratio + quantum effects.
- **Graphene** -> exceptional conductivity -> future computing.
- **Applications**: transistors, sensors, energy storage.

---

## 🧠 Quick Revision
- **Materials Chemistry** = atomic structure -> properties -> applications.
- **3 material types**: Conductor (free e-) | Semiconductor (controlled) | Insulator (bound e-).
- **Electronic materials** = adjustable valves for current.
- **Magnetic materials** -> binary storage.
- **Nanomaterials** -> quantum scale -> future tech.`,
    },
    {
      title: 'Basic Chemical Principles',
      slug: 'basic-chemical-principles',
      order: 2,
      content: `# Basic Chemical Principles

## Atoms: The Fundamental Units of Matter
- An **atom** is the smallest particle that retains the chemical properties of an element.
- **Protons (+)** and **Neutrons (0)** are located in the nucleus, while **Electrons (-)** occupy shells around the nucleus.
- The **Atomic Number** is defined by the number of protons and identifies the element.
- **Valence electrons** (those in the outermost shell) determine the chemical behavior and bonding of the atom.

---

## Elements, Compounds, and Molecules

| Form | Definition | Example |
|------|-----------|---------|
| **Element** | A pure substance consisting of only one kind of atom. | Silicon (Si), Copper (Cu), Gold (Au) |
| **Compound** | Two or more elements chemically combined in a fixed ratio, resulting in new properties. | Silicon Dioxide (SiO2) |
| **Molecule** | A group of atoms bonded together. | Oxygen (O2), Water (H2O) |

- **Critical Materials in Technology**: Silicon (chips), Copper (wiring), Gold and Silver (electrical contacts), and Silicon Dioxide (insulation).

---

## Chemical Bonding

| Bond Type | Mechanism | Example | Electrical Behavior |
|-----------|-----------|---------|-------------|
| **Ionic** | Complete transfer of electrons. | Sodium Chloride (NaCl) | Insulator |
| **Covalent** | Sharing of electrons between atoms. | Water (H2O), Silicon (Si) | Semiconductor |
| **Metallic** | Free movement of delocalized electrons. | Iron (Fe), Copper (Cu) | Conductor |

### The Importance of Covalent Bonds
- Covalent bonds are strong and stable; electrons are shared but not completely free.
- This creates a balance between conductivity and insulation.
- In a Silicon crystal, each atom forms **four covalent bonds**, allowing for controlled conductivity through doping and temperature management.

---

## Chemical Reactivity and Reactions

| Reaction Type | Definition | Example |
|---------------|------------|---------|
| **Oxidation** | The loss of electrons or gain of oxygen. | Iron rusting |
| **Reduction** | The gain of electrons or loss of oxygen. | Copper extraction |
| **Redox** | A reaction where both oxidation and reduction occur simultaneously. | Zn + CuSO4 → ZnSO4 + Cu |

### Key Chemical Formulas
- **Rusting**: 4Fe + 3O2 + 6H2O → Fe2O3·xH2O
- **Copper Extraction**: 2CuO + C → 2Cu + CO2
- **Displacement**: Zn(s) + CuSO4(aq) → ZnSO4(aq) + Cu(s)

### Practical Applications
- **Gold**: As a noble metal, it resists oxidation, making it ideal for high-quality electronic connectors.
- **Corrosion Prevention**: Galvanization involves coating iron with zinc to prevent oxidation.

---

## The Periodic Table and Electron Configuration

| Trend | Direction | Significance |
|-------|-----------|-------------|
| **Atomic Size** | Increases downwards | Larger atoms have electrons that are easier to remove. |
| **Metallic Reactivity** | Increases downwards | More electron shells result in a weaker nuclear hold on valence electrons. |
| **Electronegativity** | Increases upwards and to the right | Stronger attraction for electrons leads to stronger chemical bonds. |
| **Ionization Energy** | Decreases downwards | Lower ionization energy facilitates electrical conduction. |

- **Metals**: Characterized by low ionization energy and low electronegativity, making them excellent conductors.
- **Non-metals**: Possess high electronegativity, acting as insulators.

---

## Summary and Revision
- Atoms consist of protons, neutrons, and electrons.
- The three primary bond types are Ionic (electron transfer), Covalent (electron sharing), and Metallic (free electrons).
- Oxidation involves losing electrons, while reduction involves gaining them.
- Periodic trends are used to guide the selection of materials for specific technological applications.`,
    },
    {
      title: 'Electronic Structure & Bonding',
      slug: 'electronic-structure-and-bonding',
      order: 3,
      content: `# Electronic Structure and Bonding in Materials

## Electronic Structure
- **Electronic structure** refers to the distribution of electrons around an atom's nucleus.
- It determines how a material interacts with electricity, heat, and light.

### Atomic Orbitals and Energy Levels
- An **orbital** is a region in space where an electron is most likely to be found.
- Energy levels are hierarchical: electrons in lower levels are tightly held, while those in higher levels are loosely held.
- Orbitals are classified into types: **s, p, d, and f**, each with unique shapes and electron capacities.

### The Role of Valence Electrons
- Valence electrons determine electrical conductivity, bond formation, and chemical reactivity.
- For example, copper conducts electricity because its valence electrons move easily, whereas plastic is an insulator because its electrons are tightly bound.

---

## Types of Chemical Bonding

### 1. Ionic Bonding
- Involves the complete transfer of electrons, resulting in the formation of cations (+) and anions (-).
- The strong electrostatic attraction leads to a rigid crystal structure.
- Electrons are strongly localized, resulting in **insulating behavior**.
- **Example**: Sodium Chloride (NaCl).

### 2. Covalent Bonding
- Atoms **share electrons** in directional bonds with defined angles.
- This sharing creates a balance between conductivity and insulation, which is the basis for semiconductor behavior.
- **Example**: Silicon crystal (each atom forms four covalent bonds).

### 3. Metallic Bonding
- Consists of positive ions surrounded by a **sea of delocalized electrons**.
- The non-directional nature of these bonds allows for free electron movement, making metals excellent conductors of electricity and heat.
- **Example**: Copper (Cu) and Aluminum (Al).

---

## Band Theory of Solids

### Key Energy Bands
| Band | Description |
|------|------------|
| **Valence Band** | The highest range of electron energies in which electrons are normally present at absolute zero. |
| **Conduction Band** | The range of electron energies high enough to allow electrons to move freely through the material. |
| **Band Gap (Eg)** | The energy difference between the valence band and the conduction band; it represents the minimum energy required for an electron to jump to the conduction band. |

### Classification of Materials
| Material Type | Band Gap | Behavior | Examples |
|---------------|----------|----------|----------|
| **Conductor** | 0 (Bands overlap) | Free flow of electrons | Copper, Silver |
| **Semiconductor** | Small (~1 eV) | Controlled conductivity | Silicon, Germanium |
| **Insulator** | Large (>3 eV) | Electron flow is blocked | Glass, Rubber |

---

## Why Silicon Is Ideal for Microchips
- **Controllable Band Gap**: Silicon has a moderate band gap (~1.1 eV) that allows its conductivity to be precisely tuned.
- **Doping**: Its electrical properties can be modified by adding small amounts of impurities.
- **Abundance**: Silicon is highly abundant and cost-effective.
- **Stable Oxide**: It forms Silicon Dioxide (SiO2), a natural and highly effective insulating layer.
- **Transistor Logic**: These properties make it perfect for creating transistors, which serve as the fundamental ON-OFF switches in computing.

---

## Summary and Revision
- Electronic structure is the primary controller of material properties.
- Material behavior is classified by bond type: Ionic (insulator), Covalent (semiconductor), and Metallic (conductor).
- Band Theory describes material behavior based on the Valence Band, Band Gap, and Conduction Band.
- Silicon's 1.1 eV band gap and its ability to be doped and oxidized make it the industry standard for computing.`,
    },
    {
      title: 'Chemical Properties of Metals & Semiconductors',
      slug: 'chemical-properties-metals-semiconductors',
      order: 4,
      content: `# Chemical Properties of Metals, Semiconductors, and Insulators

## Metal Reactivity
- **Reactivity** is a measure of how readily a metal undergoes chemical reactions.
- It is primarily determined by the **ease with which a metal loses electrons**.
- Factors influencing reactivity include atomic size, nuclear attraction, the number of electron shells, and ionization energy.

### The Reactivity Series
The reactivity of metals from most to least reactive:
**K > Na > Ca > Mg > Al > Zn > Fe > Pb > Cu > Ag > Au > Pt**

| Category | Metals | Behavior |
|----------|--------|----------|
| **Highly Reactive** | K, Na, Ca, Mg | React vigorously with water and acids; must be stored under oil. |
| **Moderately Reactive** | Al, Zn, Fe, Pb | React with acids and require heating to react with water; found as ores in nature. |
| **Least Reactive** | Cu, Ag, Au, Pt | Highly stable; found in their free elemental form; highly resistant to corrosion. |

---

## Energy Changes in Chemical Reactions

### Exothermic Reactions (Energy Released)
- These reactions release energy into the surroundings, typically as heat.
- The temperature of the surroundings increases, and the reaction is often spontaneous once initiated.
- **Example**: 2Mg + O2 → 2MgO + Heat + Light.
- Common examples include rusting and combustion.

### Endothermic Reactions (Energy Absorbed)
- These reactions absorb energy from the surroundings.
- The temperature of the surroundings decreases, and the reaction is typically not spontaneous.
- **Example**: CaCO3 → (Heat) → CaO + CO2.
- Common examples include the extraction of metals from their ores.

---

## Corrosion and its Prevention
- **Corrosion** is the gradual destruction of materials (usually metals) by chemical or electrochemical reactions with their environment.
- **Prevention Methods**:
  - **Galvanization**: Coating a metal (like iron) with a sacrificial layer of Zinc.
  - **Alloying**: Creating mixtures like Stainless Steel (Iron + Chromium + Nickel), where Chromium forms a protective oxide film.
  - **Surface Coatings**: Applying paint, oil, or polymer layers to block contact with oxygen and moisture.

---

## Semiconductor Doping
- **Doping** is the intentional introduction of impurity atoms into a pure semiconductor to modify its electrical properties.
- This process increases the number of charge carriers without altering the crystal structure.

| Doping Type | Dopant | Effect | Primary Carriers |
|-------------|--------|--------|------------------|
| **n-type** | 5 valence electrons (e.g., Phosphorus) | Introduces extra free electrons. | Electrons (-) |
| **p-type** | 3 valence electrons (e.g., Boron) | Creates "holes" (missing electrons). | Holes (+) |

- **p-n Junctions**: The interface between p-type and n-type materials is the fundamental building block of transistors, diodes, and integrated circuits.

---

## Insulators
- Insulators have very low conductivity due to their tightly bound electrons.
- They are chemically stable and have high electrical resistance.
- Their primary role is to prevent short circuits and separate conducting regions.
- In integrated circuits, **Silicon Dioxide (SiO2)** acts as a critical barrier between metal interconnects.

---

## Summary and Revision
- The reactivity series ranks metals by their ease of losing electrons (K to Au).
- Exothermic reactions release energy, while endothermic reactions absorb it.
- Corrosion can be prevented through galvanization, alloying, and protective coatings.
- Doping creates n-type (extra electrons) or p-type (extra holes) semiconductors.
- p-n junctions are the foundation of modern computing hardware.`,
    },
    {
      title: 'Materials for Information Storage & Processing',
      slug: 'materials-information-storage-processing',
      order: 5,
      content: `# Materials for Information Storage and Processing

## Information Storage Technologies

### Magnetic Storage (Hard Disk Drives - HDD)
- Data is stored by altering the **magnetic orientation** of tiny regions on a disk.
- Disks are coated with magnetic alloys containing elements like Iron (Fe), Cobalt (Co), and Platinum (Pt).
- The binary system uses magnetic direction to represent 0 and 1.
- **Limitation**: The reliance on mechanical movement limits access speeds compared to solid-state alternatives.

### Solid-State Storage (Solid State Drives - SSD)
- SSDs have **no moving parts**, making them faster, quieter, and more energy-efficient.
- They are based on semiconductor technology where electrical charge is trapped in transistors.
- **Key Materials**: Silicon, Polysilicon (for floating gates), and Hafnium or Tantalum oxides.

### Optical Storage (CD/DVD/Blu-ray)
- A laser is used to read and write data on a polycarbonate disc.
- The disc features a reflective metal layer (Aluminum, Silver, or Gold).
- Data is represented by microscopic "pits" and "lands" on the surface.

### DNA Data Storage (Emerging Technology)
- Uses the four genetic bases (A, T, C, G) to encode digital information.
- Offers extreme data density and can remain stable for thousands of years.
- **Current Limitations**: Very high cost and slow read/write speeds.

---

## Information Processing Materials

### 1. Silicon and Transistors
- The **transistor** is the fundamental unit of processing, acting as an electronic ON-OFF switch.
- Silicon is ideal because it can act as both a conductor and an insulator, is easily doped, and forms a stable oxide (SiO2).
- It is the primary material for microprocessors, memory chips, and integrated circuits.

### 2. Alternatives to Silicon
- **Graphene**: A single layer of carbon atoms that offers ultra-high electron mobility and thermal conductivity.
- **Carbon Nanotubes**: Cylindrical structures of graphene that provide exceptional strength and electrical speed.
- **Benefits**: These materials promise faster electron transport, lower power consumption, and further miniaturization.

### 3. Superconductors
- Materials that exhibit zero electrical resistance when cooled below a critical temperature.
- **Common Materials**: Niobium, YBCO, and Magnesium Diboride (MgB2).
- **Applications**: Essential for quantum computing and ultra-high-speed processing.
- **Limitation**: Requires extremely low temperatures to function.

---

## Emerging Trends in Computing Materials

| Trend | Key Feature |
|-------|-------------|
| **Neuromorphic Computing** | Uses memristors that "remember" past electrical states, mimicking the human brain's synapses. |
| **3D Integrated Circuits** | Vertically stacked chips that reduce signal travel distance and increase density. |
| **Spintronics** | Utilizes the **spin** of electrons rather than their charge to store and process data, leading to faster, non-volatile memory. |
| **Sustainable Computing** | Development of biodegradable and easily recyclable semiconductor materials. |

---

## Summary and Revision
- **Storage**: HDDs use magnetic alloys; SSDs use silicon and specialized oxides.
- **Optical & DNA**: Polycarbonate and reflective metals are used for discs, while genetic bases are the future of high-density storage.
- **Processing**: Silicon remains the standard due to its versatile properties and SiO2 layer.
- **Next-Gen**: Graphene, carbon nanotubes, and superconductors are poised to overcome silicon's physical limits.
- **Future Paradigms**: Neuromorphic computing, Spintronics, and 3D ICs are defining the next era of hardware.`,
  },
];

export async function GET() {
  return POST();
}

export async function POST() {
  try {
    await dbConnect();

    // 1. Upsert Chemistry subject
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

    // 2. Upsert Module 1 chapter
    const chapter = await Chapter.findOneAndUpdate(
      { subjectId: subject._id, slug: 'module-1-materials-chemistry' },
      {
        $setOnInsert: {
          subjectId: subject._id,
          title: 'Module 1: Materials Chemistry for Computing Systems',
          slug: 'module-1-materials-chemistry',
          order: 1,
          description: 'Atomic structure, bonding, band theory, semiconductors, and computing materials',
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

      results.push({ topic: topicData.title, topicId: topic._id });
    }

    return NextResponse.json({
      success: true,
      subject: { _id: subject._id, name: subject.name },
      chapter: { _id: chapter._id, title: chapter.title },
      topics: results,
      pdfUrl: '/uploads/chemistry-module1.pdf',
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
