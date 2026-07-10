const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
const app = express();

// Configurações via Variáveis de Ambiente do Render
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GIST_ID = process.env.GIST_ID;

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

// API de Validação (Roblox acessa isso)
app.get('/verificar', async (req, res) => {
    try {
        const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
        const data = JSON.parse(response.data.files['keys.json'].content);
        const key = req.query.key;
        res.send(data.keys.includes(key) ? 'OK' : 'INVALID');
    } catch (e) { 
        res.send('ERROR'); 
    }
});

client.once('ready', () => {
    console.log(`BOT ESTÁ ONLINE NO DISCORD! Logado como: ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    // Comando /gerar
    if (msg.content === '/gerar') {
        try {
            const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
            let data = JSON.parse(response.data.files['keys.json'].content);
            
            const novaKey = 'KEY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            data.keys.push(novaKey);
            
            await axios.patch(`https://api.github.com/gists/${GIST_ID}`, {
                files: { 'keys.json': { content: JSON.stringify(data) } }
            }, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
            
            msg.reply('✅ Key gerada: `' + novaKey + '`');
        } catch (e) {
            console.error("Erro ao gerar:", e);
            msg.reply('❌ Erro ao gerar key. Verifique os logs.');
        }
    }

    // Comando /banir <key>
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
        } catch (e) {
            console.error("Erro ao banir:", e);
            msg.reply('❌ Erro ao banir key.');
        }
    }
});

client.login(DISCORD_TOKEN).catch(err => console.error("FALHA NO LOGIN:", err));
app.listen(3000, () => console.log('API rodando na porta 3000'));
