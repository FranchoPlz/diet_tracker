import { describe, expect, it } from 'vitest';

import type { TrainingPlan } from './types';
import { createTrainingPdfBlob } from './training-export';

function readPdf(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob, 'windows-1252');
  });
}

describe('training PDF export', () => {
  it('uses a short row label, keeps the exercise title in the wide column, and omits empty ingredient text', async () => {
    const training: TrainingPlan = {
      tips: [],
      defaultRestSeconds: 60,
      days: [{
        days: [1],
        title: 'TORSO',
        activeRest: false,
        details: '',
        exercises: [{ exercise: 'Press de banca plano con barra recta', series: '3', repetitions: '10', details: '' }],
      }],
    };

    const blob = createTrainingPdfBlob(training, { '0:0': ['40'] }, 'Entrenamiento', { '0:0': ['9'] });
    const content = await readPdf(blob);

    expect(content).toContain('EJERCICIO 1');
    expect(content).toContain('Press de banca plano con barra recta');
    expect(content).toContain('Series: 3');
    expect(content).toContain(String.raw`Serie 1 | Peso: 40 kg | Reps hechas: 9 \(objetivo: 10\)`);
    expect(content).toContain('Serie 2 | Peso: peso sin registrar | Objetivo: 10 repeticiones');
    expect(content).not.toContain('Sin ingredientes');
  });

  it('replaces the compact ordinal repetition list with one readable row per series', async () => {
    const training: TrainingPlan = {
      tips: [],
      defaultRestSeconds: 60,
      days: [{
        days: [1],
        title: 'TORSO',
        activeRest: false,
        details: '',
        exercises: [{ exercise: 'Press inclinado', series: '4', repetitions: '1º - 12\n2º - 10\n3º - 8\n4º - 8', details: '' }],
      }],
    };

    const content = await readPdf(createTrainingPdfBlob(training, {}, 'Entrenamiento'));

    expect(content).toContain('Series: 4');
    expect(content).toContain('Serie 1 | Peso: peso sin registrar | Objetivo: 12 repeticiones');
    expect(content).toContain('Serie 4 | Peso: peso sin registrar | Objetivo: 8 repeticiones');
    expect(content).not.toContain('1º - 12');
  });
});
