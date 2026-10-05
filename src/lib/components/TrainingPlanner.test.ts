import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { appState } from '$lib/state.svelte';
import { normalizeTrainingPlan } from '$lib/training-model';
import TrainingPlanner from './TrainingPlanner.svelte';

describe('TrainingPlanner', () => {
  beforeEach(() => {
    appState.activePlanId = null;
    appState.parsedData = { status: 'ok', diets: [], training: normalizeTrainingPlan({
      tips: [], defaultRestSeconds: 60, days: [
        { days: [1], title: 'TORSO', activeRest: false, details: '', exercises: [{ exercise: 'Remo', series: '3', repetitions: '10', details: '' }] },
        { days: [2], title: 'PIERNA', activeRest: false, details: '', exercises: [{ exercise: 'Sentadilla', series: '3', repetitions: '10', details: '' }] },
        { days: [3], title: 'DESCANSO', activeRest: true, details: '', exercises: [] },
        { days: [4], title: 'EMPUJE', activeRest: false, details: '', exercises: [{ exercise: 'Press militar', series: '3', repetitions: '10', details: '' }] },
        { days: [5], title: 'TIRÓN', activeRest: false, details: '', exercises: [{ exercise: 'Jalón al pecho', series: '3', repetitions: '10', details: '' }] },
      ],
    }) };
  });

  afterEach(cleanup);

  it('uses the exact PDF routine titles as visual choices', async () => {
    render(TrainingPlanner);
    expect(screen.queryByRole('combobox')).toBeNull();
    await fireEvent.click(screen.getAllByRole('button', { name: 'Cambiar' })[0]);
    expect(screen.getByRole('dialog', { name: 'Cambiar entrenamiento' })).toBeTruthy();
    expect(screen.getByText('Rutinas de tu PDF')).toBeTruthy();
    expect(screen.getByText('Crear un día nuevo')).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: /EMPUJE/ }));

    expect(appState.parsedData?.training?.days[0].title).toBe('EMPUJE');
    expect(appState.parsedData?.training?.days[0].exercises[0].exercise).toBe('Press militar');
  });

  it('moves workouts between adjacent days without overwriting either routine', async () => {
    render(TrainingPlanner);

    await fireEvent.click(screen.getByRole('button', { name: 'Mover entrenamiento de Lunes al día siguiente' }));

    expect(appState.parsedData?.training?.days[0].title).toBe('PIERNA');
    expect(appState.parsedData?.training?.days[1].title).toBe('TORSO');
    expect(appState.parsedData?.training?.days[1].exercises[0].exercise).toBe('Remo');
  });
});
