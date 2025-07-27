const { Afip } = require('afip.ts');
const cors = require('cors');
const mysql = require("mysql2/promise");
const express = require('express');
const date = require('date-and-time')
const bodyparser = require('body-parser');
const QRCode = require('qrcode')
const fs = require('fs')

/* ------- DATOS PARA AFIP ------ */

const url = 'https://www.afip.gob.ar/fe/qr/'

const Cuit = //Ingresar cuit de la empresa

const afip = new Afip({
	production: false,
	cert: fs.readFileSync('cambiar por certificado', "utf-8"),
	key: fs.readFileSync('cambiar por key', "utf-8"),
	//cert: fs.readFileSync('./productioncrt.crt', "utf-8"),
	//key: fs.readFileSync('./productionKEY.key', "utf-8"),
	cuit: Cuit,
});


/* ------- DATOS PARA AFIP ------ */


var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cors({
	origin: '*'
}));

const connection = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: '1234',
	multipleStatements: true
});

connection.getConnection((err) => {
	if (!err)
		console.log('DB connection succeded.');
	else
		console.log('DB connection failed \n Error : ' + JSON.stringify(err, undefined, 2));
});


app.post('/facturacion', async (req, res) => {
	let arr = []
	let comp = ''
	let date = new Date(Date.now() - ((new Date()).getTimezoneOffset() * 60000)).toISOString().split('T')[0]

	let cliente = req.body['cliente']
	let Cuitcliente = cliente[0].replace(/-/g, "")
	let total = req.body['total']
	let tipo = req.body['tipo']
	let NroFact = req.body['NroFact']
	let PtoVta = req.body['ptoventa']
	let items = req.body['items']

	let formatfact = `${String(PtoVta).padStart(4, '0')}-${String(NroFact).padStart(8, '0')}`

	// Calculos de neto e iva
	neto = (parseFloat(req.body['total']) / 1.21).toFixed(2)
	iva = (parseFloat(req.body['total']) - neto).toFixed(2)

	// Info del comprobante
	let data = {
		'CantReg': 1,  // Cantidad de comprobantes a registrar
		'PtoVta': PtoVta,  // Punto de venta
		'CbteTipo': tipo,  // Tipo de comprobante (ver tipos disponibles) 
		'Concepto': 1,  // Concepto del Comprobante: (1)Productos, (2)Servicios, (3)Productos y Servicios
		'DocTipo': 80, // Tipo de documento del comprador (99 consumidor final, ver tipos disponibles)
		'DocNro': parseInt(Cuitcliente),  // Número de documento del comprador (0 consumidor final)
		'CbteDesde': parseInt(NroFact),  // Número de comprobante o numero del primer comprobante en caso de ser mas de uno
		'CbteHasta': parseInt(NroFact),  // Número de comprobante o numero del último comprobante en caso de ser mas de uno
		'CbteFch': parseInt(date.replace(/-/g, '')), // (Opcional) Fecha del comprobante (yyyymmdd) o fecha actual si es nulo
		'ImpTotal': parseFloat(total), // Importe total del comprobante
		'ImpTotConc': 0,   // Importe neto no gravado
		'ImpNeto': parseFloat(neto), // Importe neto gravado
		'ImpOpEx': 0,   // Importe exento de IVA
		'ImpIVA': parseFloat(iva),  //Importe total de IVA
		'ImpTrib': 0,   //Importe total de tributos
		'MonId': 'PES', //Tipo de moneda usada en el comprobante (ver tipos disponibles)('PES' para pesos argentinos) 
		'MonCotiz': 1,     // Cotización de la moneda usada (1 para pesos argentinos)  
		'CondicionIVAReceptorId': 1,
		'Iva': [ // (Opcional) Alícuotas asociadas al comprobante
			{
				'Id': 5, // Id del tipo de IVA (5 para 21%)(ver tipos disponibles) 
				'BaseImp': parseFloat(neto), // Base imponible importe neto gravado
				'Importe': parseFloat(iva) // Importe total IVA
			}
		],
	};

	if (tipo === 3) {
		let NroFactD = req.body['NroFactD']
		comp = 'Ncred. A'
		data = {
			...data, 'CbtesAsoc': [ //Factura asociada
				{
					'Tipo': 1,
					'PtoVta': PtoVta,
					'Nro': NroFactD,
				}
			],
		}
	} else {
		comp = 'Fact.A'
	}
	const fact = await afip.electronicBillingService.createVoucher(data);

	if (fact['response']['Errors']) {
		console.log(fact['response']['Errors']['Err'][0]['Msg'])
	}
	if (fact['response']['FeDetResp']['FECAEDetResponse'][0]['Observaciones']) {
		console.log(fact['response']['FeDetResp']
		['FECAEDetResponse'][0]['Observaciones']['Obs'][0]['Msg'])
	}

	if (fact) {
		let qry = ''
		if (tipo === 3) {
			qry = `INSERT INTO negocio.ventas (Fecha, Comprobante, N_fact, Cuit, Pan105, Pan21, Exento, Iva105, Iva21, Otros, Total) VALUES ('${date.replace(/\//g, '-')}','${comp}','${formatfact}','${cliente[0]}','0.00','-${neto}','0.00','0.00','-${iva}','0.00','-${total}');`
			for (let index = 0; index < items.length; index++) {
				let elem = items[index]
				qry = qry.concat(
					`INSERT INTO negocio.venta_productos (N_fact, Comprobante, Producto, Cantidad, Precio_U, Cambio, Total) VALUES ('${formatfact}', '${comp}', '-${elem[0]}', '-${elem[1]}', '-${elem[2]}', '0', '-${elem[3]}');`
				)
			}
		} else {
			qry = `INSERT INTO negocio.ventas (Fecha, Comprobante, N_fact, Cuit, Pan105, Pan21, Exento, Iva105, Iva21, Otros, Total) VALUES ('${date.replace(/\//g, '-')}','${comp}','${formatfact}','${cliente[0]}','0.00','${neto}','0.00','0.00','${iva}','0.00','${total}');`

			for (let index = 0; index < items.length; index++) {
				let elem = items[index]
				qry = qry.concat(
					`INSERT INTO negocio.venta_productos (N_fact, Comprobante, Producto, Cantidad, Precio_U, Cambio, Total) VALUES ('${formatfact}', '${comp}', '${elem[0]}', '${elem[1]}', '${elem[2]}', '0', '${elem[3]}');`
				)
			}
		}

		try {
			let [results, fields] = await connection.query(qry);
		} catch (err) {
			console.log(err);
		}

		var cuerpo = `{"ver":1,"fecha":"${date}","cuit":${Cuit},"ptoVta":${PtoVta},"tipoCmp":${tipo},"nroCmp":${parseInt(NroFact)},"importe":${total.replace('.', '')},"moneda":"PES","ctz":1,"tipoDocRec":80,"nroDocRec":${parseInt(Cuitcliente)},"tipoCodAut":"E","codAut":${fact['cae']}}`

		var to_qrurl = url + '?p=' + Buffer.from(cuerpo).toString('base64');

		const ano = fact['caeFchVto'].substring(0, 4);
		const mes = fact['caeFchVto'].substring(4, 6);
		const dia = fact['caeFchVto'].substring(6, 8);
		const cadenaFecha = `${dia}/${mes}/${ano}`

		var opts = {
			errorCorrectionLevel: 'L',
			type: 'image/jpeg',
			scale: 4,
			quality: 0.98
		}

		QRCode.toDataURL(to_qrurl, opts, function (err, url) {
			if (err) throw err
			arr[0] = url
			arr[1] = fact['cae']
			arr[2] = cadenaFecha
			arr[3] = neto
			arr[4] = iva
			res.send(arr);
		})
	}
})

