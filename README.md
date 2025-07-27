# FacturadorLaPrimera-ReactNative

Initial project for issuing online invoices via mobile device, connected via Bluetooth to a (non-fiscal) printer to generate physical receipts.

The initial idea is to use the same database currently used by the company. Therefore, a file called Servidor.js is provided, which acts as a "server" to handle requests for generating invoices using PyAfipWs.

You just need to modify some company-specific details in the Servidor.js file and then run it with Node.

(This product was designed for a Spanish-speaking company)

### Features:
- Already connects to AFIP to request the latest issued invoice (for security reasons, the .crt and .key files that go in the root folder of the app have been removed)

- Searches for Bluetooth devices that the mobile phone already recognizes to enable pairing

- Invoices generate CAE and include QR codes (according to regulations from the Argentinian authority)

- Searches for clients and products with their prices in the database, configured from the Servidor.js file

- Selected data within the app is dynamically stored in the device's memory

- Can also reprint previously generated invoices

- One-click price and client synchronization

- Alerts and errors when there is no connection



### Images (Reminder: everything is still in progress):

![](https://i.imgur.com/vnQU62C.png)

All images available at: https://imgur.com/a/Y3qqIyL


## License
[MIT](https://choosealicense.com/licenses/mit/)
