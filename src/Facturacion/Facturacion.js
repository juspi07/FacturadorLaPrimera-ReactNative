import { useState, useEffect, React } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
    Surface, Text, Divider, Button, Portal, Dialog,
    TouchableRipple, SegmentedButtons, Modal, TextInput,
    Icon
} from 'react-native-paper';
import { Table, Row, TableWrapper } from 'react-native-reanimated-table';

import {
    BLEPrinter, ColumnAlignment, COMMANDS,
} from 'react-native-thermal-receipt-printer-image-qr';

import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';


import { useStore, apiClient } from '../store'



export default function Facturacion({ navigation, route }) {
    // States del programa
    const [cliente, setCliente] = useState('');
    const [items, setItems] = useState([]);
    const [itemsF, setItemsF] = useState([]);
    const [fecha, setFecha] = useState("")
    const [factura, setFactura] = useState("")
    const [internet, setNoInternet] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [total, setTotal] = useState('0.00')
    const [precios, setPrecios] = useState([]);
    const [tipo, setTipo] = useState(1)
    const [visibleNC, setVisibleNC] = useState(false);
    const [visibleRef, setVisibleRef] = useState(false);
    //const [chkImp, setChkImp] = useState(false)
    const [usePrinter, setPrinter] = useState(useStore.getMap('usePrinter') || '')
    const [usePtoventa, setPtoventa] = useState(useStore.getString('usePtoventa'))
    const [useProd, setProd] = useState()
    const [useCli, setCli] = useState()
    const [NroFact, setNroFact] = useState('')

    // States de la Alerta
    const [visible, setVisible] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [texto, setTexto] = useState('');

    // Variables de Impresora
    const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON
    const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF
    const CENTER = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT
    const LEFT = COMMANDS.TEXT_FORMAT.TXT_ALIGN_LT
    const RIGHT = COMMANDS.TEXT_FORMAT.TXT_ALIGN_RT

    let waitTime = 1


    const showModal = (name) => {
        setVisibleNC(true)
        setSeleccion(name)
    };

    const hideModal = () => {
        if (NroFact) { setVisibleNC(false); }
    }

    const hideModal2 = () => { setVisibleRef(false) }

    const connectPrinter = async () => {
        try {
            if (usePrinter) {
                await BLEPrinter.closeConn()
                await BLEPrinter.connectPrinter(usePrinter.inner_mac_address)
                await asyncPrintText(``, waitTime++)
                return true
            }
            return false
        }
        catch (e) {
            console.warn(e)
            return false
        }
    }

    useEffect(() => {
        const Iniciar = async () => {
            await BLEPrinter.init()
        }

        const Variables = async () => {
            //setPrinter(await useStore.getMapAsync('usePrinter') || '');
            //setIp(await useStore.getStringAsync('useIp') || '');
            //setPtoventa(await useStore.getStringAsync('usePtoventa') || '');
            setProd(await useStore.getArrayAsync('useProd') || '');
            setCli(await useStore.getStringAsync('useCli') || '');
        }
        Variables()
        Iniciar()
        //connectPrinter()
    }, [])

    useEffect(() => {
        const auxiliar = async () => {
            await fetchDate()
            await fetchInvoice()
            setLoading(false)
        }
        auxiliar()
    }, [tipo])

    useEffect(() => {
        if (route.params.productos.length != 0) {
            setItems(route.params.productos)
            CalcTotal(true)
        }
    }, [route.params.productos])

    useEffect(() => {
        if (route.params.cliente.length != 0) {
            setCliente(route.params.cliente)
            setListaPrecios()
        }
    }, [route.params.cliente]);

    useEffect(() => {
        if (itemsF.length !== 0) {
            CalcTotal(false)
        }
    }, [itemsF])

    const setListaPrecios = () => {
        if (useProd) {
            let aux = useProd.filter(item => item.includes(route.params.cliente[6])).sort()
            setPrecios(aux)
        }
    }

    const CalcTotal = (band) => {
        let tot = 0.00
        if (band) {
            let arr = []
            route.params.productos.forEach(e => {
                precios.forEach(a => {
                    if (a[0] === e[0]) {
                        let preciu = (parseFloat(a[2]) / (1 + parseFloat(a[3]) / 100)).toFixed(6)
                        let total = (parseFloat(preciu) * Number(e[1])).toFixed(2)
                        arr.push([
                            e[0],
                            e[1],
                            preciu,
                            total])
                    }
                })
            })
            arr.forEach(e => {
                tot += parseFloat(e[3])
            })
            setItemsF(arr)
        }
        else {
            itemsF.forEach(e => {
                tot += parseFloat(e[3])
            })
        }
        setTotal((tot * 1.21).toFixed(2))
    }

    const BorrarItem = (index) => {
        setItemsF([
            ...itemsF.slice(0, index),
            ...itemsF.slice(index + 1)])
        setItems([
            ...items.slice(0, index),
            ...items.slice(index + 1)
        ]);
    }

    const Reiniciar = () => {
        refreshing2()
        /*setCliente('')
        route.params.cliente = ''
        route.params.productos = []
        setItems([])
        setSeleccion('')
        setTipo(1)
        fetchInvoice()
        setTotal('0.00')
        setFechaD()
        setNroFact()*/
    }

    const fetchDate = async () => {
        try {
            const e = await apiClient.get(`/getFecha`)
            setFecha(e.data)

            setNoInternet(false)
        }
        catch (error) {
            if (!visible) {
                if (error.response) {
                    // The server responded with a status code outside the 2xx range
                    setTitulo('Error desconocido')
                    setTexto(String(error))
                    setNoInternet(true)
                } else if (error.request) {
                    // The request was made but no response was received
                    setTitulo('No hay respuesta del servidor')
                    setTexto('Puede ser que no este conectado el servidor o la ip haya cambiado')
                    setNoInternet(true)
                } else {
                    // Something happened in setting up the request that triggered an error
                    setTitulo('Error desconocido')
                    setTexto(error.response)
                    setNoInternet(true)
                }
                setVisible(true)
            }
        }
    }

    const fetchInvoice = async () => {
        try {
            const e = await apiClient.post(`/getLastVoucher`,
                {
                    tipo: tipo,
                    ptoventa: usePtoventa
                })
            setFactura(e.data['CbteNro'] + 1)
            setNoInternet(false)
        } catch (error) {
            if (!visible) {
                if (error.response) {
                    // The server responded with a status code outside the 2xx range
                    setTitulo('Error desconocido')
                    setTexto(error.response)
                    setNoInternet(true)
                } else if (error.request) {
                    // The request was made but no response was received
                    setTitulo('No hay respuesta del servidor')
                    setTexto('Puede ser que no este conectado el servidor o la ip haya cambiado')
                    setNoInternet(true)
                } else {
                    // Something happened in setting up the request that triggered an error
                    setTitulo('Error desconocido')
                    setTexto(error.response)
                    setNoInternet(true)
                }
                setVisible(true)
            }
        }
    }

    const Total = () => {
        return (
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 13
            }}>
                <Text variant="titleMedium" >
                    Total:
                </Text>
                <Text variant="titleMedium">
                    $ {total}
                </Text>
            </View>
        )
    }

    const SeccionFactura = () => (
        <Surface style={(route.params.CoefDpi == 3) ? styles.SurfaceFXXH : styles.SurfaceFXXXH} elevation={2}>
            <View style={styles.FlexBet}>
                <SegmentedButtons
                    style={{ bottom: hp('-1.2%'), width: wp('55%') }}
                    value={tipo}
                    onValueChange={setTipo}
                    density='small'
                    buttons={[
                        {
                            value: 1,
                            label: 'Factura',
                            icon: 'alpha-f-box-outline'
                        },
                        {
                            value: 3,
                            label: 'Nota C.',
                            icon: 'alpha-n-box-outline'
                        },
                    ]}
                />
                <Text variant="titleMedium"
                    style={{
                        fontSize: wp('3.5%'),
                        top: hp('2%'),
                        fontWeight: 'bold',
                    }}>A - {factura}</Text>
            </View>
            <Divider
                style={{
                    margin: 10,
                    top: 4
                }}
                bold='True' />
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 13
            }}>
                <Text variant="titleMedium" style={{ fontSize: wp('4%') }}>
                    Fecha:
                </Text>
                <Text variant="titleMedium" style={{ fontSize: wp('4%') }}>
                    {fecha}
                </Text>
            </View>
            <Total></Total>
        </Surface>
    )

    const DatosCliente = () => (
        <View style={{ paddingHorizontal: wp('3%') }}>
            <View style={{ justifyContent: 'space-between', flexDirection: 'row', }}>
                <Text variant="titleMedium" style={(route.params.CoefDpi == 3) ? { fontSize: wp('4%') } : null}>
                    Nombre:
                </Text>

                <Text variant="bodyLarge" style={(route.params.CoefDpi == 3) ? { fontSize: wp('4%') } : null}>
                    {route.params.CoefDpi == 3 ? cliente[1].length >= 23 ? cliente[1].slice(0, 22) + ' ...' : cliente[1] : cliente[1]}
                </Text>
            </View>
            <View style={{ justifyContent: 'space-between', flexDirection: 'row', }}>
                <Text variant="titleMedium" style={(route.params.CoefDpi == 3) ? { fontSize: wp('4%') } : null}>
                    CUIT:
                </Text>
                <Text variant="bodyLarge" style={(route.params.CoefDpi == 3) ? { fontSize: wp('4%') } : null}>
                    {cliente[0]}
                </Text>
            </View>
            <View style={{ justifyContent: 'space-between', flexDirection: 'row', }}>
                <Text variant="titleMedium" style={(route.params.CoefDpi == 3) ? { fontSize: wp('4%') } : null}>
                    Lista:
                </Text>
                <Text variant="bodyLarge" style={(route.params.CoefDpi == 3) ? { fontSize: wp('4%') } : null}>
                    {cliente[6]}
                </Text>
            </View>
        </View>
    )

    const SeccionCliente = () => (
        <Surface style={(route.params.CoefDpi == 3) ? styles.SurfaceCXXH : styles.SurfaceCXXXH} elevation={2}>
            <View style={styles.FlexBet}>
                <Text variant="titleLarge"
                    style={{
                        top: hp('1%'),
                        fontWeight: 'bold',
                    }}>
                    Cliente
                </Text>
                <Button style={(route.params.CoefDpi == 3) ? styles.BttnXXH : styles.BttnXXXH}
                    //disabled={cliente == '' ? true : false}
                    compact={true}
                    onPress={() => {
                        Reiniciar()
                    }}
                >Reiniciar</Button>
            </View>
            <Divider
                style={{ margin: hp('1%') }}
                bold='True'>
            </Divider>
            {cliente === '' ? <Button
                style={{ marginHorizontal: wp('10%'), marginVertical: hp('2%'), maxWidth: wp('75%') }}
                icon="account-search" mode="outlined"
                disabled={internet}
                onPress={() => navigation.navigate('StackCliente')}>
                Buscar
            </Button> : <DatosCliente></DatosCliente>}
        </Surface>
    )

    const Alerta = () => (
        <View>
            <Portal>
                <Dialog visible={visible} onDismiss={() => setVisible(false)}>
                    <Dialog.Title>{titulo}</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">{texto}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setVisible(false)}>Aceptar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    )

    const GenerarFactura = async () => {
        if (await connectPrinter()) {
            if (tipo === 3 && !NroFact) {
                showModal(true)
            }
            else {
                try {
                    let response = await apiClient.post(`facturacion`,
                        {
                            cliente: cliente,
                            total: total,
                            tipo: tipo,
                            NroFact: factura,
                            ptoventa: usePtoventa,
                            items: itemsF,

                            NroFactD: NroFact
                        })
                    if (response) {
                        Imprimir(tipo, usePtoventa,
                            String(factura), String(fecha), cliente, itemsF,
                            String(response.data[3]), String(response.data[4]),
                            response.data[0], response.data[1], response.data[2]
                        ).catch(e => console.log(e))
                        Reiniciar()
                    }
                }
                catch (error) {
                    setTitulo('Error')
                    setTexto(error)
                    setVisible(true)
                    Reiniciar()
                }
            }
        } else {
            setTitulo('Error')
            setTexto('No se pudo imprimir, trate de volver a conectar la impresora')
            setVisible(true)
        }
    };

    const asyncPrintText = async (text, waitTime) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                BLEPrinter.printText(text);
                resolve();
            }, waitTime * 50);
        })
    };

    const asyncPrintBill = (text, waitTime) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                BLEPrinter.printBill(text);
                resolve();
            }, waitTime * 50);
        });
    };

    const asyncPrintColumnsText = (
        columnHeader,
        columnWidth,
        columnAliment,
        columnStyle,
        waitTime,
    ) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                BLEPrinter.printColumnsText(
                    columnHeader,
                    columnWidth,
                    columnAliment,
                    columnStyle,
                );
                resolve();
            }, waitTime * 50);
        });
    };

    const asyncPrintQr = (text, waitTime) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                BLEPrinter.printImageBase64(text);
                resolve();
            }, waitTime * 50);
        });
    };

    const Imprimir = async (tipo, ptoVta, nroCmp, fecha, cliente, itemsF, neto, iva, qr, cae, caevto) => {
        let title = ''
        let tpp = tipo
        let ppt = String(ptoVta).padStart(4, '0')
        let pptcmt = String(nroCmp).padStart(8, '0')
        let duplicado = Number(cliente[9])

        if (tpp === 1) {
            title = 'Cod. 001 - FACTURA A'
        } else {
            title = 'Cod. 003 - NOTA DE CREDITO A'
            duplicado = 0
        }

        for (let i = 0; i <= duplicado; i++) {
            Promise.all([
                asyncPrintText(`LA PRIMERA SA`, waitTime++),
                asyncPrintText('DIRECCION: PELLEGRINI 701', waitTime++),
                asyncPrintText('CUIT: 30-67020652-8', waitTime++),
                asyncPrintText('INICIO DE ACTIVIDADES: 22/12/1994', waitTime++),
                asyncPrintText('IVA RESPONSABLE INSCRIPTO', waitTime++),
                //SETEAR SI ES IMPRESORA DE 50 O 80MM
                asyncPrintText(
                    `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                asyncPrintText(`${CENTER}${BOLD_ON}${title}\n${BOLD_OFF}`, waitTime++),
                asyncPrintColumnsText(
                    [`Fecha: ${fecha}`, `Nro: ${ppt}-${pptcmt}`],
                    [23, 23],
                    [ColumnAlignment.LEFT, ColumnAlignment.RIGHT],
                    ['', ''],
                    waitTime++,
                ),
                asyncPrintText(
                    `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                asyncPrintText(`${LEFT}${cliente[1]}`, waitTime++),
                asyncPrintText(`CUIT Nro. ${cliente[0]}`, waitTime++),
                asyncPrintText(`IVA ${cliente[5]}`, waitTime++),
                asyncPrintText(`${cliente[4]}`, waitTime++),
                asyncPrintText(
                    `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                itemsF.forEach(e => {
                    let totalLength = 48
                    let spaces = totalLength - e[0].length - e[3].length;
                    let result = e[0] + ' '.repeat(spaces) + e[3];
                    asyncPrintText(`${LEFT}${e[1]} X ${e[2]}`, waitTime++),
                        asyncPrintText(result, waitTime++)
                }),
                asyncPrintText(
                    `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                asyncPrintText(`Subtotal: ${neto}`, waitTime++),
                asyncPrintText(`IVA 21%: ${iva}`, waitTime++),
                asyncPrintText(
                    `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR_80MM}`, waitTime++),
                asyncPrintColumnsText(
                    ['', 'TOTAL $', '', `${total}`],
                    [9, 9, 9, 9],
                    [ColumnAlignment.LEFT, ColumnAlignment.CENTER, ColumnAlignment.CENTER, ColumnAlignment.RIGHT],
                    ['', `${BOLD_ON}`, '', ''],
                    waitTime++,
                ),
                asyncPrintText(
                    `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR_80MM}`, waitTime++),
                asyncPrintQr(qr.slice(22), waitTime++),
                asyncPrintBill(`${CENTER}CAE: ${cae}     CAE Vto: ${caevto}`, waitTime++)
            ]).then(() => {
            }).catch(e => { console.log(e); });
        }
    }

    const SeccionItems = () => (
        <Surface style={(route.params.CoefDpi == 3) ? styles.SurfaceIXXH : styles.SurfaceIXXXH} elevation={2}>
            <View style={styles.FlexBet}>
                <Text variant="titleLarge"
                    style={{
                        top: 9,
                        left: 2,
                        fontWeight: 'bold',
                    }}>
                    Items
                </Text>
                <Button
                    disabled={(items.length != 0 && total != '0.00') ? false : true}
                    icon='check'
                    compact={true}
                    uppercase={true}
                    mode='text'
                    textColor='darkgreen'
                    onPress={GenerarFactura}
                    style={{ top: 4 }}>Generar factura
                </Button>
            </View>
            <Divider
                style={{ margin: 10 }}
                bold='True'>
            </Divider>
            {items.length == 0 ?
                <>
                    <Button
                        disabled={cliente.length == '' ? true : false}
                        style={{ margin: wp('10%') }}
                        icon="archive-search" mode="outlined"
                        onPress={() => navigation.navigate('StackProducto', {
                            lista: cliente[6],
                            productos: items
                            /* producto: producto.map(subArray => subArray[0]) */
                        })}>
                        Buscar Producto
                    </Button>
                </>
                : <TableItems></TableItems>
            }
        </Surface>
    )

    const ModalNC = () => (
        <Portal>
            <Modal style={{ padding: 10 }} contentContainerStyle={{ backgroundColor: 'white', padding: 10, height: 340 }}
                visible={visibleNC} onDismiss={hideModal} dismissable={false}>
                <View style={{ bottom: 9, flexDirection: 'row', justifyContent: 'center' }}>
                    <Text variant="titleMedium"
                        style={{
                            top: 7,
                            fontWeight: 'bold',
                        }}>
                        Ingrese los siguientes datos:
                    </Text>
                </View>
                <Divider
                    style={{
                        margin: 8,
                        top: 1,
                    }}
                    bold='True' />

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 }}>
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Opciones />
                    </View>
                    <Button style={{ top: 5 }} textColor='green' onPress={hideModal}>
                        Aceptar
                    </Button>
                </View>
            </Modal>
        </Portal>
    )

    const Opciones = () => {
        return (
            <>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <InputCantidad value={NroFact} onchange={(e) => { setNroFact(e) }}></InputCantidad>
                    {(NroFact.length > 0) ? <Icon size={18} source='check-bold' /> : <Icon size={18} source='block-helper' />}
                </View>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <TextInput style={{ marginRight: 8, maxHeight: 60 }} value={cliente[0]} placeholder='Ingrese el Cuit'></TextInput>
                    {cliente ? <Icon size={18} source='check-bold' /> : <Icon size={18} source='block-helper' />}
                </View>
            </>
        )
    }

    const InputCantidad = ({ value, onchange }) => {
        const [currentvalue, setcurrentvalue] = useState(value);

        return (
            <TextInput
                style={{ marginRight: 8, maxHeight: 60, minWidth: 140 }}
                placeholder='Ingrese Nro Fact (solo numero)'
                value={currentvalue}
                //autoFocus={true}
                keyboardType='numeric'
                onChangeText={v => setcurrentvalue(v)}
                onEndEditing={() => onchange(currentvalue)}
                onSubmitEditing={() => {
                    onchange(currentvalue)
                }}
            />
        );
    };
    //widthArr={[wp('58%'), wp('50%')]}
    const TableItems = () => {
        return (
            <>
                <Table style={(route.params.CoefDpi == 3) ? styles.TableXXH : styles.TableXXXH} >
                    <Row widthArr={(route.params.CoefDpi == 3) ? [wp('60%'), wp('30%')] : [wp('63%'), wp('50%')]}
                        data={['Producto', 'Cantidad']}
                        textStyle={{ margin: wp('1%') }} />
                    <ScrollView style={{ marginTop: -1 }}>
                        {
                            items.map((rowData, index) => (
                                <TableWrapper key={index} style={styles.row}>
                                    <TouchableRipple
                                        onLongPress={() => { BorrarItem(index, rowData) }}>
                                        <Row
                                            key={index}
                                            data={rowData}
                                            widthArr={(route.params.CoefDpi == 3) ? [wp('67%'), wp('30%')] : [wp('65%'), wp('50%')]}
                                            textStyle={(route.params.CoefDpi == 3) ? styles.textRowXXH : styles.textRowXXXH}
                                        />
                                    </TouchableRipple>
                                </TableWrapper>
                            ))
                        }
                    </ScrollView>
                </Table>

                <Divider
                    style={{ marginLeft: wp('1%'), marginRight: wp('1%') }}
                    bold='True'>
                </Divider>
                <Button
                    style={{ top: 10 }}
                    icon="archive-search"
                    onPress={() => navigation.navigate('StackProducto', {
                        lista: cliente[6],
                        productos: items
                    })}>
                    Buscar Producto
                </Button>
            </>
        )
    }

    const ModalRefresh = () => {
        return (<>
            <Portal>
                <Dialog visible={visibleRef} onDismiss={hideModal2}>
                    <Dialog.Title>¿Desea actualizar?</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">Se perderan todos los datos guardados</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={refreshing2}>Aceptar</Button>
                        <Button onPress={hideModal2}>Cancelar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </>)
    }

    const refreshing2 = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            connectPrinter()
            navigation.replace('StackFacturacion')
        }, 500);
    }

    return (
        <>
            <SeccionFactura />
            <SeccionCliente />
            <SeccionItems />
            <Alerta></Alerta>
            <ModalNC></ModalNC>
            <ModalRefresh></ModalRefresh>
        </>
    )
}

