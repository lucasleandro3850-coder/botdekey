const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
const app = express();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GIST_ID = process.env.GIST_ID; // ID do Gist das Keys
const SCRIPT_URL = process.env.SCRIPT_URL; // Link RAW do seu menu

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

app.get('/verificar', async (req, res) => {
    try {
        // 1. Puxa as keys do Gist
        const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
        const data = JSON.parse(response.data.files['keys.json'].content);
        const key = req.query.key;

        if (data.keys.includes(key)) {
            // 2. Se a key for válida, o SERVIDOR busca o seu script ofuscado
            const scriptRes = await axios.get(SCRIPT_URL);
            // 3. Envia o conteúdo do script para o Roblox
            res.send(scriptRes.data);
        } else {
            res.send("INVALID");
        }
    } catch (e) {
        console.error(e);
        res.send('ERROR');
    }
});

// --- COMANDOS DO BOT (GERAR / BANIR) ---
client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    if (msg.content.startsWith('/gerar')) {
        try {
            const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
            let data = JSON.parse(response.data.files['keys.json'].content);
            const novaKey = 'KEY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            data.keys.push(novaKey);
            await axios.patch(`https://api.github.com/gists/${GIST_ID}`, {
                files: { 'keys.json': { content: JSON.stringify(data) } }
            }, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
            msg.reply('✅ Key gerada: `' + novaKey + '`');
        } catch (e) { msg.reply('❌ Erro no Gist.'); }
    }
    if (msg.content.startsWith('/banir ')) {
        const keyBan = msg.content.split(' ')[1];
        try {
            const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
            let data = JSON.parse(response.data.files['keys.json'].content);
            data.keys = data.keys.filter(k => k !== keyBan);
            await axios.patch(`https://api.github.com/gists/${GIST_ID}`, {
                files: { 'keys.json': { content: JSON.stringify(data) } }
            }, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
            msg.reply('🚫 Key banida: `' + keyBan + '`');
        } catch (e) { msg.reply('❌ Erro.'); }
    }
});

client.login(DISCORD_TOKEN);
app.listen(3000);
