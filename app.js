var formidable = require('formidable'),
	http = require('http'),
	util = require('util'),
	knox = require('knox'),
	router = require('router'),
	libpath = require('path'),
	fs = require('fs'),
    url = require("url"),
    mime = require('mime');

var route = router();

var client = knox.createClient({ 
    key: '', 
    secret: '',
    bucket: ''
});
	
	
function pushToS3(files, orig_res) {
	var file_name = (new Date().valueOf() + files.upload.name)
	client.putFile(files.upload.path, file_name, 
		{ 'Content-Length': files.upload.size
  		, 'Content-Type': files.upload.type }, function(err, res){
	  		
	  if(err) console.log('Something bad happened putting file on S3');
	  if(!err) console.log('File successfuly put file on S3');

	});
}

function getFromS3(id, orig_res) {
	client.getFile(id, function(err, res){
	  if(err) console.log('Something bad happened getting file from S3' + res);
	  if(!err) console.log('File successfuly fetched from S3 ' + res.statusCode);
	 	  
	  orig_res.writeHead(res.statusCode, {'content-type': res.headers['content-type'] });
	  
	  res.on('data', function(chunk) {
	    orig_res.write(chunk);
	  });
	  
	  res.on('end', function() {
	    orig_res.end();
	  });
	  
	});
}


route.get('/image/{id}', function(req, res) {
	var id = req.params.id;
	console.log('DEBUG: matching /image/' + id);
	
	getFromS3(id, res);
});

route.post('/upload', function(req, res) {
	// parse a file upload
	var form = new formidable.IncomingForm();

	form.uploadDir = 'images';
	form.maxFieldsSize = 500 * 1024 * 1024;

	form.parse(req, function(err, fields, files) {
	  pushToS3(files, res);
	});

	form.on('progress', function(bytesReceived, bytesExpected) {
	  var percent = (bytesReceived/bytesExpected * 100).toString();
	  console.log(Math.ceil(percent) + '% of ' + bytesExpected);
	});

	form.on('end', function() {
        res.writeHead(302, {'Location': '/index.html'});
		res.end();
	});



});

route.get('/list', function(req, res) {
	client.list({ prefix: '' }, function(err, data){

		res.writeHead(200, {'content-type': 'application/json'});
		res.end(JSON.stringify(data.Contents));
	});
	
});


route.get('/*', function(req, res) {
	var uri = url.parse(req.url).pathname;
    var filename = libpath.join('./public/', uri);

	fs.exists(filename, function (exists) {
        if (!exists) {
            res.writeHead(404, {
                "Content-Type": "text/plain"
            });
            res.write("404 Not Found\n");
            res.end();
            return;
        }
 
        if (fs.statSync(filename).isDirectory()) {
            filename += '/index.html';
        }
 
        fs.readFile(filename, "binary", function (err, file) {
            if (err) {
                response.writeHead(500, {
                    "Content-Type": "text/plain"
                });
                res.write(err + "\n");
                res.end();
                return;
            }
 
            var type = mime.lookup(filename);
            res.writeHead(200, {
                "Content-Type": type
            });
            res.write(file, "binary");
            res.end();
        });
    });

});

http.createServer(route).listen(3000);
