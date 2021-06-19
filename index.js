const Discord = require("discord.js");
const ytdl = require('ytdl-core');
const config = require("./config.json");
const fs = require("fs");
const client = new Discord.Client();

const prefix = "?";

client.on('message', async message => {
	// Join the same voice channel of the author of the message

	if (message.author.bot) return;
  	if (!message.content.startsWith(prefix)) return;

	const body = message.content.slice(prefix.length);
	const arg = body.split(' ');
	const msg = arg.shift().toLowerCase();
	if (message.member.voice.channel && msg === "play") {
		const connection = await message.member.voice.channel.join();
		let audio = ytdl(arg);
		let dispatcher = connection.play(audio, {filter: 'audioonly', bitrate: 96000, volume: 0.5}).on("finish", () => {
			message.member.voice.channel.leave();
		});
	} else if (message.member.voice.channel && msg === "disconnect") {
		message.member.voice.channel.leave();
	}
});

client.login(config.BOT_TOKEN);
