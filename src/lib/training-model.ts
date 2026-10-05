import type { ExerciseRow, ExerciseType, TrainingDay, TrainingDayType, TrainingPlan, WeekTracker } from './types';

const DAY_COUNT = 7;

function slug(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}

export function inferDayType(day: TrainingDay): TrainingDayType {
  const text = `${day.title} ${day.details}`.toLowerCase();
  if (day.activeRest || /descanso/.test(text)) return 'rest';
  if (/cardio|cinta|correr|caminar|bici|el[ií]ptica/.test(text)) return 'cardio';
  if (/pierna|gl[uú]teo|cu[aá]driceps|femoral/.test(text)) return 'leg';
  if (/torso|pecho|espalda|hombro|brazo/.test(text)) return 'upper';
  return 'custom';
}

export function inferExerciseType(exercise: ExerciseRow): ExerciseType {
  if (exercise.type) return exercise.type;
  const text = `${exercise.exercise} ${exercise.repetitions} ${exercise.details}`.toLowerCase();
  if (/cardio|cinta|correr|caminar|bici|el[ií]ptica|minuto|km\b/.test(text)) return 'cardio';
  if (/calentamiento|movilidad|activaci[oó]n/.test(text)) return 'warmup';
  return 'strength';
}

function normalizeExercise(exercise: ExerciseRow, dayId: string, index: number): ExerciseRow {
  return {
    ...exercise,
    id: exercise.id ?? `${dayId}-exercise-${index + 1}-${slug(exercise.exercise)}`,
    type: inferExerciseType(exercise),
    notes: exercise.notes ?? '',
  };
}

function normalizeDay(day: TrainingDay, dayNumber: number, fallbackIndex: number): TrainingDay {
  const id = day.id ?? `day-${dayNumber}-${fallbackIndex + 1}-${slug(day.title)}`;
  return {
    ...structuredClone(day),
    id,
    days: [dayNumber],
    type: day.type ?? inferDayType(day),
    exercises: day.exercises.map((exercise, index) => normalizeExercise(exercise, id, index)),
  };
}

function expandDays(days: TrainingDay[]): TrainingDay[] {
  return Array.from({ length: DAY_COUNT }, (_, index) => {
    const dayNumber = index + 1;
    const sourceIndex = days.findIndex(day => day.days.includes(dayNumber));
    const source = sourceIndex >= 0 ? days[sourceIndex] : undefined;
    return source
      ? normalizeDay(source, dayNumber, sourceIndex)
      : normalizeDay({ days: [dayNumber], title: 'Descanso', activeRest: true, details: '', exercises: [], type: 'rest' }, dayNumber, index);
  });
}

export function normalizeTrainingPlan(training: TrainingPlan): TrainingPlan {
  const templateSource = training.templateDays?.length ? training.templateDays : training.days;
  return {
    ...training,
    templateDays: expandDays(templateSource),
    days: expandDays(training.days),
  };
}

export function cloneTrainingDay(day: TrainingDay, dayNumber: number): TrainingDay {
  const clone = structuredClone(day);
  clone.id = crypto.randomUUID();
  clone.days = [dayNumber];
  clone.exercises = clone.exercises.map(exercise => ({ ...exercise, id: crypto.randomUUID() }));
  return clone;
}

export function createTrainingDay(type: TrainingDayType, dayNumber: number): TrainingDay {
  const labels: Record<TrainingDayType, string> = {
    leg: 'Pierna', upper: 'Torso', cardio: 'Cardio', rest: 'Descanso', custom: 'Entrenamiento personalizado',
  };
  return {
    id: crypto.randomUUID(), days: [dayNumber], title: labels[type], type,
    activeRest: type === 'rest', details: '', exercises: [],
  };
}

export function progressKey(day: TrainingDay, exercise: ExerciseRow, memberIndex?: number): string {
  const base = `${day.id ?? day.days[0]}:${exercise.id ?? exercise.exercise}`;
  return memberIndex === undefined ? base : `${base}:member:${memberIndex}`;
}

export function migrateLegacyProgress(training: TrainingPlan, tracker: WeekTracker): void {
  tracker.trainingRepetitions ??= {};
  for (const [dayIndex, day] of training.days.entries()) {
    for (const [exerciseIndex, exercise] of day.exercises.entries()) {
      const legacy = `${dayIndex}:${exerciseIndex}`;
      const key = progressKey(day, exercise);
      if (tracker.trainingWeights[legacy] && !tracker.trainingWeights[key]) tracker.trainingWeights[key] = [...tracker.trainingWeights[legacy]];
      if (tracker.trainingRepetitions[legacy] && !tracker.trainingRepetitions[key]) tracker.trainingRepetitions[key] = [...tracker.trainingRepetitions[legacy]];
      delete tracker.trainingWeights[legacy];
      delete tracker.trainingRepetitions[legacy];
    }
  }
}

export function memberTargets(value: string, count: number, memberIndex: number, memberCount: number): string[] {
  const lines = value.split(/\n+/).map(line => line.trim()).filter(Boolean);
  if (lines.length === memberCount) {
    const values = lines[memberIndex]?.match(/\d+(?:\s*[-–]\s*\d+)?/g) ?? [];
    if (values.length >= count) return Array.from({ length: count }, (_, index) => values[index] ?? values.at(-1) ?? '—');
    return Array.from({ length: count }, () => lines[memberIndex] || '—');
  }
  const combined = lines.map(line => line.match(/\d+/g) ?? []);
  const fallback = value.trim() || '—';
  return Array.from({ length: count }, (_, index) => combined[memberIndex]?.[index] ?? combined[memberIndex]?.at(-1) ?? fallback);
}
