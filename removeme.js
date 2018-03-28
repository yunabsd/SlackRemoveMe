const async = require('async');
const request = require('superagent');

const ChannelKind = {
    Private: 'groups',
    Normal: 'channels',
    DirectMessage: 'im',
}

const baseApiUrl = 'https://slack.com/api/';
const token = 'xoxp-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const userID = 'UXXXXXXXX';
const channel = 'DXXXXXXXX';
const channelKind = ChannelKind.DirectMessage;
const delay = 1300; // 50 query per 1 minute

let latest = '1720469084.000333';

function deleteMessage(messages) {
    return new Promise((resolve, reject) => {
        async.eachSeries(messages, (v, cb) => {
            let deleteApiUrl = `${baseApiUrl}chat.delete?token=${token}&channel=${channel}&ts=`;
            request.get(deleteApiUrl + v)
                .then((res) => {
                    const body = res.body;
                    if (body.ok === true) {
                        console.log(v + ' deleted!');
                        setTimeout(() => {
                            cb(null);
                        }, delay);
                    } else if (body.ok === false) {
                        latest = v;
                        cb('failed remove : ' + body.error);
                    }
                })
                .catch((e) => {
                    cb(e);
                })
        }, (err) => {
            if (err) {
                console.log(err);
                resolve();
            }
            else {
                resolve();
            }
    
        });
    })
}

function start() {
    let success = false;
    async.whilst(
        function() { return success === false },
        function(cb) {
            let historyApiUrl = `${baseApiUrl}${channelKind}.history?token=${token}&count=1000&latest=${latest}&channel=${channel}`;
            request.get(historyApiUrl)
                .then((res) => {
                    const body = res.body;
                    if (body.messages.length === 0) {
                        success = true;
                    }
                    let messages = [];
                    console.log('latest time:', body.latest);
                    console.log('count:', body.messages.length);
                    if (body.messages.length !== 0) {
                        console.log('start message time:', body.messages[body.messages.length - 1].ts);
                        latest = body.messages[body.messages.length - 1].ts;
                    }
        
                    for (let i = 0; i < body.messages.length; i++) {
                        if (body.messages[i].user === userID) {
                            console.log('push:' + body.messages[i].ts);
                            messages.push(body.messages[i].ts);
                        }
                    }
        
                    console.log('delete start');
                    return deleteMessage(messages);
                })
                .then(() => {
                    cb(null, success);
                })
                .catch((e) => {
                    console.log(e);
                })
        },
        function (err, n) {
            if (err) {
                console.log(err);
            }
            else {
                console.log('complete');
            }
        }
    );
}
  
start();
