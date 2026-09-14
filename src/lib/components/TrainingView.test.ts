import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appState } from '$lib/state.svelte';
import TrainingView from './TrainingView.svelte';

describe('TrainingView', () => {
  beforeEach(() => {
    appState.weekTracker = { startedAt: new Date().toISOString(), activeDayIndex: 0, weekNumber: 1, trainingWeights: {} };
    appState.alwaysShowExerciseIllustrations = false;
    appState.parsedData = { status: 'ok', diets: [], training: { tips: [], defaultRestSeconds: 60, days: [
      { days: [1], title: 'TORSO', activeRest: false, details: '', exercises: [{ exercise: 'Remo', series: '3', repetitions: '1º - 12\n2º - 10\n3º - 8', details: '' }] },
      { days: [2], title: 'DESCANSO ACTIVO', activeRest: true, details: 'Caminar 30 minutos.', exercises: [] },
    ] } };
  });

  afterEach(cleanup);

  it('shows one row per series and records weight and completed repetitions', async () => {
    render(TrainingView);
    expect(screen.getByText('Día 1 · TORSO')).toBeTruthy();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(6);
    expect(screen.getByText('12 obj.')).toBeTruthy();
    expect(screen.getByText('10 obj.')).toBeTruthy();
    expect(screen.getByText('8 obj.')).toBeTruthy();
    await fireEvent.input(screen.getByLabelText('Remo, peso serie 1'), { target: { value: '25' } });
    await fireEvent.input(screen.getByLabelText('Remo, repeticiones serie 1'), { target: { value: '10' } });
    expect(appState.weekTracker.trainingWeights['0:0']).toEqual(['25']);
    expect(appState.weekTracker.trainingRepetitions?.['0:0']).toEqual(['10']);
  });

  it('allows each exercise to be collapsed', async () => {
    render(TrainingView);
    const exercise = screen.getByText('Remo').closest('details');

    expect(exercise?.open).toBe(true);
    await fireEvent.click(exercise!.querySelector('summary')!);
    expect(exercise?.open).toBe(false);
  });

  it('shows and hides an exercise illustration from its help button', async () => {
    render(TrainingView);

    const help = screen.getByRole('button', { name: 'Mostrar cómo hacer Remo' });
    expect(screen.queryByText('No hay una guía visual disponible para Remo.')).toBeNull();
    await fireEvent.click(help);
    expect(screen.getByText('No hay una guía visual disponible para Remo.')).toBeTruthy();
    expect(help.getAttribute('aria-expanded')).toBe('true');
  });

  it('shows matched illustrations automatically when enabled in settings', () => {
    appState.alwaysShowExerciseIllustrations = true;
    appState.parsedData!.training!.days[0].exercises[0].exercise = 'Press de banca plano con barra recta';
    render(TrainingView);

    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Ocultar cómo hacer Press de banca plano con barra recta' })).toBeTruthy();
  });

  it('allows an automatically shown illustration to be hidden for one exercise', async () => {
    appState.alwaysShowExerciseIllustrations = true;
    appState.parsedData!.training!.days[0].exercises[0].exercise = 'Press de banca plano';
    render(TrainingView);

    await fireEvent.click(screen.getByRole('button', { name: 'Ocultar cómo hacer Press de banca plano' }));
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('shows the active-rest instructions for that day', () => {
    appState.weekTracker.activeDayIndex = 1;
    render(TrainingView);
    expect(screen.getByText('Caminar 30 minutos.')).toBeTruthy();
    expect(screen.queryByText('Remo')).toBeNull();
  });

  it('requires two confirmations before clearing weights', async () => {
    appState.weekTracker.trainingWeights = { '0:0': ['25'] };
    appState.weekTracker.trainingRepetitions = { '0:0': ['10'] };
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(true).mockReturnValueOnce(false);
    render(TrainingView);
    await fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(appState.weekTracker.trainingWeights['0:0']).toEqual(['25']);
    expect(appState.weekTracker.trainingRepetitions['0:0']).toEqual(['10']);
  });
});
