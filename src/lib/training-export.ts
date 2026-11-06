import { createPlanPdfBlob } from './pdf-export';
import { inferExerciseType, memberTargets, progressKey } from './training-model';
import type { TrainingPlan, WeekTracker } from './types';
import { downloadBlob, fileSlug } from './utils';
import { repetitionTargets, seriesCount } from './week-tracker';

export function createTrainingPdfBlob(training: TrainingPlan, tracker: WeekTracker, title: string): Blob {
  const days = training.days.map((day, dayIndex) => {
    const meals = day.exercises.flatMap((exercise, exerciseIndex) => {
      const names = exercise.supersetExercises?.length ? exercise.supersetExercises : [exercise.exercise];
      return names.map((name, memberIndex) => {
        const key = progressKey(day, exercise, names.length > 1 ? memberIndex : undefined);
        const count = seriesCount(exercise.series);
        const targets = names.length > 1 ? memberTargets(exercise.repetitions, count, memberIndex, names.length) : repetitionTargets(exercise.repetitions, count);
        const weights = tracker.trainingWeights[key] ?? [];
        const repetitions = tracker.trainingRepetitions?.[key] ?? [];
        const cardio = inferExerciseType(exercise) === 'cardio';
        return {
          type: names.length > 1 ? `SUPERSERIE ${exerciseIndex + 1}.${memberIndex + 1}` : `EJERCICIO ${exerciseIndex + 1}`,
          option: name,
          ingredients: cardio
            ? [`Duración objetivo: ${exercise.duration || exercise.repetitions || 'sin indicar'}`, ...(exercise.details ? [exercise.details] : []), ...((tracker.exerciseNotes?.[key] || exercise.notes) ? [`Notas: ${tracker.exerciseNotes?.[key] || exercise.notes}`] : [])]
            : [
                `Series: ${count}`,
                ...(exercise.type === 'warmup' ? ['Tipo: calentamiento / movilidad'] : []),
                ...(exercise.details ? [exercise.details] : []),
                ...Array.from({ length: count }, (_, seriesIndex) => {
                  const weight = weights[seriesIndex]?.trim() ? `${weights[seriesIndex]} kg` : 'peso sin registrar';
                  const completed = repetitions[seriesIndex]?.trim();
                  return completed
                    ? `Serie ${seriesIndex + 1} | Peso: ${weight} | Reps hechas: ${completed} (objetivo: ${targets[seriesIndex]})`
                    : `Serie ${seriesIndex + 1} | Peso: ${weight} | Objetivo: ${targets[seriesIndex]} repeticiones`;
                }),
                ...((tracker.exerciseNotes?.[key] || exercise.notes) ? [`Notas: ${tracker.exerciseNotes?.[key] || exercise.notes}`] : []),
              ],
        };
      });
    });
    const cardio = tracker.cardioByDay?.[`${tracker.weekNumber}:${dayIndex}`];
    if (cardio && Object.values(cardio).some(Boolean)) meals.push({
      type: 'CARDIO', option: cardio.activity || 'Cardio', ingredients: [
        cardio.duration ? `Duración: ${cardio.duration} min` : '', cardio.distance ? `Distancia: ${cardio.distance}` : '',
        cardio.intensity ? `Intensidad / ritmo: ${cardio.intensity}` : '', cardio.calories ? `Calorías: ${cardio.calories}` : '', cardio.notes ? `Notas: ${cardio.notes}` : '',
      ].filter(Boolean),
    });
    if (day.activeRest && meals.length === 0) meals.push({ type: 'ACTIVIDAD', option: 'Descanso', ingredients: [day.details || 'Día de descanso'] });
    const steps = tracker.stepsByDay?.[`${tracker.weekNumber}:${dayIndex}`];
    if (steps) meals.push({ type: 'ACTIVIDAD DIARIA', option: 'Pasos', ingredients: [`Pasos del día: ${steps}`] });
    return { day: dayIndex + 1, diet: day.title, meals };
  });
  return createPlanPdfBlob({ generated_at: new Date().toISOString(), days }, title);
}

export function downloadTrainingPdf(training: TrainingPlan, tracker: WeekTracker, planName: string): void {
  const blob = createTrainingPdfBlob(training, tracker, `${planName} · Entrenamiento semana ${tracker.weekNumber}`);
  downloadBlob(blob, `${fileSlug(planName)}-entrenamiento-semana-${tracker.weekNumber}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