app.get('/getFecha', async (req, res) => {
	const now = new Date();
	const fecha = date.format(now, "DD/MM/YYYY")
	var arr = []
	arr[0] = fecha
	res.send(arr);
});

app.post('/getLastVoucher', async (req, res) => {
	let arr = []
	let tipo = parseInt(req.body['tipo'])
	let ptoventa = parseInt(req.body['ptoventa'])
	try {
		arr = await afip.electronicBillingService.getLastVoucher(ptoventa, tipo)
	} catch (error) {
		console.log(error)
	}
	res.send(arr);
});

app.post('/getVoucher', async (req, res) => {
	let arr = []
	let Retext = parseInt(req.body['Retext'])
	let getPtoventa = parseInt(req.body['getPtoventa'])
	let radioSelect = parseInt(req.body['radioSelect'])
	arr = await afip.electronicBillingService.getVoucherInfo(
		Retext, getPtoventa, radioSelect)
	res.send(arr);
});

app.get('/buscarFactura', (req, res) => {
	let arr = []
	const nro = req.query['nro']
	const pto = req.query['pto']
	const tipo = req.query['tipo']

	const qry = 'SELECT RazonS, Alias, Cuit, Direccion, Responsabilidad, Lista, \
		Descuento, Recargo FROM camioneta.clientes'

	connection.query(qry, function (err, result) {
		if (err) throw err;
	});

	res.send(arr)
})

app.get('/buscarCliente', async (req, res) => {
	try {
		const qry = 'SELECT RazonS, Alias, Cuit, Direccion, Responsabilidad, Lista, \
			Descuento, Recargo, Duplicado FROM camioneta.clientes ORDER BY RazonS'
		const [rows, fields] = await connection.query(qry)

		var arr = []
		for (let i = 0; i < rows.length; i++) {
			arr[i] = [];
			arr[i][0] = rows[i].Cuit
			arr[i][1] = rows[i].RazonS
			arr[i][2] = rows[i].Alias
			arr[i][3] = ''
			arr[i][4] = rows[i].Direccion
			arr[i][5] = rows[i].Responsabilidad
			arr[i][6] = rows[i].Lista
			arr[i][7] = rows[i].Descuento
			arr[i][8] = rows[i].Recargo
			arr[i][9] = rows[i].Duplicado
		}
		res.send(arr);

	} catch (err) {
		console.log(err)
	}
});


