var http = require('http'),
	fs = require('fs'),
	acceptablePhones = new Array();

http.createServer(function(req, res) {
	var bodyarr = []
	req.on('data', function(chunk) {
		bodyarr.push(chunk);
	})
	req.on('end', function() {
		var b = bodyarr.join('');
		var SA = b.split('</SenderAddress>')[0].split('<SenderAddress>')[1];
		if (acceptablePhones.indexOf(SA) != -1) {
			console.log('Sender has paid: ' + SA);
			var at = b.split('--Nokia-mm-messageHandler-BoUnDaRy')[2].split('BASE64')[1];
			var buf = new Buffer(at, 'base64');
			fs.writeFile(__dirname + '/images/' + Math.round(Math.random() * 1000000) + '.png', buf);
		}
		else {
			console.log('Sender has not paid, discarding photo');
		}
		res.writeHead(200, {
			'Content-Type': 'text/plain'
		});
		res.end('Thanks, Apigee!');
	})
}).listen(8085, '0.0.0.0');

console.log('Started up successfully.');

var express = require('express'),
	app = express.createServer(),
	rest = require('restler'),
	ejs = require('ejs'),
	url = require("url");
app.use(express.cookieParser());
app.use(express.session({
	secret: "thisIsSparta!"
}));
app.use('/images', express.static(__dirname + '/images'));
app.use(express.bodyParser({
	uploadDir: __dirname + '/images'
}));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', function(req, res) {
	res.send('<form method="post">' + '<p>Enter your phone number: <input type="text" name="phone"/></p>' + '<p><input type="submit" value="Buy access" /></p>' + '</form>');
});

app.post('/', function(req, res) {
	req.session.phone = 'tel:+1' + req.body.phone;
	var data = '{"Amount":0.99,' + '"Category":1,' + '"Channel":"MOBILE_WEB",' + '"Description":"Word Game 1",' + '"MerchantTransactionId":"transaction' + Math.round(Math.random() * 1000) + '",' + '"MerchantProductId":"WordGame1",' + '"MerchantPaymentRedirectUrl":"http://code.kristsauders.com:8086/return"}';
	rest.post('https://api.att.com/Security/Notary/Rest/1/SignedPayload', {
		data: data,
		headers: {
			"Client_id": "ebcee704b1cceb58c6480603c1a4e35c",
			"Client_secret": "f6da366b670972ef"
		}
	}).on('complete', function(data, response) {
		console.log(data);
		if (response.statusCode == 200) {
			res.redirect('https://api.att.com/Commerce/Payment/Rest/2/Transactions?SignedPaymentDetail=' + data.SignedDocument + '&Signature=' + data.Signature + '&clientid=ebcee704b1cceb58c6480603c1a4e35c');
		}
	});
});

app.get('/return', function(req, res) {
	if (!req.query.error) {
		rest.post('https://api.att.com/oauth/token', {
			data: {
				"client_id": "ebcee704b1cceb58c6480603c1a4e35c",
				"client_secret": "f6da366b670972ef",
				"grant_type": "client_credentials",
				"scope": "PAYMENT"
			}
		}).on('complete', function(data, response) {
			console.log(data);
			if (response.statusCode == 200) {
				var AT = data.access_token;
				rest.get('https://api.att.com/Commerce/Payment/Rest/2/Transactions/TransactionAuthCode/' + req.query.TransactionAuthCode + '?access_token=' + AT).on('complete', function(data, resopnse) {
					console.log(data);
					if (response.statusCode == 200) {
						if (data.TransactionStatus == 'SUCCESSFUL') {
							acceptablePhones.push(req.session.phone);
							res.send('Thank you, please send MMS pictures to 80712546. View the gallery <a href="/gallery">here.</a>');
						}
					}
				});
			}
		});
	}
});

app.get('/gallery', function(req, res) {
	fs.readdir(__dirname + '/images', function(err, files) {
		var images = new Array();
		for (var i = 0; i < files.length; i++) {
			images[i] = files[i];
		}
		res.render('index', {
			layout: false,
			data: images
		});
	});
});

app.listen(8086);
console.log('Started up express successfully.');