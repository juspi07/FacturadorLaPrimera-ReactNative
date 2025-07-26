import { PermissionsAndroid } from 'react-native';

/* export async function requestLocationPermission() {
    try {
        const granted = await PermissionsAndroid.requestMultiple(
            [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            ], {
                title: 'Location permission for bluetooth scanning',
                message: 'wahtever',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
                },
        )
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission for bluetooth scanning granted');
        return true;
      } else {
        console.log('Location permission for bluetooth scanning revoked');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
}
*/


export async function requestLocationPermission() {
    try {
        const userResponse = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        ]);
        return userResponse;
    } catch (err) {
        console.warn(err);
    }
    return null;
  }