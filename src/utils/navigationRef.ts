/**
 * Navigation Ref - Global navigation reference for logout and deep navigation
 * @format
 */

import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}

export function reset(routes: Array<{ name: keyof RootStackParamList; params?: any }>) {
  console.log('Navigation reset called with routes:', routes);
  console.log('Navigation ref isReady:', navigationRef.isReady());
  console.log('Navigation ref current:', navigationRef.getCurrentRoute()?.name);
  
  if (navigationRef.isReady()) {
    try {
      navigationRef.reset({
        index: 0,
        routes: routes as never[],
      });
      console.log('Navigation reset successful');
    } catch (error) {
      console.error('Navigation reset error:', error);
    }
  } else {
    console.warn('Navigation ref is not ready yet, will retry');
    // Try again after a short delay
    setTimeout(() => {
      if (navigationRef.isReady()) {
        try {
          navigationRef.reset({
            index: 0,
            routes: routes as never[],
          });
          console.log('Navigation reset successful after retry');
        } catch (error) {
          console.error('Navigation reset error on retry:', error);
        }
      } else {
        console.error('Navigation ref still not ready after delay');
      }
    }, 200);
  }
}

