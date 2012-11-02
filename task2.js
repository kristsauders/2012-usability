var express = require('express'),
	app = express.createServer(),
	rest = require('restler'),
	url = require("url");
app.use(express.cookieParser());
app.use(express.session({
	secret: "usability03272012!"
}));
app.use(express.bodyParser());

app.get('/', function(req, res) {
	if (!req.query.code) {
		res.send('<form method="post">' + '<p>Enter your phone number: <input type="text" name="phone"/></p>' + '<p><input type="submit" value="Submit" /></p>' + '</form>');
	}
	else {
		rest.post('https://api.att.com/oauth/token', {
			data: {
				"client_id": "e2d6551c29a8ded8aaec93ddd4f80f43",
				"client_secret": "d9e32a0dc0fb3425",
				"grant_type": "authorization_code",
				"code": req.query.code
			}
		}).on('complete', function(data, response) {
			if (response.statusCode == 200) {
				var AT = data.access_token;
				rest.get('https://api.att.com/1/devices/tel:' + req.session.phone + '/location?requestedAccuracy=5000&acceptableAccuracy=10000&access_token=' + AT).on('complete', function(data, resopnse) {
					if (response.statusCode == 200) {
						rest.post('https://api.att.com/rest/sms/2/messaging/outbox?access_token=' + AT, {
							data: {
								"Message": JSON.stringify(data),
								"Address": "tel:" + req.session.phone
							}
						}).on('complete', function(data, resopnse) {
							res.send('Success!');
						});
					}
				});
			}
		});
	}
});

app.post('/', function(req, res) {
	req.session.phone = req.body.phone;
	res.redirect('https://api.att.com/oauth/authorize?client_id=e2d6551c29a8ded8aaec93ddd4f80f43&scope=TL,SMS&redirect_uri=http%3A%2F%2Fcode.kristsauders.com/test/one');
});

app.listen(8085);
console.log('Started up successfully.');