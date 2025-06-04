import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Configuration, OpenAIApi } from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,  // .env dosyasına koymalısın
});
const openai = new OpenAIApi(configuration);

app.post("/api/convert", async (req, res) => {
  try {
    const { photoBase64, script, mix } = req.body;

    const prompt = `
Bir FiveM karakter oluşturma sistemi için gerçek bir insan fotoğrafını analiz et.
Script türü: ${script}
Genetik oran (Anne/Baba): ${(mix*100).toFixed(0)}% / ${(100 - mix*100).toFixed(0)}%
Fotoğraf: (burada sadece fotoğraf var ama metin olarak değil, analiz için metinsel tasvir yap)
Anne ve Baba için en uygun ID ve isimleri belirle, JSON formatında çıktı ver:
{
  "anne": {"id": X, "isim": "Y"},
  "baba": {"id": Z, "isim": "W"},
  "genetik_oran": {"anne": ${(mix*100).toFixed(0)}, "baba": ${(100 - mix*100).toFixed(0)}},
  "karakter_parametreleri": {
    "model": "mp_m_freemode_01",
    "parents": {
      "shapeFirst": X,
      "shapeSecond": Z,
      "shapeMix": ${mix.toFixed(2)},
      "skinFirst": X,
      "skinSecond": Z,
      "skinMix": 0.5
    }
  }
}
`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Sen bir FiveM karakter AI dönüşüm asistanısın." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const responseText = completion.data.choices[0].message.content;

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: "JSON parse error", raw: responseText };
    }

    res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});
