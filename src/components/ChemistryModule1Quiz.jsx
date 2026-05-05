import React, { useState } from 'react';
import { chemistryQuestions } from '@/lib/chemistryData';

import InteractiveQuiz from './InteractiveQuiz';

export default function ChemistryModule1Quiz() {
  return <InteractiveQuiz title="Module 1: Basic Chemistry" questions={chemistryQuestions} />;
}
