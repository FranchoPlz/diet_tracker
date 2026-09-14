import { exercises, type Exercise } from '@bryllim/workout-guide';
import { base } from '$app/paths';

const spanishAliases: Array<[string, string]> = [
  ['press de banca inclinado', 'incline-bench-press'],
  ['press inclinado', 'incline-bench-press'],
  ['press inclinado con mancuernas', 'incline-dumbbell-press'],
  ['press de banca con mancuernas', 'dumbbell-bench-press'],
  ['press de banca plano', 'bench-press'],
  ['press banca plano', 'bench-press'],
  ['press militar', 'overhead-press'],
  ['press arnold', 'arnold-press'],
  ['press frances', 'skull-crusher'],
  ['sentadilla bulgara', 'bulgarian-split-squat'],
  ['sentadilla frontal', 'front-squat'],
  ['sentadilla goblet', 'goblet-squat'],
  ['sentadilla', 'squat'],
  ['peso muerto rumano', 'romanian-deadlift'],
  ['peso muerto', 'deadlift'],
  ['remo a 1 mano', 'one-arm-dumbbell-row'],
  ['remo a una mano', 'one-arm-dumbbell-row'],
  ['remo con mancuerna', 'one-arm-dumbbell-row'],
  ['remo con barra', 'barbell-row'],
  ['remo sentado', 'seated-row'],
  ['remo en maquina', 'machine-row'],
  ['jalon al pecho', 'lat-pulldown'],
  ['dominadas', 'pull-up'],
  ['dominada', 'pull-up'],
  ['flexiones', 'push-up'],
  ['flexion', 'push-up'],
  ['curl de biceps', 'bicep-curl'],
  ['curl martillo', 'hammer-curl'],
  ['curl femoral sentado', 'seated-leg-curl'],
  ['curl femoral tumbado', 'lying-leg-curl'],
  ['curl femoral', 'leg-curl'],
  ['extension de cuadriceps', 'leg-extension'],
  ['extension de triceps', 'tricep-pushdown'],
  ['elevaciones laterales', 'lateral-raise'],
  ['elevacion lateral', 'lateral-raise'],
  ['elevaciones frontales', 'front-raise'],
  ['elevacion frontal', 'front-raise'],
  ['pajaros', 'rear-delt-fly'],
  ['face pull', 'face-pull'],
  ['hip thrust', 'hip-thrust'],
  ['puente de gluteos', 'glute-bridge'],
  ['zancadas caminando', 'walking-lunge'],
  ['zancada', 'forward-lunge'],
  ['prensa de piernas', 'leg-press'],
  ['gemelos de pie', 'standing-calf-raise'],
  ['elevacion de gemelos', 'standing-calf-raise'],
  ['fondos', 'dip'],
  ['plancha', 'plank'],
  ['abdominales', 'crunch'],
  ['cardio en cinta', 'treadmill-incline-walk'],
  ['caminata en cinta', 'treadmill-incline-walk'],
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bpres\b/g, 'press')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const exercisesBySlug = new Map(exercises.map((exercise) => [exercise.slug, exercise]));
const availableSlugs = new Set(spanishAliases.map(([, slug]) => slug));
const exercisesByName = new Map(exercises.filter((exercise) => availableSlugs.has(exercise.slug)).map((exercise) => [normalize(exercise.name), exercise]));

export interface ExerciseIllustration {
  exercise: Exercise;
  frameUrls: string[];
}

export function findExerciseIllustration(name: string): ExerciseIllustration | null {
  const normalizedName = normalize(name);
  const exactMatch = exercisesByName.get(normalizedName);
  const alias = spanishAliases.find(([candidate]) => normalizedName.includes(candidate));
  const exercise = exactMatch ?? (alias ? exercisesBySlug.get(alias[1]) : undefined);
  if (!exercise) return null;

  const frameUrls = exercise.frames.map((frame) => `${base}/exercise-illustrations/${exercise.slug}/frame-${frame.index}.png`);

  return { exercise, frameUrls };
}
