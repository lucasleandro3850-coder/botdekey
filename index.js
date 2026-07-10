const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
const app = express();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GIST_ID = process.env.GIST_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// --- SEU SCRIPT OFUSCADO AQUI ---
const MEU_MENU_OFUSCADO = `
https://gist.githubusercontent.com/lucasleandro3850-coder/afe334f158cdd53301d8b642bafa855d/raw/9cf877bc728266b94d616822ae8589ff47f149fb/script.lua
`;
// --------------------------------

app.get('/verificar', async (req, res) => {
    try {
        const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
        const data = JSON.parse(response.data.files['keys.json'].content);
        if (data.keys.includes(req.query.key)) {
            res.send(MEU_MENU_OFUSCADO); // Entrega o menu se a key for válida
        } else {
            res.send("game.Players.LocalPlayer:Kick('Key Invalida')");
        }
    } catch { res.send("game.Players.LocalPlayer:Kick('Erro no Servidor')"); }
});

// [O restante do código do Bot que você já tinha...]
// (Pode manter os comandos /gerar e /banir abaixo normalmente)

client.login(DISCORD_TOKEN);
app.listen(3000);
