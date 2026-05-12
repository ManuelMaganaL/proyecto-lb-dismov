import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const triggerHapticNotification = async (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(type);
  } catch (error) {
    console.log("Haptics no disponible: Requiere recompilar el cliente nativo.");
  }
};

export const triggerHapticImpact = async (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(style);
  } catch (error) {
    console.log("Haptics no disponible: Requiere recompilar el cliente nativo.");
  }
};
