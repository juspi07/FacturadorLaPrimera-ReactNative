import { MMKVLoader } from "react-native-mmkv-storage";

import axios from "axios";

const puerto = '3001'



export const changeBaseURL = async () => {
  apiClient.defaults.baseURL = `http://${await useStore.getStringAsync('useIp') || ''}:${puerto}`;
};

export const useStore = new MMKVLoader().initialize();

//useStore.clearStore();

export const apiClient =  axios.create({
    baseURL: `http://${useStore.getString('useIp') || ''}:${puerto}`, // URL base para todas las solicitudes
    timeout: 5000, // Tiempo de espera predeterminado (en milisegundos)
    headers: {'Content-Type': 'application/json;charset=utf-8'}
  })


//const useStore = create(MMKV)

// export default {useStore, apiClient}
