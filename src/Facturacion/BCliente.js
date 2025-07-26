import { useState, React} from 'react';
import { IconButton, Text} from 'react-native-paper';
import { StyleSheet, ScrollView } from 'react-native';
import { Table, Row, TableWrapper, Cell } from 'react-native-reanimated-table';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';

import { useStore } from '../store'

export default function BCliente({ navigation, route }) {
    const [useCli, setCli] = useState(useStore.getArray('useCli') || [])

    let stateCli = {
        tableHead: ['Razon Social', ''],
        widthArr: [260, 80]
    }

    return <>
            <Text
                variant="titleMedium"
                style={{ textAlign: 'center', margin: wp('1%') }}>
                Buscar Cliente..
            </Text>
            
            <Table style={(route.params.CoefDpi == 3) ? styles.TablaXXH : styles.TablaXXXH} borderStyle={{ borderWidth: 0, borderColor: '#94c5ff' }}>
                <Row data={stateCli.tableHead} widthArr={stateCli.widthArr} 
                    style={(route.params.CoefDpi == 3) ? styles.headerXXH : styles.headerXXXH} textStyle={styles.textTitle} />
                <ScrollView style={styles.dataWrapper}>
                    {
                        useCli.map((rowData, index) => (
                            <TableWrapper key={index} style={(route.params.CoefDpi == 3) ? styles.RowTXXH : styles.RowTXXXH}> 
                                {
                                    rowData.map((cellData, cellIndex) => {
                                        if (cellIndex === 1) {
                                            if (route.params.CoefDpi == 3) {
                                                if (cellData.length >= 21 ) {
                                                    cellData = cellData.slice(0, 20) + ' ...'
                                                }
                                            } else {
                                                if (cellData.length >= 35 ) {
                                                    cellData = cellData.slice(0, 34) + ' ...'
                                                }
                                            }
                                            

                                            return <Cell style={(route.params.CoefDpi == 3) ? styles.RowXXH : styles.RowXXXH}
                                                key={cellIndex} data={cellData + '\n' + rowData[0]} textStyle={styles.text} />
                                        }
                                        if (cellIndex === 3) {
                                            return <Cell key={cellIndex} data={<IconButton style={styles.btn}
                                                rippleColor='#E7E6E1' icon='check'
                                                onPress={() => {
                                                    navigation.navigate('StackFacturacion',
                                                        { cliente: rowData },
                                                    );
                                                }}
                                            />} textStyle={styles.text} />
                                        }
                                        else {
                                            return <></>
                                        }
                                    })
                                }
                            </TableWrapper>
                        ))
                    }
                </ScrollView>
            </Table>
            </>
        
    
}

const styles = StyleSheet.create({ 
    TablaXXH:{height: hp('84%'), alignItems:'center'},//width:wp('90%'), marginLeft:wp('3%')},
    TablaXXXH:{height: hp('84%'), alignItems:'center', maxWidth:wp('100%')},
    RowXXH: {width: wp('59%')},
    RowXXXH: {width: wp('52%')},
    text: { margin: wp('1.5%') },
    btn: { left: wp('16%')},
    RowTXXH: { flexDirection: 'row', height: hp('7.1%'), backgroundColor: '#E7E6E1', width: wp('94%') },
    RowTXXXH: { flexDirection: 'row', height: hp('6.1%'), backgroundColor: '#E7E6E1', width: wp('81.5%') },
    headerXXH: { height: hp('4.5%'), backgroundColor: '#e2f1ff' },
    headerXXXH: { height: hp('4%'), backgroundColor: '#e2f1ff' },
    textTitle: { textAlign: 'center', fontWeight: 'bold' },
    dataWrapper: { marginRight: wp('-1%'), marginTop: wp('0.3%') },
})