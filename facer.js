var express = require("express");
var logfmt = require("logfmt");
var canvas = require("canvas");
var facedetect = require("face-detect");
var fs = require('fs');

var app = express();

var buffer = new canvas(640, 480), ctx = buffer.getContext('2d');

app.use(logfmt.requestLogger());
app.use(express.bodyParser());

app.get('/', function(req, res) {
    res.send('<html><body><h1>Facer</h1><form method="post" enctype="multipart/form-data"><input type="file" name="image" id="id_image"><br/><br/><input type="submit" value="submit"></body></html>');
});

app.get('/image', function(req, res) {
    var stream = buffer.createPNGStream();
    res.writeHead(200, {'Content-Type':'image/png'});
    stream.pipe(res);
});

app.post('/', function(req, res) {
    fs.readFile(req.files.image.path, function(err, src) {
        if (err) throw(err);
        var img = new canvas.Image();

        img.onload = function() {
            buffer = new canvas(img.width, img.height)
            ctx = buffer.getContext('2d');

            ctx.drawImage(img, 0, 0, img.width, img.height);

            var result = facedetect.detect_objects(
                { "canvas" : buffer,
                  "interval" : 5,
                  "min_neighbors" : 1 });

            console.log("Found " + result.length + " faces.");

            for (var i = 0; i < result.length; i++) {
                ctx.beginPath();
                ctx.lineWidth = "2";
                ctx.strokeStyle = "red";
                ctx.rect(result[i].x, result[i].y, result[i].width, result[i].height);
                ctx.stroke();
                console.log(result[i]);
            }
            res.send(JSON.stringify(result));
        }

        img.onerror = function(e1, e2) {
            console.log("Image did not load properly");
            res.send("Image did not load properly.  Currently only PNG files appear to work.");
        }

        img.src = src;

    });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
