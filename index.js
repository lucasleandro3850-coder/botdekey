const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const axios = require('axios');
const app = express();

// Carregando variáveis do ambiente (Render)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GIST_ID = process.env.GIST_ID;
const SCRIPT_URL = process.env.SCRIPT_URL;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

// Configuração padrão do Axios para o GitHub
const githubApi = axios.create({
    baseURL: 'https://api.github.com',
    headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
});

// Função para ler o Gist (Detecta o nome do arquivo automaticamente)
async function getGist() {
    const res = await githubApi.get(`/gists/${GIST_ID}`);
    const fileName = Object.keys(res.data.files)[0];
    const content = JSON.parse(res.data.files[fileName].content);
    return { fileName, content };
}

// --- API PARA O ROBLOX ---

// Rota 1: Verifica a Key e entrega o Script (Usa no Loader)
app.get('/verificar', async (req, res) => {
    try {
        const { content } = await getGist();
        const key = req.query.key;

        if (content.keys[key]) {
            const info = content.keys[key];
            if (info.expires !== -1 && Date.now() > info.expires) {
                return res.send("INVALID"); 
            }
            const scriptRes = await axios.get(SCRIPT_URL);
            res.send(scriptRes.data);
        } else {
            res.send("INVALID");
        }
    } catch (e) {
        res.send('ERROR');
    }
});

// Rota 2: CHECAGEM RÁPIDA (Usa no Loop de Banimento para o Chute ser Instantâneo)
app.get('/checar', async (req, res) => {
    try {
        const { content } = await getGist();
        const key = req.query.key;
        if (content.keys[key]) {
            const info = content.keys[key];
            if (info.expires !== -1 && Date.now() > info.expires) {
                return res.send("INVALID");
            }
            res.send("OK"); // Resposta leve apenas para confirmar que a key ainda vale
        } else {
            res.send("INVALID");
        }
    } catch (e) {
        res.send('ERROR');
    }
});

// Rota 3: Gera o Log de quem usou
app.get('/log', async (req, res) => {
    const { key, username, userid } = req.query;
    try {
        const { fileName, content } = await getGist();
        if (content.keys[key]) {
            content.keys[key].used_by = username;
            
            await githubApi.patch(`/gists/${GIST_ID}`, {
                files: { [fileName]: { content: JSON.stringify(content) } }
            });

            if (WEBHOOK_URL) {
                await axios.post(WEBHOOK_URL, {
                    embeds: [{
                        title: "🚀 Script Executado",
                        color: 0x00ff00,
                        thumbnail: { url: `https://www.roblox.com/Thumbs/Avatar.ashx?x=150&y=150&userId=${userid}` },
                        fields: [
                            { name: "Jogador", value: `${username} (${userid})`, inline: true },
                            { name: "Key", value: `\`${key}\``, inline: true },
                            { name: "Expiração", value: content.keys[key].expires === -1 ? "Permanente" : "24 Horas", inline: true }
                        ]
                    }]
                });
            }
        }
        res.send('OK');
    } catch (e) { res.send('ERROR'); }
});

// --- COMANDOS DO BOT NO DISCORD ---

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    if (msg.content.startsWith('!gerar')) {
        const tipo = msg.content.split(' ')[1] || '24h';
        try {
            const { fileName, content } = await getGist();
            const novaKey = 'NC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            let expira = tipo === '24h' ? Date.now() + (24 * 60 * 60 * 1000) : -1;

            content.keys[novaKey] = { expires: expira, used_by: null, type: tipo };

            await githubApi.patch(`/gists/${GIST_ID}`, {
                files: { [fileName]: { content: JSON.stringify(content) } }
            });

            msg.reply(`✅ **Key ${tipo.toUpperCase()} Gerada:** \`${novaKey}\``);
        } catch (e) { msg.reply('❌ Erro no Gist.'); }
    }

    if (msg.content.startsWith('!banir ')) {
        const keyBan = msg.content.split(' ')[1];
        try {
            const { fileName, content } = await getGist();
            delete content.keys[keyBan];
            await githubApi.patch(`/gists/${GIST_ID}`, {
                files: { [fileName]: { content: JSON.stringify(content) } }
            });
            msg.reply(`🚫 Key \`${keyBan}\` foi deletada e banida.`);
        } catch (e) { msg.reply('❌ Erro ao banir.'); }
    }

    if (msg.content === '!clientes') {
        try {
            const { content } = await getGist();
            let lista = "📋 **Lista de Keys Ativas:**\n\n";
            for (let k in content.keys) {
                lista += `🔑 \`${k}\` | 👤 \`${content.keys[k].used_by || "Livre"}\` | ⏳ \`${content.keys[k].type}\`\n`;
            }
            msg.reply(lista || "Nenhuma key encontrada.");
        } catch (e) { msg.reply('❌ Erro ao listar.'); }
    }
});

client.once('ready', () => console.log('SISTEMA ONLINE E BOT LOGADO!'));
client.login(DISCORD_TOKEN);
app.listen(3000);
