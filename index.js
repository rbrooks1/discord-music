const Discord = require("discord.js");
const ytdl = require('ytdl-core');
const config = require("./config.json");
const fs = require("fs");
const ytpl = require('ytpl');
const ytmpl = require('yt-mix-playlist');
const getVideoId = require('get-video-id'); 

const client = new Discord.Client();

const prefix = "?";

let queue = [];
var playing = 0;

function play(conn, msg) {
	playing = 1;
	msg.channel.send("Now Playing " + queue[0]);
	let audio = ytdl(queue[0], {highWaterMark: 1<<30});
	let dispatcher = conn.play(audio, {filter: 'audioonly', bitrate: 96000, volume: 0.5}).on("finish", () => {
		playing = 0;
		let val = queue.shift();
		if (!(val === undefined)) {
			play(conn, msg);
		}
	});
};

client.on('message', async message => {
	// Join the same voice channel of the author of the message

	if (message.author.bot) return;
  	if (!message.content.startsWith(prefix)) return;

	const body = message.content.slice(prefix.length);
	const arg = body.split(' ');
	const msg = arg.shift().toLowerCase();
	if (message.member.voice.channel && msg === "play" && playing === 0) {
		const connection = await message.member.voice.channel.join();
		if (ytpl.validateID(String(arg))) {
			const music = await ytpl(String(arg));
			var items = music.items;
			for (var i = 0; i < items.length; i++) {
				var URL = items[i].shortUrl;
				queue.push(URL);
			}
		} else if (String(arg).includes("start_radio")) {
			const id = getVideoId(String(arg));
			var mix = await ytmpl(id.id);
			var items = mix.items;
			for (var i = 0; i < items.length; i++) {
				var URL = items[i].url;
				queue.push(URL);
			}
		} else {
			queue.push(arg);
		}
		await play(connection, message);
	} else if (message.member.voice.channel && msg === "play" && playing === 1) {
		message.channel.send("Queued " + arg);
		if (ytpl.validateID(String(arg))) {
			const music = await ytpl(String(arg));
			var items = music.items;
			for (var i = 0; i < items.length; i++) {
				var URL = items[i].shortUrl;
				queue.push(URL);
			}
		} else if (String(arg).includes("start_radio")) {
			const id = getVideoId(String(arg));
			var mix = await ytmpl(id.id);
			var items = mix.items;
			for (var i = 0; i < items.length; i++) {
				var URL = items[i].url;
				queue.push(URL);
			}
		} else {
			queue.push(arg);
		}
	} else if (message.member.voice.channel && msg === "disconnect") {
		queue = [];
		playing = 0;
		message.member.voice.channel.leave();
	} else if (message.member.voice.channel && msg === "queue") {
		message.channel.send(queue);
	} else if (message.member.voice.channel && msg === "skip") {
		if (queue.length > 1) {
			const connection = await message.member.voice.channel.join();
			queue.shift();
			play(connection, message);
		} else {
			message.channel.send("On final song of queue");
		}
	}
});

client.login(config.BOT_TOKEN);
