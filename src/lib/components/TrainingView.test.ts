import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import { appState } from '$lib/state.svelte';
import TrainingView from './TrainingView.svelte';

describe('TrainingView', () => {
  afterEach(() => {
    cleanup();
    appState.parsedData = null;
    appState.exercisePreviewUrls = {};
  });

  it('renders only the assigned lazy preview image', () => {
    appState.parsedData = { status: 'ok', diets: [], training: { tips: [], defaultRestSeconds: null, days: [
      { days: [1], title: 'TORSO', activeRest: false, details: '', exercises: [{ exercise: 'Remo', series: '3', repetitions: '12', details: '' }] },
      { days: [2], title: 'DESCANSO ACTIVO', activeRest: true, details: '', exercises: [] },
    ] } };
    appState.exercisePreviewUrls = { '0:0': 'blob:remo', '1:0': 'blob:never-rendered' };

    render(TrainingView);

    const image = screen.getByRole('img', { name: 'Vista previa del ejercicio Remo del Día 1' });
    expect(image.getAttribute('src')).toBe('blob:remo');
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(screen.queryByRole('img', { name: /Descanso/ })).toBeNull();
  });

  it('keeps routine days collapsed until opened', () => {
    appState.parsedData = { status: 'ok', diets: [], training: { tips: [], defaultRestSeconds: null, days: [
      { days: [1], title: 'TORSO', activeRest: false, details: '', exercises: [] },
    ] } };

    render(TrainingView);

    expect(document.querySelector('details')).toBeTruthy();
    expect(document.querySelector('details')?.open).toBe(false);
  });

  it('shows guidance, exercises, supersets, and active-rest instructions', async () => {
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

    const disclosures = document.querySelectorAll('summary');
    await fireEvent.click(disclosures[0]);
    await fireEvent.click(disclosures[1]);
    await fireEvent.click(disclosures[2]);

    expect(screen.getByText('60s')).toBeTruthy();
    expect(screen.getByText('Prioriza la técnica antes que el peso.')).toBeTruthy();
    const torso = screen.getByLabelText('Día 1: TORSO').parentElement!;
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
