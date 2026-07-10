const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
const app = express();

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

// --- COLOQUE SEU SCRIPT DO MENU ABAIXO ---
const https://gist.githubusercontent.com/lucasleandro3850-coder/afe334f158cdd53301d8b642bafa855d/raw/9cf877bc728266b94d616822ae8589ff47f149fb/script.lua = `
-- Cole aqui todo o conteúdo do seu script ofuscado (o que você postou no Gist)
print("Menu Carregado com Sucesso!")
`;
// ----------------------------------------

// API de Validação (Roblox chama isso)
app.get('/verificar', async (req, res) => {
    try {
        const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
        const data = JSON.parse(response.data.files['keys.json'].content);
        const key = req.query.key;

        if (data.keys.includes(key)) {
            // Se a key for válida, o servidor envia o seu script real
            res.send(MEU_MENU_PRINCIPAL);
        } else {
            res.send("INVALID");
        }
    } catch (e) { 
        res.send('ERROR'); 
    }
});

client.once('ready', () => {
    console.log(`BOT ONLINE: ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    // Comando /gerar
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
        } catch (e) {
            msg.reply('❌ Erro ao gerar key. Verifique se o GIST_ID e o GITHUB_TOKEN estão certos no Render.');
        }
    }

    // Comando /banir
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
            msg.reply('❌ Erro ao banir key.');
        }
    }
});

client.login(DISCORD_TOKEN);
app.listen(3000);
