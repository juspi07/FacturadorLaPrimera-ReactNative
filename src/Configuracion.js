import { useState, useEffect, React } from 'react';
import { StyleSheet, View } from 'react-native';
import {
    Text, Button, Portal, Dialog,
    List, SegmentedButtons,
    TextInput,
    Divider, RadioButton, IconButton
} from 'react-native-paper';

import { requestMultiple, RESULTS, PERMISSIONS, openSettings } from 'react-native-permissions'

import {
    BLEPrinter, ColumnAlignment, COMMANDS
} from 'react-native-thermal-receipt-printer-image-qr';


import { useStore, apiClient, changeBaseURL } from './store'



export default function Configuracion({ navigation, route }) {
    const [value, setValue] = useState('Printer');
    const [poolPrinters, setPoolPrinters] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [radioSelect, setRadioSelect] = useState(1);
    const [Retext, setRetext] = useState('')

    //const [chkImp, setChkImp] = useState()
    const [usePrinter, setPrinter] = useState()
    const [useIp, setIp] = useState()
    const [usePtoventa, setPtoventa] = useState()

    const [useLista, setLista] = useState([])
    const [valLista, setvalLista] = useState('')
    const [useOpc, setOpc] = useState("Seleccione una lista")



    // Variables de Impresora
    const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON
    const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF
    const CENTER = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT
    const LEFT = COMMANDS.TEXT_FORMAT.TXT_ALIGN_LT
    const RIGHT = COMMANDS.TEXT_FORMAT.TXT_ALIGN_RT
    let waitTime = 0.5

    // Variables de Alerta
    const [titulo, setTitulo] = useState('');
    const [texto, setTexto] = useState('');
    const [visible, setVisible] = useState(false);
    const [conf, setConf] = useState(false);

    const handlePress = () => {
        setExpanded(!expanded);
    }

    const Alerta = () => (
        <View>
            <Portal>
                <Dialog visible={visible} onDismiss={() => {
                    setVisible(false);
                    if (conf) {
                        openSettings('application').catch(() => console.warn('Cannot open app settings'));
                        setConf(false)
                    }
                }}>
                    <Dialog.Title>{titulo}</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">{texto}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => {
                            setVisible(false);
                            if (conf) {
                                openSettings('application').catch(() => console.warn('Cannot open app settings'));
                                setConf(false)
                            }
                        }}>Aceptar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    )

    useEffect(() => {
        const checkAndRequestPermissions = async () => {
            try {
                const bluetoothPermissions = await requestMultiple([
                    PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                    PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
                ]);

                const allPermissionsGranted =
                    [RESULTS.GRANTED, RESULTS.UNAVAILABLE].includes(bluetoothPermissions[PERMISSIONS.ANDROID.BLUETOOTH_SCAN]) &&
                    [RESULTS.GRANTED, RESULTS.UNAVAILABLE].includes(bluetoothPermissions[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT]) &&
                    [RESULTS.GRANTED, RESULTS.UNAVAILABLE].includes(bluetoothPermissions[PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE])

                return (allPermissionsGranted);
            } catch (error) {
                return (false);
            }
        };

        const ListarPrinters = async () => {
            try {
                const a = await checkAndRequestPermissions()
                if (a) {
                    await BLEPrinter.init()
                    setPoolPrinters(await BLEPrinter.getDeviceList())
                } else {
                    setTitulo('Error de permisos')
                    setTexto('Acepte los permisos en la siguiente pantalla')
                    setVisible(true)
                    setConf(true)
                }
            } catch (e) {
                console.log(e)
            }
        }
        const Variables = async () => {
            //setChkImp(await useStore.getBoolAsync('chkImp'));
            setPrinter(await useStore.getMapAsync('usePrinter') || '');
            setIp(await useStore.getStringAsync('useIp') || '');
            setPtoventa(await useStore.getStringAsync('usePtoventa') || '');
            setLista(await useStore.getArrayAsync('useList') || []);
            //setProd(await useStore.getStringAsync('useProd') || '');
            //setCli(await useStore.getStringAsync('useCli') || '');
        }
        Variables()
        ListarPrinters()
    }, [])



    const Closeconnect = async () => {
        await BLEPrinter.closeConn()
        //await useStore.setBoolAsync('ChkImp', false)
        //setChkImp(false)
    }

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

    const SyncClientes = async () => {
        try {
            const e = await apiClient.get(`/buscarCliente`)
            await useStore.setArrayAsync('useCli', e.data);
            setTitulo('Correcto.')
            setTexto('Se sincronizó correctamente.')
        } catch (error) {
            console.log(error)
            if (error.response) {
                // The server responded with a status code outside the 2xx range
                setTitulo('Error desconocido')
                setTexto(error.response)

            } else if (error.request) {
                // The request was made but no response was received
                setTitulo('No hay respuesta del servidor')
                setTexto('Puede ser que no este conectado el servidor o la ip haya cambiado')

            } else {
                // Something happened in setting up the request that triggered an error
                setTitulo('Error desconocido')
                setTexto(error.response)

            }
        }
        setVisible(true)
    }

    const SyncProductos = async () => {
        try {
            const e = await apiClient.get(`/buscarProductos`)
            await useStore.setArrayAsync('useProd', e.data);

            const valoresUnicos = [...new Set(e.data.map(subArray => subArray[1]))];
            await useStore.setArrayAsync('useList', valoresUnicos);

            setTitulo('Correcto.')
            setTexto('Se sincronizó correctamente.')
        } catch (error) {
            if (error.response) {
                // The server responded with a status code outside the 2xx range
                setTitulo('Error desconocido')
                setTexto(error.response)

            } else if (error.request) {
                // The request was made but no response was received
                setTitulo('No hay respuesta del servidor')
                setTexto('Puede ser que no este conectado el servidor o la ip haya cambiado')

            } else {
                // Something happened in setting up the request that triggered an error
                setTitulo('Error desconocido')
                setTexto(error.response)

            }
        }
        setVisible(true)
    }

    const Guardar = async () => {
        try {
            await useStore.setStringAsync('useIp', useIp);
            await useStore.setStringAsync('usePtoventa', usePtoventa);
            await changeBaseURL()
            setTitulo('Correcto.')
            setTexto('Se guardó correctamente.')

        } catch (e) {
            setTitulo('Hmmm algo pasó')
            setTexto(e)
        }
        setVisible(true)
    }

    /*
    const RadioState = () => {
        return (
            <>
                <View
                    style={[styles.indicator, {
                        backgroundColor: chkImp ? '#229954' : '#a93226',
                        left: 15,
                        top: 8
                    }]}>
                </View>
                <Text
                    style={{ left: 22, top: 7 }}
                >
                    {chkImp ? 'Conectado' : 'Desconectado'}
                </Text>
            </>
        )
    }
    */

    const InputFactura = ({ value, onchange }) => {
        const [currentvalue, setcurrentvalue] = useState(value);
        return (
            <TextInput
                style={styles.input}
                value={currentvalue}
                keyboardType='numeric'
                placeholder="Ingrese el numero de factura"
                onChangeText={v => setcurrentvalue(v)}
                onEndEditing={() => onchange(currentvalue)}
            //onSubmitEditing={() => {
            //    }
            //}
            />
        );
    };

    const Reimprimir = async () => {
        if (await connectPrinter()) {
            try {
                let response = await apiClient.post(`reimprimir`,
                    {
                        Retext: Retext,
                        getPtoventa: usePtoventa,
                        radioSelect: radioSelect
                    })

                if (response.data.length !== 0) {
                    let title = ''
                    let fech = new Date(response.data[3][0].Fecha)
                    let dia = fech.getUTCDate().toString().padStart(2, '0');
                    let mes = (fech.getUTCMonth() + 1).toString().padStart(2, '0')
                    let ano = fech.getUTCFullYear();

                    let ppt = String(usePtoventa).padStart(4, '0')
                    let pptcmt = String(Retext).padStart(8, '0')
                    let fecha = `${dia}/${mes}/${ano}`

                    if (radioSelect === 1) {
                        title = 'Cod. 001 - FACTURA A'
                    } else {
                        title = 'Cod. 003 - NOTA DE CREDITO A'
                        response.data[3][0].Pan21 = response.data[3][0].Pan21.substring(1)
                        response.data[3][0].Iva21 = response.data[3][0].Iva21.substring(1)
                        response.data[3][0].Total = response.data[3][0].Total.substring(1)
                        response.data[4].forEach(e => {
                            e['Cantidad'] = e['Cantidad'].substring(1)
                            e['Precio_U'] = e['Precio_U'].substring(1)
                            e['Total'] = e['Total'].substring(1)
                        });
                    }

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
                        asyncPrintText(`${LEFT}${response.data[5][0].RazonS}`, waitTime++),
                        asyncPrintText(`CUIT Nro. ${response.data[3][0].Cuit}`, waitTime++),
                        asyncPrintText(`IVA ${response.data[5][0].Responsabilidad}`, waitTime++),
                        asyncPrintText(`${response.data[5][0].Direccion}`, waitTime++),
                        asyncPrintText(
                            `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                        response.data[4].forEach(e => {
                            let totalLength = 48
                            let spaces = totalLength - e.Producto.length - e.Total.length;
                            let result = e.Producto + ' '.repeat(spaces) + e.Total;
                            asyncPrintText(`${LEFT}${e.Cantidad} X ${e.Precio_U}`, waitTime++),
                                asyncPrintText(result, waitTime++)
                        }),
                        asyncPrintText(
                            `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}`, waitTime++),
                        asyncPrintText(`Subtotal: ${response.data[3][0].Pan21}`, waitTime++),
                        asyncPrintText(`IVA 21%: ${response.data[3][0].Iva21}`, waitTime++),
                        asyncPrintText(
                            `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR_80MM}`, waitTime++),
                        asyncPrintColumnsText(
                            ['', 'TOTAL $', '', `${response.data[3][0].Total}`],
                            [9, 9, 9, 9],
                            [ColumnAlignment.LEFT, ColumnAlignment.CENTER, ColumnAlignment.CENTER, ColumnAlignment.RIGHT],
                            ['', `${BOLD_ON}`, '', ''],
                            waitTime++,
                        ),
                        asyncPrintText(
                            `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR_80MM}`, waitTime++),
                        asyncPrintQr(response.data[6].slice(22), waitTime++),
                        asyncPrintBill(`${CENTER}CAE: ${response.data[0]}     CAE Vto: ${response.data[1]}`, waitTime++)
                    ])
                    setRetext('')
                } else if (response.data.length === 0) {
                    console.log('asd')
                }
                setTitulo('Comprobante inexistente')
                setTexto('El comprobante no existe, o la impresora está desconectada')
            }
            catch (error) {
                if (!visible) {
                    if (error.request) {
                        // The request was made but no response was received
                        setTitulo('No hay respuesta del servidor')
                        setTexto('Puede ser que no este conectado el servidor o la ip haya cambiado')
                    } else {
                        // Something happened in setting up the request that triggered an error
                        setTitulo('Error desconocido')
                        setTexto(String(error))
                    }
                    setVisible(true)
                }
            }
        } else {
            setTitulo('Error')
            setTexto('No se pudo imprimir, trate de volver a conectar la impresora')
            setVisible(true)
        }
    }

    function Impresora() {
        return (
            <View style={{ alignItems: 'center' }}>
                <Text variant="labelLarge" style={{ marginTop: '1%' }}>Seleccionar impresora</Text>
                <View style={{ flexDirection: 'row' }}>
                    <List.Section
                        style={{ width: '85%', top: '8%', left: '2%' }}
                    //title='Seleccione la impresora a utilizar:'
                    >
                        <List.Accordion
                            title={usePrinter ? usePrinter.device_name : 'No fue seleccionada ninguna impresora'}
                            left={props => <List.Icon {...props} icon="bluetooth" />}
                            expanded={expanded}
                            onPress={handlePress}>
                            {
                                poolPrinters.map(printer => (
                                    <List.Item key={printer.inner_mac_address}
                                        title={`${printer.device_name}`}
                                        onPress={() => {
                                            setPrinter(printer)
                                            useStore.setMap('usePrinter', printer);
                                            connectPrinter()
                                            setExpanded(false)
                                        }} />
                                ))
                            }
                        </List.Accordion>
                    </List.Section>
                    <View style={{ flexDirection: 'column', left: '1%' }}>
                        <IconButton
                            icon="check-bold"
                            size={21}
                            onPress={connectPrinter}
                        />
                        <IconButton
                            icon="cancel"
                            size={21}
                            onPress={Closeconnect}
                        />
                    </View>
                </View>

                <Divider style={{ width: '95%', height: 1.5 }} bold={true}></Divider>


                <Text variant="labelLarge" style={{ marginTop: '1.5%' }}>Reimprimir facturas</Text>
                <RadioButton.Group onValueChange={newValue => setRadioSelect(newValue)} value={radioSelect}>
                    <View style={{ width: '63%', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text>Factura A</Text>
                            <RadioButton value={1} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text>Nota de Credito A</Text>
                            <RadioButton value={3} />
                        </View>
                    </View>
                </RadioButton.Group>
                <View style={{ width: '85%', flexDirection: 'row', alignContent: 'center', left: '8%' }}>
                    <InputFactura
                        value={Retext}
                        onchange={(e) => {
                            setRetext(e)
                        }}>

                    </InputFactura>
                    <IconButton
                        icon="check-bold"
                        size={21}
                        onPress={Reimprimir}
                    />
                </View>

                <Divider style={{ width: '95%', height: 1.5, top: '3%' }} bold={true}></Divider>


                <Text variant="labelLarge" style={{ marginTop: '6.5%' }}>
                    Imprimir listado de precios
                </Text>
                <View style={{
                    left: '5%', flexDirection: 'row', alignContent: 'center', width: '80%'
                }}>
                    <List.Section style={{ width: '80%', height: '70%' }}>
                        <List.Accordion
                            title={useOpc}
                            left={props => <List.Icon {...props} />}>
                            {
                                useLista.map((rowData, index) => (
                                    <List.Item title={rowData}
                                        onPress={() => { setOpc(rowData) }} />
                                ))
                            }
                        </List.Accordion>
                    </List.Section>
                    <IconButton
                        icon="check-bold"
                        size={21}
                        onPress={setvalLista}
                        style={{ top: '10%' }}
                    />

                </View>

            </View>
        )
    }

    function Sync() {
        return (
            <View style={{
                flexDirection: 'column', alignContent: 'center', gap: '10%', marginTop: '5%',
                alignItems: 'center'
            }}>
                <Button
                    style={{ maxWidth: 300 }}
                    icon="account-search" mode="outlined"
                    onPress={SyncClientes}>
                    Sincronizar Clientes
                </Button>
                <Button
                    style={{ maxWidth: 300 }}
                    icon="archive-search" mode="outlined"
                    onPress={SyncProductos}>
                    Sincronizar Productos
                </Button>
            </View>
        )
    }

    function Config() {
        return (
            <View style={{ gap: '10%', margin: '5%' }}>
                <InputIp
                    value={useIp}
                    onchange={setIp}
                ></InputIp>
                <InputPtoVenta
                    value={usePtoventa}
                    onchange={(e) => { setPtoventa(e) }}
                ></InputPtoVenta>
                <Button
                    style={{ width: '50%', marginHorizontal: '28%' }}
                    mode='contained'
                    onPress={() => Guardar()}>
                    Guardar
                </Button>
            </View>
        )
    }

    const InputIp = ({ value, onchange }) => {
        const [currentvalue1, setcurrentvalue1] = useState(value);

        return (

            <TextInput
                label="Ip"
                keyboardType='numeric'
                onChangeText={v => { setcurrentvalue1(v) }}
                onEndEditing={() => { onchange(currentvalue1) }}
                value={currentvalue1}
            />

        )
    }

    const InputPtoVenta = ({ value, onchange }) => {
        const [currentvalue, setcurrentvalue] = useState(value);

        return <TextInput
            label="Pto de venta"
            keyboardType='numeric'
            onChangeText={v => { setcurrentvalue(v) }}
            onEndEditing={() => onchange(currentvalue)}
            value={currentvalue}
        />


    }

    function Cuerpo() {
        if (value === 'Printer') {
            return <Impresora></Impresora>
        } else if (value === 'Sync') {
            return <Sync></Sync>
        } else if (value === 'Config') {
            return <Config></Config>
        }
    }

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


    return (
        <View style={{}}>
            <SegmentedButtons
                style={{ margin: 13 }}
                value={value}
                onValueChange={setValue}
                buttons={[
                    {
                        icon: 'printer',
                        value: 'Printer',
                        label: 'Impresora',
                    },
                    {
                        icon: 'cloud-sync',
                        value: 'Sync',
                        label: 'Sincronizar',
                    },
                    {
                        icon: 'cloud-sync',
                        value: 'Config',
                        label: 'Configuracion',
                    },
                ]}
            />
            <Cuerpo></Cuerpo>
            <Alerta></Alerta>
        </View>
    )
}


const styles = StyleSheet.create({
    Surface: {
        marginLeft: 15,
        marginTop: 5,
        height: 350,
        width: 360,
    },
    container: { flex: 1, padding: 16, paddingTop: 30, backgroundColor: '#fff' },
    header: { height: 40, backgroundColor: '#f1f8ff' },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        width: '80%',
        paddingHorizontal: 10,
    },
    indicator: {
        width: 20,
        height: 20,
        borderRadius: 10, // Esto hace que el View sea un círculo
        marginBottom: 10,
    },

})