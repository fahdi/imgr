var formidable = require('formidable'),
	http = require('http'),
	util = require('util'),
	knox = require('knox'),
	router = require('router');

var route = router();

var client = knox.createClient({ 
	key: '', 
	secret: '', 
	bucket: '' 
	})
	
	
function pushToS3(files, orig_res) {
	var file_name = (new Date().valueOf() + files.upload.name)
	client.putFile(files.upload.path, file_name, 
		{ 'Content-Length': files.upload.size
  		, 'Content-Type': files.upload.type }, function(err, res){
	  		
	  if(err) console.log('Something bad happened putting file on S3')
	  if(!err) console.log('File successfuly put file on S3')
	  
	  orig_res.writeHead(200, {'content-type': 'application/json'});
	  
	  var obj = {}
	  obj.status_code = res.statusCode
	  obj.file_name = file_name
	  obj.location = 'https://s3.amazonaws.com/mcottondesign_images/' + file_name  
	  orig_res.end(JSON.stringify(obj))
	});
}

function getFromS3(id, orig_res) {
	client.getFile(id, function(err, res){
	  if(err) console.log('Something bad happened getting file from S3' + res)
	  if(!err) console.log('File successfuly fetched from S3 ' + res.statusCode)
	 	  
	  orig_res.writeHead(res.statusCode, {'content-type': res.headers['content-type'] });
	  
	  res.on('data', function(chunk) {
	    orig_res.write(chunk);
	  });
	  
	  res.on('end', function() {
	    orig_res.end();
	  });
	  
	});
}


route.get('/', function(req, res) {
	// show a file upload form
	res.writeHead(200, {'content-type': 'text/html'});
	res.end(
	  '<form action="/upload" enctype="multipart/form-data" method="post">'+
	  '<input type="file" accept="image/*" capture="camera" name="upload"><br>' +
	  '<input type="submit" value="Upload">'+
	  '</form>'
	);
})

route.get('/image/{id}', function(req, res) {
	var id = req.params.id;
	console.log('DEBUG: matching /image/' + id)
	
	getFromS3(id, res)
})

route.post('/upload', function(req, res) {
	// parse a file upload
	var form = new formidable.IncomingForm();

	form.uploadDir = 'images'
	form.maxFieldsSize = 5 * 1024 * 1024;

	form.parse(req, function(err, fields, files) {
	  pushToS3(files, res)
	});

	form.on('progress', function(bytesReceived, bytesExpected) {
	  var percent = (bytesReceived/bytesExpected * 100).toString()
	  console.log(Math.ceil(percent) + '% of ' + bytesExpected)
	});

})

route.get('/list', function(req, res) {
	client.list({ prefix: '' }, function(err, data){

		res.writeHead(200, {'content-type': 'application/json'});
		res.end(JSON.stringify(data.Contents));
	});
	
})

http.createServer(route).listen(3000);
