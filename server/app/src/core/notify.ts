import * as util from 'util';
import * as nodemailer from 'nodemailer';
import { config } from '../configuration';
var twilio = require('twilio');

const poolConfig = config.smtp.config;

export var sendEmailAsync = function (to = '', subject = '', text = '', from = config.smtp.defaultFrom) {
    console.log("sending email : " + from + ", To:" + to + ", cc:" + config.smtp.defaultCC + ", subject:" + subject + ", text:" + text);
    var transporter = nodemailer.createTransport(poolConfig);

    var mailOptions = {
        from: from,
        to: to,
        bcc: [config.smtp.defaultCC],
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

export var sendSMSAsync = async function (phoneNumber = '', subject = '', text = '', test = false) {
    try {
        var client = new twilio(config.sms.accountSid, (test ? config.sms.testAuthToken : config.sms.authToken));

        client.messages.create.query = util.promisify(client.messages.create);
        var message = await client.messages.create({
            body: subject + text,
            to: phoneNumber,  // Text this number
            from: config.sms.from // From a valid Twilio number
        });

        console.log(message.sid);
        return message;
        // .then((message) => console.log(message.sid));
    }
    catch (err) {
        console.log(err);
    }
};

export var sendPushNotificationAsync = async function (phoneNumber = '', subject = '', text = '', test = false) {
    try {
        var client = new twilio(config.sms.accountSid, (test ? config.sms.testAuthToken : config.sms.authToken));

        client.messages.create.query = util.promisify(client.messages.create);
        var message = await client.messages.create({
            body: subject + text,
            to: phoneNumber,  // Text this number
            from: config.sms.from // From a valid Twilio number
        });

        console.log(message.sid);
        return message;
        // .then((message) => console.log(message.sid));
    }
    catch (err) {
        console.log(err);
    }
};
