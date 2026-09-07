import { createPlanPdfBlob } from './pdf-export';
import type { TrainingPlan } from './types';
import { exerciseWeightKey, repetitionTargets, seriesCount } from './week-tracker';

export function createTrainingPdfBlob(training: TrainingPlan, weights: Record<string, string[]>, title: string, repetitions: Record<string, string[]> = {}): Blob {
  const days = training.days.flatMap((day, trainingDayIndex) => day.days.map((dayNumber) => ({
    day: dayNumber,
    diet: day.title,
    meals: day.activeRest
      ? [{ type: 'ACTIVIDAD', option: 'Descanso activo', ingredients: [day.details || 'Actividad suave'] }]
      : day.exercises.map((exercise, exerciseIndex) => {
          const recorded = weights[exerciseWeightKey(dayNumber - 1, exerciseIndex)] ?? [];
          const actualRepetitions = repetitions[exerciseWeightKey(dayNumber - 1, exerciseIndex)] ?? [];
          const targets = repetitionTargets(exercise.repetitions, seriesCount(exercise.series));
          const weightLines = Array.from({ length: seriesCount(exercise.series) }, (_, seriesIndex) => {
            const weight = recorded[seriesIndex]?.trim() ? `${recorded[seriesIndex]} kg` : 'peso sin registrar';
            const target = targets[seriesIndex] || 'sin registrar';
            const completed = actualRepetitions[seriesIndex]?.trim();
            const reps = completed
              ? `Reps hechas: ${completed} (objetivo: ${target})`
              : `Objetivo: ${target} repeticiones`;
            return `Serie ${seriesIndex + 1} | Peso: ${weight} | ${reps}`;
          });
          return {
            type: `EJERCICIO ${exerciseIndex + 1}`,
            option: exercise.exercise,
            ingredients: [
              `Series: ${seriesCount(exercise.series)}`,
              ...(exercise.details ? [exercise.details] : []),
              ...weightLines,
            ],
          };
        }),
  })));
  return createPlanPdfBlob({ generated_at: new Date().toISOString(), days }, title);
}

export function downloadTrainingPdf(training: TrainingPlan, weights: Record<string, string[]>, planName: string, weekNumber: number, repetitions: Record<string, string[]> = {}): void {
  const blob = createTrainingPdfBlob(training, weights, `${planName} · Entrenamiento semana ${weekNumber}`, repetitions);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const exportedAt = new Date().toISOString().slice(0, 10);
  anchor.download = `${planName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-entrenamiento-semana-${weekNumber}-${exportedAt}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
