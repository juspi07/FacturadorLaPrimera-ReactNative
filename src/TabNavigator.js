import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Appbar } from 'react-native-paper';

import Facturacion from './(tabs)/Facturacion/Facturacion';

export default function MyTabs() {
    const Tab = createBottomTabNavigator();
    
    
    return (
        <>
            <Appbar.Header >
                <Appbar.Content titleStyle={{ paddingLeft: 35 }} title="La Primera - Facturacion Online" />
            </Appbar.Header>

            <Tab.Navigator screenOptions={{ headerShown: false }}>
                <Tab.Screen name="Facturacion" component={Facturacion} />
            </Tab.Navigator>
        </>
    );
}