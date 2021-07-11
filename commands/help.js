module.exports = {
	name: 'help',
	description: 'Show information to help the user',
	execute(message, args) {
		message.channel.send('Escribe !s {region} {all[opcional]} {invocador}');
	},
};