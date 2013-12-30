var express = require("express");
var logfmt = require("logfmt");

var ref = require('ref');
var struct = require('ref-struct');
var ffi = require('ffi');

var libNLicense = ffi.Library('lib/libNLicensing', { 
    'NLicenseObtainA' : [ 'int', [ 'string', 'string', 'string', ref.refType('bool') ] ],
    'NLicenseReleaseA' : [ 'int', [ 'string', 'string', 'string', ref.refType('bool') ] ],
    'NLicenseObtainComponentsA' : [ 'int', [ 'string', 'string', 'string', ref.refType('bool') ] ],
    'NLicenseReleaseComponentsA' : [ 'int', [ 'string' ] ]
});
var libNMedia = ffi.Library('lib/libNMedia', {
    'NImageCreateFromFileExA': [ 'int', [ 'string', 'pointer', 'long', 'pointer', 'pointer' ] ],
    'NImageToGrayscale' : [ 'int', [ 'pointer', 'pointer' ] ]
});

var libNBiometrics = ffi.Library('lib/libNBiometrics', {
    'NObjectSetParameterWithPartEx' : [ 'int', [ 'pointer', 'short', 'int', 'int', 'pointer', 'long' ] ],
    'NleCreate' : [ 'int', [ 'pointer' ] ],
    'NleDetectFaces' : [ 'int', [ 'pointer', 'pointer', ref.refType('int'), 'pointer' ] ]
});

var pAvailable = ref.alloc('bool');
var components = "Biometrics.FaceDetection,Biometrics.FaceExtraction";
var result = libNLicense.NLicenseObtainComponentsA("99.225.93.59", "5000", components, pAvailable);

if(result == -14) {
    console.log('Could not contact license server: ' + result);
} else if(result < 0) {
    console.log('License activation failed: ' + result);
    return;
}
if(!pAvailable.deref())
{
    console.log('Licenses for ' + components + ' not available');

    //while(result >= 0)
    //{
    //    console.log("Releasing components");
    //    result = libNLicense.NLicenseReleaseComponentsA(components);
    //}
} else {
    console.log('Licensing succeeded!');
}

var app = express();


app.use(logfmt.requestLogger());
app.use(express.bodyParser());

app.get('/', function(req, res) {
    res.send('<html><body><h1>Facer</h1><form method="post" enctype="multipart/form-data"><input type="file" name="image" id="id_image"><br/><br/><input type="submit" value="submit"></body></html>');
});

app.get('/image', function(req, res) {
});

app.post('/', function(req, res) {
    var pImage = ref.alloc('pointer');
    var pGrayscale = ref.alloc('pointer');
    var result = libNMedia.NImageCreateFromFileExA(req.files.image.path, null, 0, null, pImage);
    if(result < 0)
    {
        res.status(500).send('Could not load image file.');
    }

    result = libNMedia.NImageToGrayscale(pImage.deref(), pGrayscale);
    if(result < 0)
    {
        res.status(500).send('Could not convert image to grayscale.');
    }

    pExtractor = ref.alloc('pointer');
    result = libNBiometrics.NleCreate(pExtractor);
    if(result < 0)
    {
        res.status(500).send('Could not load face detector.');
    }

    var faceCount = ref.alloc('int');
    var faces = ref.alloc('pointer');
    result = libNBiometrics.NleDetectFaces(pExtractor.deref(), pGrayscale.deref(), faceCount, faces);
    debugger;
    if(result == -200)
    {
        res.status(500).send("Error: problems acquiring license: " + result);
    } else if(result < 0)
    {
        res.status(500).send("Face detection failed with error " + result);
    }

    res.send("Found " + faces.deref() + " faces.");
});

var port = process.env.PORT || 5001;
app.listen(port, function() {
    console.log("Listening on " + port);
});
