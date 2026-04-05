const http = require('http');
const fs = require('fs');

const boundary = '----testboundary';
const sql = `CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    fecha_registro DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    categoria_id INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha_pedido DATE NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE detalle_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);`;

const parts = [
  `--${boundary}\r\nContent-Disposition: form-data; name="sql"\r\n\r\n${sql}\r\n`,
  `--${boundary}\r\nContent-Disposition: form-data; name="rowCount"\r\n\r\n5\r\n`,
  `--${boundary}--\r\n`,
];
const body = parts.join('');

const req = http.request(
  {
    hostname: 'localhost',
    port: 3001,
    path: '/generator/generate',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      fs.writeFileSync('result.txt', data, 'utf8');
      console.log('Status: ' + res.statusCode);
      // Print line by line to avoid terminal wrapping issues
      data.split('\n').forEach((line) => console.log(line));
    });
  },
);

req.write(body);
req.end();
