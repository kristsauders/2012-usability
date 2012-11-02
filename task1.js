var rest = require('restler');

rest.post('https://api.att.com/oauth/token', {
	data: {
		"client_id": "d355b204998ef0cb002f252b47af26d6",
		"client_secret": "6f5bc93ff6d2ce35",
		"grant_type": "client_credentials",
		"scope": "SMS"
	}
}).on('complete', function(data, response) {
    console.log(data);
	if (response.statusCode == 200) {
		var AT = data.access_token;
		rest.post('https://api.att.com/rest/sms/2/messaging/outbox?access_token=' + AT, {
			data: {
				"Message": "hello world",
				"Address": "tel:8588228604"
			}
		}).on('complete', function(data, response) {
			console.log(data);
			if (response.statusCode == 200) {
				var ID = data.Id;
				rest.get('https://api.att.com/rest/sms/2/messaging/outbox/' + ID + '?access_token=' + AT).on('complete', function(data, response) {
					if (response.statusCode == 200) {
                        console.log(data);
						rest.get('https://api.att.com/rest/sms/2/messaging/inbox?RegistrationID=80712508&access_token=' + AT).on('complete', function(data, response) {
							if (response.statusCode == 200) {
								var m = data.InboundSmsMessageList.InboundSmsMessage;
								console.log(m);
							}
						});
					}
				});
			}
		});
	}
});