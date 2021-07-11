const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
const express = require('express');
const Discord = require('discord.js');
const config = require("./config.js");
const {token,prefix}= JSON.parse(JSON.stringify(config))
const client = new Discord.Client();
client.commands = new Discord.Collection();
const port = process.env.PORT || 4000;
const app = express();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}
client.once('ready', () => {
	console.log('Ready!');
});
client.login(token);
client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if (!client.commands.has(command)) return;

	try {
		client.commands.get(command).execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

app.listen(port, '0.0.0.0',()=>{
	console.log("El servidor esta funcionando. No oira ninguna peticion http.");
});