"use strict";
var events = require('events');
var request = require('request');
var FacebookBotService = (function () {
    function FacebookBotService(page_token, validation_token) {
        this.page_token = page_token;
        this.validation_token = validation_token;
        this.eventEmitter = new events.EventEmitter();
        this.receive = this.receive.bind(this);
    }
    FacebookBotService.prototype.send = function (sender, text, errorHandler) {
        console.log(sender, text);
        var messageData = {
            text: text
        };
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: this.page_token
            },
            method: 'POST',
            json: {
                recipient: {
                    id: sender
                },
                message: messageData,
            }
        }, function (error, response, body) {
            if (error) {
                console.log('Error sending message: ', error);
            }
            else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });
    };
    FacebookBotService.prototype.receive = function (req, res) {
        console.log('receive handler called', req.body);
        var messaging_events = req.body.entry[0].messaging;
        for (var i = 0; i < messaging_events.length; i++) {
            var event = req.body.entry[0].messaging[i];
            var sender = event.recipient.id;
            var recipient = event.sender.id;
            if (event.message && event.message.text) {
                var text = event.message.text;
                var id = event.message.mid;
                console.log('message received:', text, sender);
                this.eventEmitter.emit('message', {
                    messageId: id,
                    text: text,
                    to: recipient,
                    from: sender
                });
            }
        }
        res.send(200);
    };
    FacebookBotService.prototype.validate = function (req, res) {
        console.log('validate handler called', req.params);
        if (req.params.hub.verify_token === this.validation_token) {
            var challenge = Number(req.params.hub.challenge);
            res.send(200, challenge);
            console.log('validation successful');
            return;
        }
        console.error('Error, wrong validation token');
        res.send('Error, wrong validation token');
    };
    return FacebookBotService;
}());
exports.FacebookBotService = FacebookBotService;
