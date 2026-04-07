export type ExerciseDef = {
  key: string;
  label: string;
  dbId: string;
  setsHint?: string;
  optional?: boolean;
};

export type WorkoutDef = {
  id: string;
  title: string;
  hint?: string;
  emoji: string;
  exercises: ExerciseDef[];
};

/** Illustrations: yuhonas/free-exercise-db (CC0) */
export const IMAGE_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export function frameUrls(dbId: string) {
  const enc = encodeURI(dbId);
  return [`${IMAGE_BASE}${enc}/0.jpg`, `${IMAGE_BASE}${enc}/1.jpg`] as const;
}

export const WORKOUTS: WorkoutDef[] = [
  {
    id: 'chest-shoulder-biceps',
    title: 'Chest · shoulders · biceps',
    hint: 'Push & arms',
    emoji: '🧊',
    exercises: [
      { key: 'shoulder-press', label: 'Shoulder press', dbId: 'Dumbbell_Shoulder_Press' },
      {
        key: 'incline-bench',
        label: 'Incline bench',
        dbId: 'Barbell_Incline_Bench_Press_-_Medium_Grip',
      },
      { key: 'chest-fly', label: 'Chest fly', dbId: 'Dumbbell_Flyes' },
      { key: 'biceps-cables', label: 'Biceps (cables)', dbId: 'Standing_Biceps_Cable_Curl' },
      { key: 'hammer-curls', label: 'Hammer curls', dbId: 'Alternate_Hammer_Curl' },
    ],
  },
  {
    id: 'back-shoulders-triceps',
    title: 'Back · shoulders · triceps',
    hint: 'Pull & arms',
    emoji: '🪢',
    exercises: [
      { key: 'wide-rows', label: 'Wide rows', dbId: 'Bent_Over_Barbell_Row' },
      { key: 'close-grip-rows', label: 'Close grip rows', dbId: 'Reverse_Grip_Bent-Over_Rows' },
      {
        key: 'lean-away-lateral',
        label: 'Lean away lateral raise',
        dbId: 'One-Arm_Incline_Lateral_Raise',
      },
      { key: 'triceps-pushdown', label: 'Triceps pushdown', dbId: 'Triceps_Pushdown' },
      {
        key: 'triceps-overhead',
        label: 'Triceps overhead',
        dbId: 'Cable_Rope_Overhead_Triceps_Extension',
      },
      { key: 'rope-facepulls', label: 'Rope face pulls', dbId: 'Face_Pull', optional: true },
    ],
  },
  {
    id: 'core-legs',
    title: 'Core · legs',
    hint: 'Legs & abs',
    emoji: '🦵',
    exercises: [
      { key: 'goblet-squat', label: 'Dumbbell goblet squat', dbId: 'Goblet_Squat', setsHint: '2 sets' },
      {
        key: 'db-rdl',
        label: 'Dumbbell Romanian deadlift',
        dbId: 'Stiff-Legged_Dumbbell_Deadlift',
        setsHint: '2 sets',
      },
      { key: 'leg-extension', label: 'Leg extensions', dbId: 'Leg_Extensions' },
      { key: 'leg-curl', label: 'Leg curls', dbId: 'Lying_Leg_Curls' },
      { key: 'adductor', label: 'Adductors (machine)', dbId: 'Thigh_Adductor' },
      { key: 'abductor', label: 'Abductors (machine)', dbId: 'Thigh_Abductor' },
      { key: 'calves', label: 'Calves', dbId: 'Standing_Calf_Raises' },
      { key: 'dead-bugs', label: 'Dead bugs', dbId: 'Dead_Bug' },
      { key: 'cable-crunch', label: 'Cable crunch', dbId: 'Cable_Crunch' },
    ],
  },
  {
    id: 'upper',
    title: 'Upper',
    hint: 'Upper mix',
    emoji: '⚡',
    exercises: [
      {
        key: 'incline-chest-machine',
        label: 'Incline chest machine',
        dbId: 'Smith_Machine_Incline_Bench_Press',
        setsHint: '4 sets',
      },
      { key: 'lateral-raise-upper', label: 'Lean away lateral raise', dbId: 'Side_Lateral_Raise' },
      { key: 'face-pull-upper', label: 'Rope face pulls', dbId: 'Face_Pull' },
      { key: 'lat-pulldown', label: 'Lat pulldown', dbId: 'Close-Grip_Front_Lat_Pulldown' },
      { key: 'db-biceps', label: 'Dumbbell biceps', dbId: 'Dumbbell_Bicep_Curl' },
      {
        key: 'triceps-pushdown-upper',
        label: 'Triceps pushdown',
        dbId: 'Triceps_Pushdown_-_Rope_Attachment',
      },
    ],
  },
];
