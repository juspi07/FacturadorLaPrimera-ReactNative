import { useState, useEffect, React } from 'react';
import { Text, TextInput, Button, Portal, Modal, TouchableRipple, Divider } from 'react-native-paper';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Table, Row, TableWrapper, Cell } from 'react-native-reanimated-table';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import { useStore } from '../store'

export default function BProducto({ navigation, route }) {
    const [seaproductos, setSeaProductos] = useState([])
    const [visible, setVisible] = useState(false)
    const [focus, setFocus] = useState(false)
    const [seleccion, setSeleccion] = useState('')
    const [valor, setValor] = useState('1')
    const [productos, setProductos] = useState([])

    const [useProd, setProd] = useState(useStore.getArray('useProd') || '')

    const params = route.params;

    const statePro = {
        tableHead: ['Producto'],
        widthArrXXH: [wp('90%')],
        widthArrXXXH: [wp('90%')]
    }

    useEffect(() => {
        fetchDataProd()
    }, [])

    useEffect(() => { setValor('1') }, [!visible])

    const showModal = (name) => {
        setVisible(true)
        setSeleccion(name)
    };

    const hideModal = () => {
        setVisible(false)
    }


    const fetchDataProd = async () => {
        try {
            if (useProd) {
                let aux = useProd.filter(item => item.includes(params.lista)).sort()
                params.productos.forEach((item) => {
                    for (let index in aux) {
                        if (aux[index][0] == item[0]) {
                            aux.splice(index, 1);
                        }
                    }
                })
                aux = aux.map(subarray => [subarray[0]])
                setSeaProductos(aux)
            }
            else { console.log('tiro null') }
        } catch (e) {
            console.log(e)
        }
    }

    const Finalizar = () => {
        params.productos.forEach((item) => {
            setProductos(productos.unshift(item))
        })
        navigation.navigate({
            name: 'StackFacturacion',
            params: { productos: productos },
        })
    }

    const ModalCant = () => (
        <Portal>
            <Modal style={{ padding: 10 }} contentContainerStyle={{ backgroundColor: 'white', padding: 10, height: 140 }}
                visible={visible} onDismiss={hideModal}>
                <View style={{flexDirection:'row', justifyContent:'space-between', margin:wp('2%')}}>
                    <Text variant="titleMedium"
                        style={{
                            top: 7,
                            fontWeight: 'bold',
                        }}>
                        Cantidad:
                    </Text>
                    <Text style={{ top: 8 }}>
                        {seleccion}
                    </Text>
                </View>
                <Divider style={{margin: wp('2%')}} bold='True' />
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <InputCantidad value={valor} onchange={(e) => {
                        setValor(e)
                    }}></InputCantidad>
                    <Button style={{ left: wp('5%'), top: hp('1%') }} textColor='red' onPress={hideModal}>
                        Cancelar
                    </Button>
                </View>
            </Modal>
        </Portal>
    )

    const InputCantidad = ({ value, onchange }) => {
        const [currentvalue, setcurrentvalue] = useState(value);
        let aux = productos
        return (
            <TextInput
                value={currentvalue}
                selectTextOnFocus
                selectionColor='#f1e4ff'
                keyboardType='numeric'
                onChangeText={v => setcurrentvalue(v)}
                onEndEditing={() => onchange(currentvalue)}
                autoFocus={focus}
                onSubmitEditing={() => {
                    if (currentvalue > 0) {
                        onchange(currentvalue)
                        let index = seaproductos.indexOf(
                            seaproductos.find(arr => arr.includes(seleccion)))
                        setSeaProductos([
                            ...seaproductos.slice(0, index),
                            ...seaproductos.slice(index + 1)
                        ])
                        aux.push([seleccion, currentvalue])
                        setProductos(aux)
                        setValor('1')

                        hideModal()
                    }
                }}
            />
        );
    };


    return <>
        <Text
            variant="titleMedium"
            style={{ textAlign: 'center', margin: wp('1%') }}>
            Buscar Productos..
        </Text>
        <Table style={(route.params.CoefDpi == 3) ? styles.TablaXXH : styles.TablaXXXH} borderStyle={{ borderWidth: 0, borderColor: '#94c5ff' }}>
            <Row data={statePro.tableHead} widthArr={(route.params.CoefDpi == 3) ? statePro.widthArrXXH : statePro.widthArrXXXH} 
                style={(route.params.CoefDpi == 3) ? styles.headerXXH : styles.headerXXXH} textStyle={styles.textTitle} />
            <ScrollView style={styles.dataWrapper}>
                {
                    seaproductos.map((rowData, index) => (
                        <TableWrapper key={index} style={(route.params.CoefDpi == 3) ? styles.RowTXXH : styles.RowTXXXH}>
                            {
                                rowData.map((cellData, cellIndex) => (
                                    <TouchableRipple style={(route.params.CoefDpi == 3) ? styles.RowTXXH : styles.RowTXXXH}
                                        onPress={() => {
                                            showModal(cellData)
                                            setFocus(true)
                                        }}
                                        rippleColor="rgba(0, 0, 0, .32)">
                                        <Cell key={cellIndex} data={cellData} textStyle={{ left:wp('20%') }} />
                                    </TouchableRipple>
                                ))
                            }
                        </TableWrapper>
                    ))
                }
            </ScrollView>
        </Table>
        
        <Button
            labelStyle={{ fontSize: wp('4%') }}
            style={{ marginHorizontal:wp('30%'), maxWidth:wp('60%'), top:hp('1%')}}
            onPress={Finalizar}>
            Finalizar
        </Button>

        <ModalCant/>
    </>
}

//left: 50, marginTop: 6, width: 160, height: 40
const styles = StyleSheet.create({
    TablaXXH: { height: hp('78%'), alignItems: 'center', },
    TablaXXXH: { height: hp('79%'), alignItems: 'center', maxWidth: wp('100%') },
    RowXXH: { width: wp('80%') },
    RowXXXH: { width: wp('52%') },
    headerXXH: { height: hp('4.5%'), backgroundColor: '#e2f1ff' },
    headerXXXH: { height: hp('4%'), backgroundColor: '#e2f1ff' },
    RowTXXH: { flexDirection: 'row', height: hp('7.1%'), backgroundColor: '#E7E6E1', width: wp('89%') },
    RowTXXXH: { flexDirection: 'row', height: hp('6.1%'), backgroundColor: '#E7E6E1', width: wp('81.5%') },
    dataWrapper: { marginRight: wp('-1%'), marginTop: wp('0.3%') },
    
    text: { margin: wp('1.5%') },
    btn: { left: wp('16%') },
    textTitle: { textAlign: 'center', fontWeight: 'bold' },
    
})