app.get('/buscarProductos', async (req, res) => {
	try {
		const query = 'SELECT * FROM camioneta.productos ORDER BY Nombre'
		const [rows, field] = await connection.query(query)
		var arr = []
		for (let i = 0; i < rows.length; i++) {
			arr[i] = [];
			arr[i][0] = rows[i].Nombre
			arr[i][1] = rows[i].Lista
			arr[i][2] = rows[i].Precio
			arr[i][3] = rows[i].Iva
		}
		res.send(arr);
	} catch (err) {
		console.log(err)
	}
});



app.post('/searchPrice', (req, res) => {
	let array = []
	let query = 'SELECT Nombre, Precio, Iva FROM camioneta.productos WHERE Lista LIKE ?'
	connection.query(query, [req.body['lista']], (err, rows) => {
		req.body['productos'].forEach(ex => {
			rows.forEach(e => {
				if (ex[0] === e.Nombre) {
					let preciu = (parseFloat(e.Precio) / (1 + parseFloat(e.Iva) / 100)).toFixed(6)
					let total = (parseFloat(preciu) * Number(ex[1])).toFixed(2)
					array.push([
						ex[0],
						ex[1],
						total])
				}
			});
		});
		res.send(array)
	})
});

app.post('/reimprimir', async (req, res) => {
	try{
	let arr = []
	let Retext = parseInt(req.body['Retext'])
	let getPtoventa = parseInt(req.body['getPtoventa'])
	let radioSelect = parseInt(req.body['radioSelect'])
	arr = await afip.electronicBillingService.getVoucherInfo(
		Retext, getPtoventa, radioSelect)

	if (arr.Errors) {
		if (arr.Errors.Err.Code = 602) {
			arr = 'NO EXISTE CAE'
		} else {
			arr = arr.Errors.Err.Msg
		}
		res.send(arr);
	} else {
		let CAE = arr.ResultGet.CodAutorizacion
		let CAEFecha = arr.ResultGet.FchVto.slice(-2) + '/' +
			arr.ResultGet.FchVto.slice(-4, -2) + '/' + arr.ResultGet.FchVto.slice(0, 4)

		let fact = `${String(getPtoventa).padStart(4, '0')}-${String(Retext).padStart(8, '0')}`

		if (radioSelect == 1) {
			var qry1 = 'SELECT Fecha, N_fact, Cuit, Pan21, Iva21, Total\
					FROM negocio.ventas WHERE N_fact LIKE ? AND Comprobante LIKE "Fact.A"'
			var aux = 'Fact.A'
		} else {
			var qry1 = 'SELECT Fecha, N_fact, Cuit, Pan21, Iva21, Total\
					FROM negocio.ventas WHERE N_fact LIKE ? AND Comprobante LIKE "Ncred. A"'
			var aux = 'Ncred. A'
		}

		var [factura, fields] = await connection.query(qry1, [fact])

		if (factura.length !== 0) {
			const qry2 = 'SELECT Producto, Cantidad, Precio_U, Total FROM negocio.venta_productos\
					WHERE N_fact LIKE ? and Comprobante LIKE ?'
			var [factProd, fields] = await connection.query(qry2, [fact, aux])

			//console.log(fact, aux)
			//console.log(factProd)

			if (factProd.lenght !== 0) {
				const qry3 = 'SELECT RazonS, Direccion, Responsabilidad FROM negocio.clientes\
						WHERE Cuit LIKE ?'
				var [cliente, fields] = await connection.query(qry3, [factura[0]['Cuit']])

				let envio = []

				envio.push(CAE, CAEFecha, fact, factura, factProd, cliente)

				let date = new Date(factura[0]['Fecha'] - ((new Date()).getTimezoneOffset() * 60000)).toISOString().split('T')[0]

				var cuerpo = `{"ver":1,"fecha":"${date}","cuit":${Cuit},"ptoVta":${getPtoventa},"tipoCmp":${radioSelect},"nroCmp":${parseInt(Retext)},"importe":${(factura[0]['Total']).replace('-', '')},"moneda":"PES","ctz":1,"tipoDocRec":80,"nroDocRec":${parseInt(factura[0]['Cuit'].replace(/-/g, ""))},"tipoCodAut":"E","codAut":${CAE}}`

				var to_qrurl = url + '?p=' + Buffer.from(cuerpo).toString('base64');


				var opts = {
					errorCorrectionLevel: 'L',
					type: 'image/png',
					scale: 4,
					quality: 0.98
				}

				QRCode.toDataURL(to_qrurl, opts, function (err, url) {
					if (err) throw err
					envio.push(url)
					res.send(envio)
				})
			} else {
				res.send([])
			}
		} else {
			res.send([])
		}
	}} catch {
		null
	}
});





// Starting our server.
app.listen(3001, () => {
	console.log('Funcionando');
});