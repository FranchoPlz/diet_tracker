import { describe, expect, it } from 'vitest';

import type { TrainingPlan } from './types';
import { createTrainingPdfBlob } from './training-export';

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

    const blob = createTrainingPdfBlob(training, {}, 'Entrenamiento');
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob, 'windows-1252');
    });

    expect(content).toContain('EJERCICIO 1');
    expect(content).toContain('Press de banca plano con barra recta');
    expect(content).not.toContain('Sin ingredientes');
  });
});
