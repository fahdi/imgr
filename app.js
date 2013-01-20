var formidable = require('formidable'),
	http = require('http'),
	util = require('util'),
	knox = require('knox');

var client = knox.createClient({ 
	key: '', 
	secret: '', 
	bucket: '' 
	})
	
	

function pushToS3(files) {
	client.putFile(files.upload.path, (new Date().valueOf() + files.upload.name), 
		{ 'Content-Length': files.upload.size
  		, 'Content-Type': files.upload.type }, function(err, res){
	  		
	  if(err) console.log('Something bad happened putting file on S3')
	  if(!err) console.log('File successfuly put file on S3')
	});
}


http.createServer(function(req, res) {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
	// parse a file upload
	var form = new formidable.IncomingForm();
	
	form.uploadDir = 'images'
	form.maxFieldsSize = 5 * 1024 * 1024;

	form.parse(req, function(err, fields, files) {
	  res.writeHead(200, {'content-type': 'text/plain'});
	  res.write('received upload:\n\n');
	  res.end(util.inspect({fields: fields, files: files}));
	  
	  pushToS3(files)
	  
	});
	
	form.on('progress', function(bytesReceived, bytesExpected) {
	  var percent = (bytesReceived/bytesExpected * 100).toString()
	  console.log(percent.substr(0, percent.indexOf('.')) + '% of ' + bytesExpected)
	});

	return;
  }

  // show a file upload form
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(
	'<form action="/upload" enctype="multipart/form-data" method="post">'+
    '<input type="file" accept="image/*" capture="camera" name="upload"><br>' +
	'<input type="submit" value="Upload">'+
	'</form>'
  );
}).listen(3000);
