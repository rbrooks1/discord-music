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

function validYtLink(url) {
	var regex = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
	var match = url.match(regex);
	return match[1];
}

client.on('message', async message => {
	// Join the same voice channel of the author of the message

	if (message.author.bot) return;
  	if (!message.content.startsWith(prefix)) return;

	const body = message.content.slice(prefix.length);
	const arg = body.split(' ');
	const msg = arg.shift().toLowerCase();
	if (message.member.voice.channel && msg === "play" && playing === 0) {
		if (arg.length === 1 && validYtLink(String(arg))) {
			const connection = await message.member.voice.channel.join();
			if (ytpl.validateID(String(arg))) {
				const music = await ytpl(String(arg));
				if (music === null || music === undefined) {
					message.channel.send("Could not find playlist");
				} else {
					var items = await music.items;
					for (var i = 0; i < items.length; i++) {
						var URL = items[i].shortUrl;
						queue.push(URL);
					}
				}
			} else if (String(arg).includes("start_radio")) {
				const id = getVideoId(String(arg));
				const mix = await ytmpl(id.id);
				if (mix === null || mix === undefined) {
					message.channel.send("Could not find playlist");
				} else {
					var items = await mix.items;
					for (var i = 0; i < items.length; i++) {
						var URL = items[i].url;
						queue.push(URL);
					}
				}
			} else {
				queue.push(arg);
			}
			if (queue.length > 0 && queue[0] !== undefined) {
				await play(connection, message);
			} else {
				message.channel.send("Could not play this song.  Moving to next");
				queue.shift();
				if (queue[0]) {
					await play(connection, message);
				} else {
					message.channel.send("No more songs in queue");
				}
			}
		} else {
			message.channel.send("Not a valid command");
		}
	} else if (message.member.voice.channel && msg === "play" && playing === 1) {
		if (arg.length === 1 && validYtLink(String(arg))) {
			message.channel.send("Queued " + arg);
			const connection = await message.member.voice.channel.join();
			if (ytpl.validateID(String(arg))) {
				const music = await ytpl(String(arg));
				if (music === null || music === undefined) {
					message.channel.send("Could not find playlist");
				} else {
					var items = music.items;
					for (var i = 0; i < items.length; i++) {
						var URL = items[i].shortUrl;
						queue.push(URL);
					}
				}
			} else if (String(arg).includes("start_radio")) {
				const id = getVideoId(String(arg));
				var mix = await ytmpl(id.id);
				if (mix === null || mix === undefined) {
					message.channel.send("Could not find playlist");
				} else {
					var items = mix.items;
					for (var i = 0; i < items.length; i++) {
						var URL = items[i].url;
						queue.push(URL);
					}
				}
			} else {
				queue.push(arg);
			}
		} else {
			message.channel.send("Not a valid command");
		}
	} else if (message.member.voice.channel && msg === "disconnect") {
		if (arg === null || arg === undefined || arg.length === 0) {
			queue = [];
			playing = 0;
			message.member.voice.channel.leave();
		} else {
			message.channel.send("Not a valid command");
		}
	} else if (message.member.voice.channel && msg === "queue") {
		if (arg === null || arg === undefined || arg.length === 0) {
			if (queue.length > 0) {
				message.channel.send(queue);
			} else {
				message.channel.send("No songs in queue");
			}
		} else {
			message.channel.send("Not a valid command");
		}
	} else if (message.member.voice.channel && msg === "skip") {
		if (queue.length > 1) {
			const connection = await message.member.voice.channel.join();
			queue.shift();
			play(connection, message);
		} else {
			message.channel.send("On final song of queue");
		}
	} else if (message.member.voice.channel && msg === "help") {
		if (arg === null || arg === undefined || arg.length === 0) {
			message.channel.send("Here is a list of commands:\nplay\ndisconnect\nskip\nqueue");
		} else {
			message.channel.send("Not a valid command");
		}
	} else {
		message.channel.send("This is not a valid command.\nType " + prefix + "help for a list of commands");
	}
});

client.login(config.BOT_TOKEN);
