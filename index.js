const express = require('express');
const axios = require('axios');
const app = express();

// LINK RAW DO SEU GIST AQUI
const GIST_URL = 'LINK_DO_SEU_RAW_GIST_AQUI';

app.get('/verificar', async (req, res) => {
    const key = req.query.key;
    try {
        const response = await axios.get(GIST_URL);
        if (response.data.includes(key)) {
            res.send('OK');
        } else {
            res.send('INVALID');
        }
    } catch (error) {
        res.send('ERROR');
    }
});

app.listen(process.env.PORT || 3000);
