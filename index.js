const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
const app = express();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// CONFIGURAÇÕES - PREENCHA AQUI
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GIST_ID = process.env.GIST_ID;

// API de Validação (O Roblox chama isso)
app.get('/verificar', async (req, res) => {
    try {
        const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
        const data = JSON.parse(response.data.files['keys.json'].content);
        const key = req.query.key;
        res.send(data.keys.includes(key) ? 'OK' : 'INVALID');
    } catch { res.send('ERROR'); }
});

// Bot do Discord
client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    
    // Comando /gerar
    if (msg.content.startsWith('/gerar')) {
        const novaKey = 'KEY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
        let data = JSON.parse(response.data.files['keys.json'].content);
        
        data.keys.push(novaKey); // Adiciona na lista
        
        await axios.patch(`https://api.github.com/gists/${GIST_ID}`, {
            files: { 'keys.json': { content: JSON.stringify(data) } }
        }, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
        
        msg.reply('✅ Key gerada com sucesso: `' + novaKey + '`');
    }

    // Comando /banir <key>
    if (msg.content.startsWith('/banir')) {
        const keyBan = msg.content.split(' ')[1];
        const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
        let data = JSON.parse(response.data.files['keys.json'].content);
        
        data.keys = data.keys.filter(k => k !== keyBan);
        
        await axios.patch(`https://api.github.com/gists/${GIST_ID}`, {
            files: { 'keys.json': { content: JSON.stringify(data) } }
        }, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
        
        msg.reply('🚫 Key banida: ' + keyBan);
    }
});

client.login(DISCORD_TOKEN);
app.listen(3000);
