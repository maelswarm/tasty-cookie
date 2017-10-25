var database;
var key;
var timeout;
var lifespan;

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const crypto = require('crypto');

var myCookie = {

	init: function(dbpath, cryptoKey, to, ls, callback) {
		key = cryptoKey;
		timeout = to;
		lifespan = ls;

		MongoClient.connect(dbpath, function(err, db) {
			if (err) throw err;
			database = db;
			setInterval(function() {
				var d = new Date();
				d = d.getTime();
				database.collection("sessions").find().toArray(function(err, result) {
					if(err) throw err;
					console.log(result);
					for(let i=0; i<result.length; i++) {
						console.log(d+" "+result[i].stamp);
						if(result[i].stamp+lifespan < d) {
							database.collection("sessions").remove({_id: ObjectID(result[i]._id)}, function(err1, obj) {
								if(err) throw err;
								console.log(result[i]._id + " removed");
							});
						}
					}
				});
			}, timeout);
			callback();
		});
	},

	login: function(username, password, callback) {
		var encryptedPassword = this.encrypt(password);
		console.log(encryptedPassword);
		database.collection("users").find({username}).toArray(function(err, result) {
			if(err) throw err;
			if(result[0] !== undefined) {
				if(result[0].password === encryptedPassword) {
					myCookie.requestCookie(function(cookie) {
						var d = new Date();
						var query = [{cookie: cookie, stamp: d.getTime()}];
						database.collection("sessions").insertMany(query, function(err1, res1) {
							if(err1) throw err;
							database.collection("users").update({ _id: ObjectID(result[0]._id)}, {$set: {cookie: cookie}}, function(err2, res2) {
								if(err2) throw err;
								callback(cookie);
							});
						});
					});
				} else {
					console.log("Incorrect Password");
				}
			} else {
				console.log("Not a valid user");
			}
		});
	},

	requestCookie: function(callback) {
		var token = new Date();
		token = token.toString();
		console.log(token);
		callback(myCookie.generateCookie(token));
	},

	authenticate: function(token, callback) {
		database.collection("sessions").find({cookie: token}).toArray(function(err1, result1) {
			if (result1[0] !== undefined) {
				var d = new Date();
				database.collection("sessions").update({ _id: ObjectID(result1[0]._id)}, {$set: {stamp: d.getTime()}}, function(err2, res1) {
					if(err2) throw err;
					callback(1);
				});
			} else {
				callback(0);
			}
		});
	},

	logout: function(token) {
		database.collection("sessions").find({cookie: token}).toArray(function(err1, result1) {
			if (result1[0] !== undefined) {
				database.collection("sessions").remove({_id: ObjectID(result1[0]._id)}, function(err2, obj) {
					if(err2) throw err2;
					console.log(result1[0]._id + " removed");
				});
			} else {
				console.log("not a valid token");
			}
		});
	},

	generateCookie: function(token) {
		var cipher = crypto.createCipher('aes-256-cbc', token);
		var crypted = cipher.update(token, 'utf-8', 'hex');
		crypted += cipher.final('hex');
		return crypted;
	},

	encrypt: function(data) {
		var cipher = crypto.createCipher('aes-256-cbc', key);
		var crypted = cipher.update(data, 'utf-8', 'hex');
		crypted += cipher.final('hex');
		return crypted;
	},

	decrypt: function(data) {
		var decipher = crypto.createDecipher('aes-256-cbc', key);
		var decrypted = decipher.update(data, 'hex', 'utf-8');
		decrypted += decipher.final('utf-8');
		return decrypted;
	},

	close: function() {
		database.close();
	}
}

module.exports = myCookie;