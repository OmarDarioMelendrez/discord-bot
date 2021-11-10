const Discord = require("discord.js");
const { prefix, token } = require("./config.js");
const ytdl = require("ytdl-core-discord");
const youtubesearchapi = require("youtube-search-api");

// create the client
const client = new Discord.Client();
client.login(token);

// save al the songs in a map
const queue = new Map();

// EXECUTE
async function execute(message, serverQueue) {
	const args = message.content.split(" ");

	const voiceChannel = message.member.voice.channel;
	if (!voiceChannel)
		return message.channel.send(
			"You need to be in a voice channel to play music!"
		);
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
		return message.channel.send(
			"I need the permissions to join> and speak in your voice channel!"
		);
	}
	// parse the song
	const songInfo = await ytdl.getInfo(args[1]);
	const song = {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
	};
	// verify if has a serverQueue
	if (!serverQueue) {
		// Creating the contract for our queue
		const queueContruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		};
		// Setting the queue using our contract
		queue.set(message.guild.id, queueContruct);
		// Pushing the song to our songs array
		queueContruct.songs.push(song);

		try {
			// Here we try to join the voicechat and save our connection into our object.
			var connection = await voiceChannel.join();
			queueContruct.connection = connection;
			// Calling the play function to start a song
			play(message.guild, queueContruct.songs[0]);
		} catch (err) {
			// Printing the error message if the bot fails to join the voicechat
			console.log(err);
			queue.delete(message.guild.id);
			return message.channel.send(err);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		return message.channel.send(
			`${song.title} has been added to the queue!`
		);
	}
}
// PLAY
async function play(guild, song) {
	const serverQueue = queue.get(guild.id);
	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	// DISPATCHER
	const dispatcher = serverQueue.connection
		// .play(ytdl(song.url))
		.play(await ytdl(song.url), { type: "opus" })
		.on("finish", () => {
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on("error", (error) => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
	serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}
// SEARCH
async function search(message, serverQueue) {
	const args = message.content.split(" ");
	//we delete the first index
	args.shift();
	// we join al the words of the search
	let seachStr = args.join(" ");
	let response = await youtubesearchapi.GetListByKeyword(
		seachStr,
		[false],
		[1]
	);
	let videoUrl = `https://www.youtube.com/watch?v=${response.items[0].id}`;
	// get the video url info
	const songInfo = await ytdl.getInfo(videoUrl);
	const song = {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
	};

	const voiceChannel = message.member.voice.channel;
	if (!voiceChannel)
		return message.channel.send(
			"You need to be in a voice channel to play music!"
		);
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
		return message.channel.send(
			"I need the permissions to join> and speak in your voice channel!"
		);
	}

	// verify if has a serverQueue
	if (!serverQueue) {
		// Creating the contract for our queue
		const queueContruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		};
		// Setting the queue using our contract
		queue.set(message.guild.id, queueContruct);
		// Pushing the song to our songs array
		queueContruct.songs.push(song);

		try {
			// Here we try to join the voicechat and save our connection into our object.
			var connection = await voiceChannel.join();
			queueContruct.connection = connection;
			// Calling the play function to start a song
			play(message.guild, queueContruct.songs[0]);
		} catch (err) {
			// Printing the error message if the bot fails to join the voicechat
			console.log(err);
			queue.delete(message.guild.id);
			return message.channel.send(err);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		return message.channel.send(
			`${song.title} has been added to the queue!`
		);
	}
}
// STOP
function stop(message, serverQueue) {
	if (!message.member.voice.channel)
		return message.channel.send(
			"You have to be in a voice channel to stop the music!"
		);

	if (!serverQueue)
		return message.channel.send("There is no song that I could stop!");

	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
}
// SKIP
function skip(message, serverQueue) {
	if (!message.member.voice.channel)
		return message.channel.send(
			"You have to be in a voice channel to stop the music!"
		);
	if (!serverQueue)
		return message.channel.send("There is no song that I could skip!");
	serverQueue.connection.dispatcher.end();
}

// listeners
client.once("ready", () => {
	console.log("Ready!");
});
client.once("reconnecting", () => {
	console.log("Reconnecting!");
});
client.once("disconnect", () => {
	console.log("Disconnect!");
});
// listener of messages written in the server
client.on("message", async (message) => {
	// if the message is from the bot ignore
	if (message.author.bot) return;
	// if the message don't start with the prefix of the bot ignore
	if (!message.content.startsWith(prefix)) return;

	// create a Queue
	const serverQueue = queue.get(message.guild.id);

	// Define the commands of the bot
	// !play || !p
	if (
		message.content.startsWith(`${prefix}play`) ||
		message.content.startsWith(`${prefix}p`)
	) {
		console.log("entro al playyyy------------");
		execute(message, serverQueue);
		return;
		// !skip || !sk
	} else if (
		message.content.startsWith(`${prefix}skip`) ||
		message.content.startsWith(`${prefix}sk`)
	) {
		skip(message, serverQueue);
		return;
		// !stop || !st
	} else if (message.content.startsWith(`${prefix}search`)) {
		search(message, serverQueue);
	} else if (
		message.content.startsWith(`${prefix}stop`) ||
		message.content.startsWith(`${prefix}st`)
	) {
		stop(message, serverQueue);
		return;
	}
	// !turraka
	else if (message.content.startsWith(`${prefix}turraka`)) {
		message.content =
			"!turraka https://www.youtube.com/watch?v=Jt1gcpPfINA";
		execute(message, serverQueue);
		return;
	} else {
		message.channel.send("You need to enter a valid command!");
	}
});
