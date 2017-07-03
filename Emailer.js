const nodemailer = require('nodemailer');

class Emailer {

    static send(data) {

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST, //'mail.yourgdprguru.com',
            port: process.env.EMAIL_PORT, //587,
            secure: false, // secure:true for port 465, secure:false for port 587
            auth: {
                user: process.env.EMAIL_USER, //'chatbot@yourgdprguru.com',
                pass: process.env.EMAIL_PASSWORD //'aekR3ZjK9J'
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from: '"GDPR ChatBot" <' + process.env.EMAIL_USER + '>', // sender address
            to: data.to, //'tristanlisondra@gmail.com', // list of receivers
            subject: data.subject, //'Hello ✔', // Subject line
            text:  data.text,// 'Hello world ?', // plain text body
            html: '<b>' + data.text + '</b>' // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }

            console.log('Message %s sent: %s', info.messageId, info.response);
        });
    }
}

module.exports = Emailer;