import { React } from 'react';
import { AppRegistry, LogBox, PixelRatio } from 'react-native';
import { PaperProvider, Appbar, Icon, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


import BCliente from './src/Facturacion/BCliente';
import Facturacion from './src/Facturacion/Facturacion';
import BProducto from './src/Facturacion/BProducto';

import Config from './src/Configuracion';


export default function App() {
  const Tab = createBottomTabNavigator();
  const Stack = createNativeStackNavigator()
  LogBox.ignoreLogs(['Warning: ...'])
  LogBox.ignoreAllLogs()
  const CoefDpi = PixelRatio.get()
  const CoefDpiF = PixelRatio.getFontScale()

  console.log(CoefDpi)
  
  
  const TabNavigator = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Facturacion') {
            iconName = focused
              ? 'home'
              : 'home-outline';
          } else {
            iconName = focused ? 'toolbox' : 'toolbox-outline';
          }

          // You can return any component that you like here!
          return <Icon source={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#663399',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        unmountOnBlur: true
      })}
    >
      <Tab.Screen name="Facturacion" component={FacturacionTab} />
      <Tab.Screen name="Configuracion" component={Config} />
    </Tab.Navigator>
  )


  const FacturacionTab = () => (
    <Stack.Navigator initialRouteName="StackFacturacion" screenOptions={{ headerShown: false }}>
      <Stack.Screen initialParams={{ cliente: [], productos: [], 
        CoefDpi: CoefDpi, CoefDpiF: CoefDpiF }} name="StackFacturacion" component={Facturacion} />
      <Stack.Screen name="StackCliente" initialParams={{ CoefDpi: CoefDpi, CoefDpiF: CoefDpiF }} component={BCliente} />
      <Stack.Screen name="StackProducto" initialParams={{ CoefDpi: CoefDpi, CoefDpiF: CoefDpiF }} component={BProducto} />
    </Stack.Navigator>
  )

  /*const AppbarHeader = () => (
    <Appbar.Header statusBarHeight={0}>
      <Appbar.Content titleStyle={{ paddingLeft: 50, fontSize:20 }}
        title="La Primera - Facturacion Online" />
    </Appbar.Header>
  )*/


  return (
    <SafeAreaProvider>
      <SafeAreaView style={{flex:1}}>
      <PaperProvider theme={MD3LightTheme}>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </PaperProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

AppRegistry.registerComponent('my-app', () => App)
