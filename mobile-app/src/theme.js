/** Djassa Online — design tokens (mobile) */
export const Couleurs = {
  red: '#E11D48',
  redStrong: '#E60023',
  redDark: '#BE123C',
  redSoft: '#FECDD3',
  black: '#121212',
  ink: '#0F172A',
  white: '#FFFFFF',
  cloud: '#F5F5F5',
  mist: '#F8FAFC',
  slate: '#64748B',
  flashGradient: ['#C1112E', '#E11D48', '#E60023'],
};

export const Polices = {
  jakarta: 'PlusJakartaSans_800ExtraBold',
  jakartaBold: 'PlusJakartaSans_700Bold',
  jakartaSemi: 'PlusJakartaSans_600SemiBold',
  inter: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemi: 'Inter_600SemiBold',
};

export const Ombres = {
  card: {
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  pop: {
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 8,
  },
};

/** Ordre du bundle de polices pour useFonts */
export const POLICE_SOURCES = {
  PlusJakartaSans_600SemiBold: require('@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf'),
  PlusJakartaSans_700Bold: require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'),
  PlusJakartaSans_800ExtraBold: require('@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf'),
  Inter_400Regular: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  Inter_500Medium: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  Inter_600SemiBold: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
};
