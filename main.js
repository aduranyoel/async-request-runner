const
    express = require('express'),
    path = require('path'),
    app = express(),
    fileUpload = require('express-fileupload');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(fileUpload({}));
app.use('/', express.static(path.join(__dirname, 'static')));
app.use('/run', require(path.join(__dirname, 'routes')));
app.listen(3000, () => console.log('server running in port 3000'));
