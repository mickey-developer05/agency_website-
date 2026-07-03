const http = require('http');
http.get('http://localhost:3000/admin/', (res) => {
  console.log('STATUS:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
});
