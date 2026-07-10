app.get('/verificar', async (req, res) => {
    try {
        const { content } = await getGist();
        const key = req.query.key;

        if (content.keys[key]) {
            const info = content.keys[key];
            const agora = Date.now();
            
            if (info.expires !== -1 && agora > info.expires) return res.send("INVALID");

            // Calcula o tempo restante
            let tempoRestante = "Permanente";
            if (info.expires !== -1) {
                const horas = Math.floor((info.expires - agora) / (1000 * 60 * 60));
                tempoRestante = `${horas} horas restantes`;
            }

            // Busca seu menu no Gist
            const scriptRes = await axios.get(SCRIPT_URL);
            
            // Injeta o Vigia e a Informação do Tempo
            const codigoSeguranca = `
                task.spawn(function()
                    local player = game.Players.LocalPlayer
                    local checkUrl = "https://${process.env.RENDER_EXTERNAL_HOSTNAME}/checar?key=${key}&nocache="
                    while task.wait(5) do
                        local s, r = pcall(function() return game:HttpGet(checkUrl .. tostring(tick())) end)
                        if s and r == "INVALID" then
                            player:Kick("\\n[NIPOCOS SYSTEM]\\nACESSO REVOGADO OU EXPIRADO!")
                            break
                        end
                    end
                end);
            `;

            // Envia o tempo restante e o script separados por uma tag especial (|||)
            res.send(`${tempoRestante}|||${codigoSeguranca}${scriptRes.data}`);
        } else {
            res.send("INVALID");
        }
    } catch (e) { res.send('ERROR'); }
});
