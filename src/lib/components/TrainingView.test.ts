import { cleanup, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import { appState } from '$lib/state.svelte';
import TrainingView from './TrainingView.svelte';

describe('TrainingView', () => {
  afterEach(() => {
    cleanup();
    appState.parsedData = null;
  });

  it('shows guidance, exercises, supersets, and active-rest instructions', () => {
    appState.parsedData = {
      status: 'ok',
      diets: [],
      training: {
        tips: ['Prioriza la técnica antes que el peso.'],
        defaultRestSeconds: 60,
        days: [
          {
            days: [1],
            title: 'TORSO',
            activeRest: false,
            details: '',
            exercises: [
              {
                exercise: 'Curl de bíceps + Pres francés',
                series: '4',
                repetitions: '12 - 10 - 8',
                details: 'Sin descanso entre ejercicios.',
                supersetExercises: ['Curl de bíceps', 'Pres francés'],
              },
            ],
          },
          {
            days: [2, 3],
            title: 'DESCANSO ACTIVO',
            activeRest: true,
            details: '45 minutos de caminata a buen ritmo.',
            exercises: [],
          },
        ],
      },
    };

    render(TrainingView);

    expect(screen.getByText('60s')).toBeTruthy();
    expect(screen.getByText('Prioriza la técnica antes que el peso.')).toBeTruthy();
    const torso = screen.getByRole('article', { name: 'Día 1: TORSO' });
    expect(within(torso).getByText('Curl de bíceps + Pres francés')).toBeTruthy();
    expect(screen.getByText('Series')).toBeTruthy();
    expect(screen.getByText('Repeticiones')).toBeTruthy();
    expect(screen.getByText('Superserie')).toBeTruthy();
    expect(screen.getByText('Combina: Curl de bíceps + Pres francés')).toBeTruthy();
    expect(screen.getByText('45 minutos de caminata a buen ritmo.')).toBeTruthy();
  });

  it('asks for a compatible PDF when training data is unavailable', () => {
    appState.parsedData = { status: 'ok', diets: [] };

    render(TrainingView);

    expect(screen.getByText('Este plan no incluye una rutina de entrenamiento.')).toBeTruthy();
    expect(screen.getByText(/Carga un PDF compatible o una versión más reciente/)).toBeTruthy();
  });
});
