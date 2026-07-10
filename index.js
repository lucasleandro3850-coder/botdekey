// --- Rota de Verificação Inteligente ---
app.get('/verificar', async (req, res) => {
    try {
        const { content } = await getGist();
        const key = req.query.key;

        if (content.keys[key]) {
            const info = content.keys[key];
            if (info.expires !== -1 && Date.now() > info.expires) return res.send("INVALID");

            // Busca o seu menu principal no Gist
            const scriptRes = await axios.get(SCRIPT_URL);
            let scriptOriginal = scriptRes.data;

            // INJETA O SINAL DE BANIMENTO NO TOPO DO SCRIPT AUTOMATICAMENTE
            const codigoSeguranca = `
                task.spawn(function()
                    local function check()
                        local s, r = pcall(function() return game:HttpGet("${process.env.RENDER_EXTERNAL_URL}/checar?key=${key}&t="..tick()) end)
                        if s and r == "INVALID" then 
                            game.Players.LocalPlayer:Kick("\\n[SISTEMA]\\nACESSO REVOGADO PELO ADM!") 
                        end
                    end
                    while task.wait(5) do check() end
                end);
            `;

            // Envia o código de segurança + o seu menu
            res.send(codigoSeguranca + scriptOriginal);
        } else {
            res.send("INVALID");
        }
    } catch (e) { res.send('ERROR'); }
});
