import React, { useState } from 'react';

const questions = [
  {
    question: "Which factor MOST strongly controls electrical behavior in materials?",
    options: ["Density", "Atomic mass", "Electronic structure", "Color"],
    correctAnswer: "Electronic structure"
  },
  {
    question: "Why can two materials with similar composition behave differently?",
    options: ["Same atoms", "Same mass", "Different atomic arrangement", "Same bonding"],
    correctAnswer: "Different atomic arrangement"
  },
  {
    question: "Which statement best describes structure–property relationship?",
    options: ["Structure has no effect", "Properties depend on external conditions only", "Atomic structure defines material properties", "Only bonding matters"],
    correctAnswer: "Atomic structure defines material properties"
  },
  {
    question: "Why do metals conduct electricity efficiently?",
    options: ["Strong ionic bonds", "Fixed electrons", "Delocalized electrons", "No electrons"],
    correctAnswer: "Delocalized electrons"
  },
  {
    question: "Which bonding type gives controlled conductivity?",
    options: ["Metallic", "Ionic", "Covalent", "Hydrogen"],
    correctAnswer: "Covalent"
  },
  {
    question: "Why are ionic solids poor conductors?",
    options: ["No electrons", "Electrons tightly bound", "High density", "Large atoms"],
    correctAnswer: "Electrons tightly bound"
  },
  {
    question: "In semiconductors, conductivity increases due to:",
    options: ["Decrease in temperature", "Increase in bonding", "Electron excitation", "Atomic weight"],
    correctAnswer: "Electron excitation"
  },
  {
    question: "A material with overlapping valence and conduction bands is:",
    options: ["Insulator", "Semiconductor", "Conductor", "Alloy"],
    correctAnswer: "Conductor"
  },
  {
    question: "Which condition defines an insulator?",
    options: ["No valence electrons", "Large band gap", "Overlapping bands", "Free electrons"],
    correctAnswer: "Large band gap"
  },
  {
    question: "Why are semiconductors ideal for electronics?",
    options: ["Zero resistance", "Large band gap", "Controllable band gap", "No electrons"],
    correctAnswer: "Controllable band gap"
  },
  {
    question: "Which change reduces band gap effectively?",
    options: ["Cooling", "Doping", "Increasing mass", "Pressure only"],
    correctAnswer: "Doping"
  },
  {
    question: "n-type semiconductors increase conductivity due to:",
    options: ["Holes", "Protons", "Free electrons", "Neutrons"],
    correctAnswer: "Free electrons"
  },
  {
    question: "p-type semiconductors conduct due to:",
    options: ["Electrons", "Holes", "Neutrons", "Protons"],
    correctAnswer: "Holes"
  },
  {
    question: "Why is doping critical in IC fabrication?",
    options: ["Reduces size", "Controls charge carriers", "Changes color", "Increases weight"],
    correctAnswer: "Controls charge carriers"
  },
  {
    question: "Excessive doping leads to:",
    options: ["Perfect conductivity", "Loss of semiconductor behavior", "Better insulation", "No effect"],
    correctAnswer: "Loss of semiconductor behavior"
  },
  {
    question: "Which property directly influences bonding behavior?",
    options: ["Density", "Electron configuration", "Temperature", "Volume"],
    correctAnswer: "Electron configuration"
  },
  {
    question: "Metals have low ionization energy, meaning:",
    options: ["Electrons tightly bound", "Easily lose electrons", "Gain electrons", "No electrons"],
    correctAnswer: "Easily lose electrons"
  },
  {
    question: "High electronegativity leads to:",
    options: ["Electron loss", "Weak bonds", "Strong attraction for electrons", "No bonding"],
    correctAnswer: "Strong attraction for electrons"
  },
  {
    question: "Which process occurs at the anode in a battery?",
    options: ["Reduction", "Oxidation", "Neutralization", "Heating"],
    correctAnswer: "Oxidation"
  },
  {
    question: "In rusting, iron acts as:",
    options: ["Oxidizing agent", "Reducing agent", "Catalyst", "Neutral element"],
    correctAnswer: "Reducing agent"
  },
  {
    question: "Which reaction is spontaneous?",
    options: ["Endothermic", "Exothermic", "Neutral", "None"],
    correctAnswer: "Exothermic"
  },
  {
    question: "Why are ferromagnetic materials used in HDDs?",
    options: ["Low density", "High conductivity", "Stable magnetic domains", "High melting point"],
    correctAnswer: "Stable magnetic domains"
  },
  {
    question: "SSDs are faster because:",
    options: ["Use magnetism", "No moving parts", "Large size", "High heat"],
    correctAnswer: "No moving parts"
  },
  {
    question: "Optical storage depends on:",
    options: ["Magnetism", "Electrical signals", "Light reflection", "Heat"],
    correctAnswer: "Light reflection"
  },
  {
    question: "Why do nanomaterials show unique properties?",
    options: ["Large volume", "Quantum effects", "Low density", "No electrons"],
    correctAnswer: "Quantum effects"
  },
  {
    question: "High surface-to-volume ratio leads to:",
    options: ["Low reactivity", "High reactivity", "No change", "Stability only"],
    correctAnswer: "High reactivity"
  },
  {
    question: "Corrosion is an example of:",
    options: ["Reduction", "Oxidation", "Neutralization", "Polymerization"],
    correctAnswer: "Oxidation"
  },
  {
    question: "Galvanization protects iron because:",
    options: ["Zinc oxidizes first", "Iron becomes stable", "Paint is added", "No reaction occurs"],
    correctAnswer: "Zinc oxidizes first"
  },
  {
    question: "Noble metals resist corrosion due to:",
    options: ["High reactivity", "Stability", "Low density", "Large size"],
    correctAnswer: "Stability"
  },
  {
    question: "Endothermic reactions require:",
    options: ["Heat release", "Heat absorption", "No energy", "Light only"],
    correctAnswer: "Heat absorption"
  },
  {
    question: "Which process lowers surrounding temperature?",
    options: ["Exothermic", "Endothermic", "Neutral", "Oxidation"],
    correctAnswer: "Endothermic"
  },
  {
    question: "Why is silicon preferred over germanium?",
    options: ["Higher density", "Better thermal stability", "Lower cost only", "No conductivity"],
    correctAnswer: "Better thermal stability"
  },
  {
    question: "Graphene is promising due to:",
    options: ["Weak bonding", "High electron mobility", "Low strength", "High weight"],
    correctAnswer: "High electron mobility"
  },
  {
    question: "Superconductors have zero resistance at:",
    options: ["High temperature", "Room temperature", "Very low temperature", "Any temperature"],
    correctAnswer: "Very low temperature"
  },
  {
    question: "Why can semiconductors act as switches?",
    options: ["Free electrons", "Controlled conductivity", "No band gap", "High density"],
    correctAnswer: "Controlled conductivity"
  },
  {
    question: "Which property is MOST important for microchips?",
    options: ["Color", "Conductivity control", "Weight", "Size only"],
    correctAnswer: "Conductivity control"
  },
  {
    question: "Why are insulators essential in circuits?",
    options: ["Conduct electricity", "Prevent current leakage", "Store data", "Increase speed"],
    correctAnswer: "Prevent current leakage"
  },
  {
    question: "What determines electron mobility?",
    options: ["Density", "Band structure", "Size", "Color"],
    correctAnswer: "Band structure"
  },
  {
    question: "Why are materials engineered at nanoscale?",
    options: ["Reduce cost only", "Improve performance", "Increase weight", "Reduce conductivity"],
    correctAnswer: "Improve performance"
  },
  {
    question: "Future computing depends on:",
    options: ["Software only", "Materials innovation", "Hardware size only", "Internet speed"],
    correctAnswer: "Materials innovation"
  },
  {
    question: "Which property primarily determines whether a material behaves as conductor, semiconductor, or insulator?",
    options: ["Density", "Band gap", "Color", "Atomic mass"],
    correctAnswer: "Band gap"
  },
  {
    question: "A material with a very small band gap will behave as:",
    options: ["Insulator", "Semiconductor", "Conductor", "Superconductor"],
    correctAnswer: "Semiconductor"
  },
  {
    question: "If electrons require high energy to move to conduction band, the material is:",
    options: ["Conductor", "Semiconductor", "Insulator", "Alloy"],
    correctAnswer: "Insulator"
  },
  {
    question: "Overlapping energy bands result in:",
    options: ["Poor conductivity", "Controlled conductivity", "High conductivity", "No conductivity"],
    correctAnswer: "High conductivity"
  },
  {
    question: "Which factor directly affects band gap size?",
    options: ["Atomic structure", "Color", "Weight", "Volume"],
    correctAnswer: "Atomic structure"
  },
  {
    question: "In metallic bonding, electrons are:",
    options: ["Localized", "Shared between two atoms", "Delocalized", "Absent"],
    correctAnswer: "Delocalized"
  },
  {
    question: "Which bonding leads to insulating behavior?",
    options: ["Metallic", "Covalent", "Ionic", "Hydrogen"],
    correctAnswer: "Ionic"
  },
  {
    question: "Covalent bonding results in:",
    options: ["Free electrons", "Controlled electron movement", "No electrons", "High resistance always"],
    correctAnswer: "Controlled electron movement"
  },
  {
    question: "Which bonding type allows highest electrical conductivity?",
    options: ["Ionic", "Covalent", "Metallic", "Hydrogen"],
    correctAnswer: "Metallic"
  },
  {
    question: "Directional bonding is characteristic of:",
    options: ["Metallic", "Ionic", "Covalent", "Magnetic"],
    correctAnswer: "Covalent"
  },
  {
    question: "Adding pentavalent impurity to silicon produces:",
    options: ["p-type", "n-type", "Insulator", "Metal"],
    correctAnswer: "n-type"
  },
  {
    question: "Trivalent doping creates:",
    options: ["Extra electrons", "Holes", "Neutrons", "Protons"],
    correctAnswer: "Holes"
  },
  {
    question: "Doping primarily changes:",
    options: ["Atomic size", "Band structure", "Color", "Mass"],
    correctAnswer: "Band structure"
  },
  {
    question: "Intrinsic semiconductor means:",
    options: ["Doped", "Pure", "Alloy", "Metallic"],
    correctAnswer: "Pure"
  },
  {
    question: "Conductivity in semiconductors depends on:",
    options: ["Temperature", "Impurities", "Both A & B", "None"],
    correctAnswer: "Both A & B"
  },
  {
    question: "Metals tend to:",
    options: ["Gain electrons", "Lose electrons", "Share electrons only", "Remain neutral"],
    correctAnswer: "Lose electrons"
  },
  {
    question: "Non-metals generally:",
    options: ["Lose electrons", "Gain electrons", "Conduct electricity", "Have low electronegativity"],
    correctAnswer: "Gain electrons"
  },
  {
    question: "Ionization energy increases:",
    options: ["Down group", "Across period", "Randomly", "With density"],
    correctAnswer: "Across period"
  },
  {
    question: "Larger atomic size leads to:",
    options: ["High ionization energy", "Low ionization energy", "No change", "High density"],
    correctAnswer: "Low ionization energy"
  },
  {
    question: "Reactivity of metals increases with:",
    options: ["High ionization energy", "Low ionization energy", "High electronegativity", "Small size"],
    correctAnswer: "Low ionization energy"
  },
  {
    question: "In a redox reaction, oxidation and reduction occur:",
    options: ["Separately", "Together", "Independently", "Rarely"],
    correctAnswer: "Together"
  },
  {
    question: "Oxidizing agent:",
    options: ["Loses electrons", "Gains electrons", "Neutral", "No role"],
    correctAnswer: "Gains electrons"
  },
  {
    question: "Reducing agent:",
    options: ["Gains electrons", "Loses electrons", "Neutral", "None"],
    correctAnswer: "Loses electrons"
  },
  {
    question: "Rusting is accelerated by:",
    options: ["Dry air", "Moisture", "Vacuum", "Cold"],
    correctAnswer: "Moisture"
  },
  {
    question: "Which is a slow redox reaction?",
    options: ["Combustion", "Rusting", "Explosion", "Burning Mg"],
    correctAnswer: "Rusting"
  },
  {
    question: "Magnetic storage works by:",
    options: ["Charge storage", "Spin orientation", "Heat", "Light"],
    correctAnswer: "Spin orientation"
  },
  {
    question: "SSD stores data using:",
    options: ["Magnetic domains", "Electric charge", "Light", "Heat"],
    correctAnswer: "Electric charge"
  },
  {
    question: "Optical storage uses:",
    options: ["Reflection differences", "Charge storage", "Heat", "Pressure"],
    correctAnswer: "Reflection differences"
  },
  {
    question: "Which is fastest storage?",
    options: ["HDD", "SSD", "Optical", "Tape"],
    correctAnswer: "SSD"
  },
  {
    question: "Magnetic materials store data as:",
    options: ["Voltage", "Current", "Magnetic orientation", "Heat"],
    correctAnswer: "Magnetic orientation"
  },
  {
    question: "Unique nanomaterial property arises due to:",
    options: ["Size reduction", "Quantum effects", "Surface effects", "All"],
    correctAnswer: "All"
  },
  {
    question: "Graphene has:",
    options: ["Low conductivity", "High conductivity", "No electrons", "Insulating behavior"],
    correctAnswer: "High conductivity"
  },
  {
    question: "Nanomaterials improve:",
    options: ["Speed", "Efficiency", "Size reduction", "All"],
    correctAnswer: "All"
  },
  {
    question: "High surface area leads to:",
    options: ["Low reactivity", "High reactivity", "Stability", "No change"],
    correctAnswer: "High reactivity"
  },
  {
    question: "Carbon nanotubes are:",
    options: ["Weak", "Strong", "Liquid", "Insulators"],
    correctAnswer: "Strong"
  },
  {
    question: "Exothermic reactions:",
    options: ["Absorb heat", "Release heat", "No energy", "Store heat"],
    correctAnswer: "Release heat"
  },
  {
    question: "Endothermic reactions:",
    options: ["Release heat", "Absorb heat", "Neutral", "No reaction"],
    correctAnswer: "Absorb heat"
  },
  {
    question: "Which requires continuous energy supply?",
    options: ["Exothermic", "Endothermic", "Redox", "Neutral"],
    correctAnswer: "Endothermic"
  },
  {
    question: "Combustion is:",
    options: ["Endothermic", "Exothermic", "Neutral", "Slow"],
    correctAnswer: "Exothermic"
  },
  {
    question: "Energy change affects:",
    options: ["Reaction speed", "Material behavior", "Stability", "All"],
    correctAnswer: "All"
  },
  {
    question: "Corrosion is:",
    options: ["Physical change", "Chemical degradation", "Mechanical change", "Thermal change"],
    correctAnswer: "Chemical degradation"
  },
  {
    question: "Which prevents corrosion?",
    options: ["Painting", "Galvanization", "Alloying", "All"],
    correctAnswer: "All"
  },
  {
    question: "Zinc protects iron by:",
    options: ["Acting as insulator", "Sacrificial oxidation", "Cooling", "Strengthening"],
    correctAnswer: "Sacrificial oxidation"
  },
  {
    question: "Stainless steel resists corrosion due to:",
    options: ["Iron", "Chromium oxide layer", "Nickel only", "Carbon"],
    correctAnswer: "Chromium oxide layer"
  },
  {
    question: "Corrosion leads to:",
    options: ["Strength increase", "Material failure", "Cooling", "Weight gain"],
    correctAnswer: "Material failure"
  },
  {
    question: "Silicon is ideal because:",
    options: ["Moderate band gap", "Abundance", "Oxide layer formation", "All"],
    correctAnswer: "All"
  },
  {
    question: "Superconductors are used in:",
    options: ["Slow devices", "High-speed computing", "Insulators", "Storage only"],
    correctAnswer: "High-speed computing"
  },
  {
    question: "Limitation of superconductors:",
    options: ["Cost", "Temperature", "Size", "Weight"],
    correctAnswer: "Temperature"
  },
  {
    question: "Graphene limitation:",
    options: ["Weakness", "No band gap", "Heavy", "Expensive only"],
    correctAnswer: "No band gap"
  },
  {
    question: "Future materials focus on:",
    options: ["Size reduction", "Efficiency", "Sustainability", "All"],
    correctAnswer: "All"
  },
  {
    question: "Why are insulators used between conductors?",
    options: ["Increase current", "Prevent leakage", "Store data", "Reduce size"],
    correctAnswer: "Prevent leakage"
  },
  {
    question: "Why do metals have high conductivity?",
    options: ["High density", "Free electrons", "Strong bonds", "Large size"],
    correctAnswer: "Free electrons"
  },
  {
    question: "Semiconductor conductivity increases with:",
    options: ["Temperature", "Doping", "Both", "None"],
    correctAnswer: "Both"
  },
  {
    question: "Which material is best for interconnects?",
    options: ["Silicon", "Copper", "Glass", "Polymer"],
    correctAnswer: "Copper"
  },
  {
    question: "Which material is best for insulation?",
    options: ["Copper", "Glass", "Silicon", "Aluminum"],
    correctAnswer: "Glass"
  },
  {
    question: "Why is band gap crucial?",
    options: ["Determines density", "Controls conductivity", "Controls weight", "Controls size"],
    correctAnswer: "Controls conductivity"
  },
  {
    question: "Why are nanomaterials important?",
    options: ["Small size", "Enhanced properties", "High efficiency", "All"],
    correctAnswer: "All"
  },
  {
    question: "Why do semiconductors dominate electronics?",
    options: ["Cheap", "Controlled conductivity", "Strong", "Light"],
    correctAnswer: "Controlled conductivity"
  },
  {
    question: "Which property is most critical in processors?",
    options: ["Thermal conductivity", "Electrical control", "Density", "Color"],
    correctAnswer: "Electrical control"
  },
  {
    question: "Future computing depends on:",
    options: ["Hardware", "Software", "Materials", "Internet"],
    correctAnswer: "Materials"
  }
];

import InteractiveQuiz from './InteractiveQuiz';

export default function ChemistryModule1Quiz() {
  return <InteractiveQuiz title="Module 1: Basic Chemistry" questions={questions} />;
}
