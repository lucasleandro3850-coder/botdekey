const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const axios = require('axios');
const app = express();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GIST_ID = process.env.GIST_ID;
const SCRIPT_URL = process.env.SCRIPT_URL;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

// Nome do arquivo dentro do seu Gist de keys
const KEYS_FILENAME = 'gistfile1.txt'; 

// --- API DE VALIDAÇÃO (ROBLOX) ---
app.get('/verificar', async (req, res) => {
    try {
        const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
        const data = JSON.parse(response.data.files[KEYS_FILENAME].content);
        const key = req.query.key;

        if (data.keys[key]) {
            const info = data.keys[key];
            if (info.expires !== -1 && Date.now() > info.expires) {
                return res.send("INVALID"); // Chave expirada
            }
            // Busca o script real e envia para o Roblox
            const scriptRes = await axios.get(SCRIPT_URL);
            res.send(scriptRes.data);
        } else {
            res.send("INVALID");
        }
    } catch (e) { res.send('ERROR'); }
});

// --- ROTA DE LOG E REGISTRO DE USO ---
app.get('/log', async (req, res) => {
    const { key, username, userid } = req.query;
    try {
        const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
        let data = JSON.parse(response.data.files[KEYS_FILENAME].content);

        if (data.keys[key]) {
            data.keys[key].used_by = username; // Registra o último usuário
            
            await axios.patch(`https://api.github.com/gists/${GIST_ID}`, {
                files: { [KEYS_FILENAME]: { content: JSON.stringify(data) } }
            }, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });

            if (WEBHOOK_URL) {
                await axios.post(WEBHOOK_URL, {
                    embeds: [{
                        title: "👤 Script Executado",
                        color: 0x00ff00,
                        thumbnail: { url: `https://www.roblox.com/Thumbs/Avatar.ashx?x=150&y=150&userId=${userid}` },
                        fields: [
                            { name: "Jogador", value: `[${username}](https://www.roblox.com/users/${userid}/profile)`, inline: true },
                            { name: "Key", value: `\`${key}\``, inline: true },
                            { name: "Tipo", value: data.keys[key].expires === -1 ? "Permanente" : "24 Horas", inline: true }
                        ]
                    }]
                });
            }
        }
        res.send('OK');
    } catch (e) { res.send('ERROR'); }
});

// --- COMANDOS DO BOT DO DISCORD ---
client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    // !gerar 24h ou !gerar perm
    if (msg.content.startsWith('!gerar')) {
        const tipo = msg.content.split(' ')[1] || '24h';
        try {
            const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
            let data = JSON.parse(response.data.files[KEYS_FILENAME].content);
            
            const novaKey = 'NC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            let expira = tipo === '24h' ? Date.now() + (24 * 60 * 60 * 1000) : -1;

            data.keys[novaKey] = { expires: expira, used_by: null, type: tipo };

            await axios.patch(`https://api.github.com/gists/${GIST_ID}`, {
                files: { [KEYS_FILENAME]: { content: JSON.stringify(data) } }
            }, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });

            msg.reply(`✅ **Key ${tipo.toUpperCase()} Gerada:** \`${novaKey}\``);
        } catch (e) { msg.reply('❌ Erro ao acessar Gist. Verifique o GIST_ID e o TOKEN.'); }
    }

    // !banir <key>
    if (msg.content.startsWith('!banir ')) {
        const keyBan = msg.content.split(' ')[1];
        try {
            const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
            let data = JSON.parse(response.data.files[KEYS_FILENAME].content);
            delete data.keys[keyBan];
            await axios.patch(`https://api.github.com/gists/${GIST_ID}`, {
                files: { [KEYS_FILENAME]: { content: JSON.stringify(data) } }
            }, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
            msg.reply(`🚫 Key \`${keyBan}\` foi deletada e banida.`);
        } catch (e) { msg.reply('❌ Erro ao banir.'); }
    }

    // !clientes
    if (msg.content === '!clientes') {
        try {
            const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
            let data = JSON.parse(response.data.files[KEYS_FILENAME].content);
            let lista = "📋 **Lista de Keys e Clientes:**\n\n";
            for (let k in data.keys) {
                lista += `🔑 \`${k}\` | 👤 \`${data.keys[k].used_by || "Livre"}\` | ⏳ \`${data.keys[k].type}\`\n`;
            }
            msg.reply(lista || "Nenhuma key gerada ainda.");
        } catch (e) { msg.reply('❌ Erro ao listar.'); }
    }
});

client.once('ready', () => console.log('SISTEMA ONLINE!'));
client.login(DISCORD_TOKEN);
app.listen(3000);
