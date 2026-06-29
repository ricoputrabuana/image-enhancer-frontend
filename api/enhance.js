const FormData = require('form-data');
const fetch = require('node-fetch');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if(req.method === 'OPTIONS') return res.status(200).end();

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    // Forward ke HF Space dari server (tidak ada CORS)
    const form = new FormData();
    form.append('files', buffer, {
      filename: 'image.jpg',
      contentType: req.headers['content-type'].split(';')[0],
    });

    const uploadRes = await fetch(
      'https://ricoputra1708-image-enhancer.hf.space/upload',
      { method: 'POST', body: form, headers: form.getHeaders() }
    );

    const uploadData = await uploadRes.json();
    const filePath = uploadData[0];

    const predictRes = await fetch(
      'https://ricoputra1708-image-enhancer.hf.space/run/enhance_image',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{ path: filePath, meta: { _type: 'gradio.FileData' } }]
        }),
      }
    );

    const predictData = await predictRes.json();
    const outputUrl = `https://ricoputra1708-image-enhancer.hf.space/file=${predictData.data[0].path}`;

    res.json({ url: outputUrl });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}
