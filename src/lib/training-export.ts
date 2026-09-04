import { createPlanPdfBlob } from './pdf-export';
import type { TrainingPlan } from './types';
import { exerciseWeightKey, seriesCount } from './week-tracker';

export function createTrainingPdfBlob(training: TrainingPlan, weights: Record<string, string[]>, title: string): Blob {
  const days = training.days.flatMap((day, trainingDayIndex) => day.days.map((dayNumber) => ({
    day: dayNumber,
    diet: day.title,
    meals: day.activeRest
      ? [{ type: 'DESCANSO ACTIVO', option: day.details || 'Actividad suave', ingredients: [] }]
      : day.exercises.map((exercise, exerciseIndex) => {
          const recorded = weights[exerciseWeightKey(dayNumber - 1, exerciseIndex)] ?? [];
          const weightLines = Array.from({ length: seriesCount(exercise.series) }, (_, seriesIndex) =>
            `Serie ${seriesIndex + 1}: ${recorded[seriesIndex]?.trim() ? `${recorded[seriesIndex]} kg` : 'sin registrar'}`,
          );
          return {
            type: exercise.exercise,
            option: `${exercise.series || '-'} series · ${exercise.repetitions || '-'} repeticiones`,
            ingredients: [...(exercise.details ? [exercise.details] : []), ...weightLines],
          };
        }),
  })));
  return createPlanPdfBlob({ generated_at: new Date().toISOString(), days }, title);
}

export function downloadTrainingPdf(training: TrainingPlan, weights: Record<string, string[]>, planName: string, weekNumber: number): void {
  const blob = createTrainingPdfBlob(training, weights, `${planName} · Entrenamiento semana ${weekNumber}`);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${planName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-entrenamiento-semana-${weekNumber}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
