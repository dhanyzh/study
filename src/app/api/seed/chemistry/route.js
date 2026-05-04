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

const TOPIC_NOTES = [
  {
    title: 'Overview of Materials Chemistry',
    slug: 'overview-of-materials-chemistry',
    order: 1,
    content: `# 📘 Overview of Materials Chemistry

## 📌 What Is Materials Chemistry?

### 🔹 Key Concepts
- **Materials Chemistry** = study of how the internal structure of a material (atomic arrangement + bonding) determines its physical, chemical & electrical properties
- Interdisciplinary field integrating chemistry, physics & engineering
- Two materials can look identical but behave differently due to different **atomic arrangements**
- By modifying composition or structure → materials can be **tailored** for specific tech needs

### 🔹 Important Points
- Every electronic device depends on **carefully selected materials**
- Computers are not just code — beneath every program lies **hardware governed by chemistry**
- Materials chemistry provides the **scientific foundation** for selecting & modifying computing materials

---

## 📌 Role of Atomic Composition, Bonding & Structure

| Factor | Role | Example |
|--------|------|---------|
| **Atomic Composition** | Determines valence electrons for bonding/conduction | Si has 4 valence e⁻ → semiconductor; Cu has loose e⁻ → conductor |
| **Chemical Bonding** | Defines electrical behavior | Metallic → conductor; Covalent → semiconductor; Ionic → insulator |
| **Structure** | Crystalline vs Amorphous | Single-crystal Si → microchips; Amorphous → thin-film transistors |

- **Metallic bonding** → free electron movement → high conductivity
- **Covalent bonding** → restricted but controllable → semiconductors
- **Ionic bonding** → strongly bound electrons → insulators
- **Crystalline**: regular repeating pattern → predictable electron motion
- **Amorphous**: no long-range order → flexible (displays)

---

## 📌 Classification of Materials in Computing

### Conductors
- Allow current to flow easily — large number of free/mobile electrons
- **Copper (Cu)**: High conductivity + mechanical strength
- **Aluminum (Al)**: Lightweight + cost-effective
- **Silver (Ag)**: **Highest** electrical conductivity among all metals
- Used in: wiring, IC interconnects, PCB copper tracks

### Semiconductors
- Conductivity lies **between** conductors and insulators
- **Most important**: conductivity can be precisely controlled
- **Silicon (Si)**: Abundant, cheap, thermally stable, forms SiO₂
- **Germanium (Ge)**: High carrier mobility, poor thermal stability
- **Gallium Arsenide (GaAs)**: Higher electron mobility — high-speed/RF

### Insulators
- Strongly resist current flow — electrons tightly bound
- **SiO₂**: gate oxide, dielectric in ICs
- **Glass**: display panels
- **Ceramics**: electrical insulation + heat resistance
- **Polymers**: cable insulation, coatings

---

## 📌 Electronic, Magnetic & Nanomaterials

### Electronic Materials
- Conductivity can be controlled → transistors, ICs
- Analogy: Conductors = wide pipes; Insulators = blocked; Semiconductors = **adjustable valves**

### Magnetic Materials
- Used for data storage (magnetic domains → binary 0/1)
- **Ferromagnetic**: strongly attracted (hard disks)
- **Paramagnetic**: weakly attracted
- **Diamagnetic**: slightly repelled

### Nanomaterials (1–100 nm)
- Unique properties different from bulk
- High surface-to-volume ratio + quantum effects
- **Graphene** → exceptional conductivity → future computing
- Applications: transistors, sensors, energy storage

---

## 🧠 Quick Revision
- Materials Chemistry = atomic structure → properties → applications
- 3 material types: Conductor (free e⁻) | Semiconductor (controlled) | Insulator (bound e⁻)
- Electronic materials = adjustable valves for current
- Magnetic materials → binary storage
- Nanomaterials → quantum scale → future tech`,
  },
  {
    title: 'Basic Chemical Principles',
    slug: 'basic-chemical-principles',
    order: 2,
    content: `# 📘 Basic Chemical Principles

## 📌 Atoms — Fundamental Units of Matter
- **Atom** = smallest particle retaining element's chemical properties
- **Protons** (+): in nucleus | **Neutrons** (0): in nucleus | **Electrons** (−): shells around nucleus
- Atomic number = number of protons = defines element
- Valence electrons (outermost shell) → determine chemical behavior

---

## 📌 Elements, Compounds & Molecules

| Form | Definition | Example |
|------|-----------|---------|
| **Element** | Pure substance of one kind of atom | Si, Cu, Au, Ag |
| **Compound** | 2+ elements chemically combined (fixed ratio) → new properties | SiO₂ |
| **Molecule** | Atoms bonded together | O₂, H₂O |

**Tech-important**: Si (chips), Cu (wires), Au/Ag (contacts), SiO₂ (insulation)

---

## 📌 Chemical Bonding

| Bond Type | Mechanism | Example | Conductivity |
|-----------|-----------|---------|-------------|
| **Ionic** | Electron transfer | NaCl | Insulator |
| **Covalent** | Electron sharing | H₂O, Si | Semiconductor |
| **Metallic** | Free electron movement | Fe, Cu | Conductor |

### Why Covalent Bonds Matter
- Strong, stable; electrons shared but not completely free
- Creates balance between conductivity and insulation
- Si crystal: each atom forms **4 covalent bonds** → controlled conductivity

---

## 📌 Chemical Reactivity & Reactions

| Reaction | Definition | Example |
|----------|-----------|---------|
| **Oxidation** | Loss of electrons / gain of O₂ | Iron rusting |
| **Reduction** | Gain of electrons / loss of O₂ | Cu extraction |
| **Redox** | Both occur together | Zn + CuSO₄ → ZnSO₄ + Cu |

### Key Formulas
- **Rusting**: 4Fe + 3O₂ + 6H₂O → Fe₂O₃·xH₂O
- **Cu extraction**: 2CuO + C → 2Cu + CO₂
- **Displacement**: Zn(s) + CuSO₄(aq) → ZnSO₄(aq) + Cu(s)

### Gold stays shiny: Noble metal → resists oxidation → used in electronic connectors
### Corrosion prevention: Galvanization (zinc coating on iron)

---

## 📌 Periodic Table & Electron Configuration

| Trend | Direction | Significance |
|-------|-----------|-------------|
| Atomic Size | Increases ↓ | Larger atoms → easier to remove e⁻ |
| Reactivity (metals) | Increases ↓ | More shells → weaker nuclear hold |
| Electronegativity | Increases ↑→ | Stronger e⁻ attraction → stronger bonds |
| Ionization Energy | Decreases ↓ | Lower IE → easier conduction |

- **Metals**: Low IE + Low electronegativity → good conductors
- **Non-metals**: High electronegativity → insulators

---

## 🧠 Quick Revision
- Atoms: protons(+) + neutrons(0) + electrons(−)
- 3 bond types: Ionic(transfer) | Covalent(share) | Metallic(free e⁻)
- Oxidation = lose e⁻; Reduction = gain e⁻
- Periodic trends guide material selection`,
  },
  {
    title: 'Electronic Structure & Bonding',
    slug: 'electronic-structure-and-bonding',
    order: 3,
    content: `# 📘 Electronic Structure & Bonding in Materials

## 📌 Electronic Structure
- **Electronic structure** = how electrons are distributed around the nucleus
- Determines interaction with electricity, heat & light

### Atomic Orbitals & Energy Levels
- **Orbital** = region where electron is most likely found
- Energy levels like floors: Lower = tightly held; Higher = loosely held
- Types: **s, p, d, f** (different shapes & capacities)

### Valence Electrons decide:
- Electrical conductivity | Bond formation | Chemical reactivity
- Cu conducts → valence e⁻ move easily; Plastic doesn't → e⁻ tightly bound

---

## 📌 Types of Chemical Bonding

### 1. Ionic Bonding
- Complete transfer of electron(s) → cations(+) and anions(−)
- Strong electrostatic attraction → rigid crystal → **insulating behavior**
- Example: NaCl

### 2. Covalent Bonding
- Atoms **share electrons** → directional bonds → defined angles
- Balance between conductivity and insulation → semiconductor behavior
- Example: Si crystal (4 covalent bonds per atom)

### 3. Metallic Bonding
- Positive ions + **sea of delocalized electrons** → non-directional
- Free movement → excellent conductors of electricity & heat
- Example: Cu, Al (wiring, interconnects)

---

## 📌 Band Theory of Solids

| Band | Description |
|------|------------|
| **Valence Band** | Occupied by electrons at 0K; involved in bonding |
| **Conduction Band** | Electrons free to move → conduction |
| **Band Gap (Eg)** | Energy difference VB→CB; min energy for e⁻ to jump |

### Classification
| Material | Band Gap | Examples |
|----------|----------|----------|
| **Conductor** | 0 (overlap) | Cu, Ag |
| **Semiconductor** | Small (~1 eV) | Si, Ge |
| **Insulator** | Large (>3 eV) | Glass, Rubber |

---

## 📌 Why Silicon Is Ideal for Microchips
- Moderate band gap (~1.1 eV) → controllable
- Conductivity tuned via **doping**
- Abundant and cost-effective
- SiO₂ forms natural insulating layer
- Perfect for **transistors** (ON-OFF switches)

---

## 🧠 Quick Revision
- Electronic structure controls all material properties
- Ionic = insulator | Covalent = semiconductor | Metallic = conductor
- Band Theory: VB → Band Gap → CB
- Si ideal: 1.1 eV gap, dopable, abundant, forms SiO₂`,
  },
  {
    title: 'Chemical Properties of Metals & Semiconductors',
    slug: 'chemical-properties-metals-semiconductors',
    order: 4,
    content: `# 📘 Chemical Properties of Metals, Semiconductors & Insulators

## 📌 Metal Reactivity
- **Reactivity** = how readily a metal undergoes chemical reactions
- Determined by **ease of losing electrons**

### Reactivity Series
**Most → Least Reactive**: K > Na > Ca > Mg > Al > Zn > Fe > Pb > Cu > Ag > Au > Pt

| Category | Metals | Behavior |
|----------|--------|----------|
| **Highly Reactive** | K, Na, Ca, Mg | React with water/acids; stored under oil |
| **Moderately Reactive** | Al, Zn, Fe, Pb | React with acids; need heating; found as ores |
| **Least Reactive** | Cu, Ag, Au, Pt | Very stable; found free; don't corrode |

---

## 📌 Energy Changes

### Exothermic — energy RELEASED
- Temperature increases; spontaneous once started
- **2Mg + O₂ → 2MgO + heat + light**
- Examples: rusting (slow), Na+water, combustion

### Endothermic — energy ABSORBED
- Temperature decreases; NOT spontaneous
- **CaCO₃ →(heat)→ CaO + CO₂**
- Examples: metal extraction, decomposition

---

## 📌 Corrosion & Prevention
- **Corrosion** = gradual destruction by chemical reactions
- **Galvanization**: Zinc coating (sacrificial metal)
- **Alloying**: Stainless steel (Fe+Cr+Ni) — Cr forms oxide film
- **Surface coatings**: Paint, oil, polymer layers

---

## 📌 Semiconductor Doping (VERY IMPORTANT)
- Intentional introduction of impurity atoms into pure semiconductor

| Type | Dopant | Effect | Carriers |
|------|--------|--------|----------|
| **n-type** | 5 valence e⁻ (Phosphorus) | Extra free electrons | Electrons (−) |
| **p-type** | 3 valence e⁻ (Boron) | Creates holes | Holes (+) |

- **p-n junctions** = basic building blocks of transistors, diodes, ICs

---

## 📌 Insulators
- Very low conductivity; tightly bound electrons; chemically stable
- Prevent short circuits; separate conducting regions in ICs
- SiO₂ = critical barrier in ICs

---

## 🧠 Quick Revision
- Reactivity series: K>Na>Ca>Mg>Al>Zn>Fe>Cu>Ag>Au
- Exothermic = releases energy; Endothermic = absorbs
- Corrosion prevented by: galvanization, alloying, coatings
- n-type = extra e⁻ (P); p-type = holes (B)
- p-n junction → transistors → modern computing`,
  },
  {
    title: 'Materials for Information Storage & Processing',
    slug: 'materials-information-storage-processing',
    order: 5,
    content: `# 📘 Materials Behind Information Storage & Processing

## 📌 Storage Technologies

### Magnetic Storage (HDD)
- Data via **magnetic orientation** of tiny regions (Fe, Co, Pt alloys)
- Binary: magnetic direction = 0 or 1
- Limitation: mechanical movement → speed limited

### Solid-State Storage (SSD)
- **No moving parts** → faster, quieter, energy-efficient
- Silicon-based; charge trapped in transistors
- Materials: Si, Polysilicon, Hafnium/Tantalum oxides

### Optical Storage (CD/DVD)
- Laser reads/writes on polycarbonate disc + reflective metal (Al, Ag, Au)
- Data = microscopic pits and lands

### DNA Storage (Emerging)
- 4 bases (A, T, C, G) encode data; extreme density; stable for millennia
- Limitations: high cost, slow read/write

---

## 📌 Processing Materials

### 1. Silicon & Transistors
- Transistor = fundamental processing unit (ON-OFF switch)
- Si ideal: conductor+insulator, dopable, forms SiO₂

### 2. Beyond Silicon
- **Graphene**: single carbon layer → ultra-high conductivity
- **Carbon nanotubes**: cylindrical graphene → strength + speed
- Benefits: faster transport, lower power, smaller dimensions

### 3. Superconductors
- Zero electrical resistance (Niobium, YBCO, MgB₂)
- Applications: quantum computing, high-speed processing
- Limitation: extremely low temperatures

---

## 📌 Emerging Trends

| Trend | Key Feature |
|-------|-------------|
| **Neuromorphic Computing** | Memristors that remember past states |
| **3D Integrated Circuits** | Vertically stacked → reduced signal distance |
| **Spintronics** | Electron **spin** instead of charge → faster memory |
| **Sustainable Computing** | Biodegradable, recyclable semiconductors |

---

## 🧠 Quick Revision
- HDD: magnetic alloys | SSD: Si + polysilicon + oxides
- Optical: polycarbonate + metals | DNA: A,T,C,G (future)
- Beyond Si: Graphene (ultra-fast), CNTs (low power), Superconductors (zero R)
- Future: Neuromorphic, Spintronics, 3D ICs, Sustainable`,
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
          description: 'Organic, Inorganic & Physical Chemistry — Reactions, bonding, and molecular structures',
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
      pdfUrl: '/uploads/chemistry-module1.pdf',
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