//eas build --profile production --platform android --local
//app>npx expo run:android


const styles = StyleSheet.create({
    FlexBet: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: wp('3%'),
    },

    SurfaceFXXH: {
        marginLeft: wp('6%'),
        marginTop: hp('1%'),
        height: hp('17.5%'),
        width: wp('88%'),
    },
    SurfaceFXXXH: {
        marginLeft: wp('6%'),
        marginTop: hp('1%'),
        height: hp('15%'),
        width: wp('88%'),
    },
    SurfaceCXXH: {
        marginLeft: wp('6%'),
        marginTop: wp('2%'),
        height: hp('21%'),
        width: wp('88%'),
    },
    SurfaceCXXXH: {
        marginLeft: wp('6%'),
        marginTop: wp('2%'),
        height: hp('17%'),
        width: wp('88%'),
    },
    SurfaceIXXH: {
        marginLeft: wp('6%'),
        marginTop: hp('1%'),
        width: wp('88%'),
        height: hp('48%'),
    },
    SurfaceIXXXH: {
        marginLeft: wp('6%'),
        marginTop: hp('1%'),
        width: wp('88%'),
        height: hp('53%'),
    },
    BttnXXH: { top: hp('0.5%'), height: hp('5.3%') },
    BttnXXXH: { top: hp('0.4%'), height: hp('4.3%') },
    header: { height: hp('10%'), backgroundColor: '#f1f8ff' },
    row: { flexDirection: 'row', height: hp('6%'), backgroundColor: '#E7E6E1', width: wp('90%') },

    TableXXH: { marginHorizontal: wp('3%'), height: hp('30%') },
    TableXXXH: { marginHorizontal: wp('3%'), height: hp('38%') },

    textTitle: { textAlign: 'center', fontWeight: 'bold' },
    textRowXXH: { margin: wp('2.3%') },
    textRowXXXH: { margin: wp('3%') },


    btnText: { textAlign: 'center', color: '#fff' },
    dataWrapper: { marginRight: -1, marginTop: 1 },
});
