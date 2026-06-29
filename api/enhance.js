export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const contentType = req.headers['content-type'];

    // Step 1: Upload ke HF Space
    const uploadRes = await fetch(
      'https://ricoputra1708-image-enhancer.hf.space/upload',
      {
        method: 'POST',
        body: buffer,
        headers: {
          'Content-Type': contentType,
        },
      }
    );

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      throw new Error(`Upload HF gagal ${uploadRes.status}: ${text}`);
    }

    const uploadData = await uploadRes.json();
    const filePath = uploadData[0];

    // Step 2: Predict
    const predictRes = await fetch(
      'https://ricoputra1708-image-enhancer.hf.space/run/enhance_image',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{ path: filePath, meta: { _type: 'gradio.FileData' } }],
        }),
      }
    );

    if (!predictRes.ok) {
      const text = await predictRes.text();
      throw new Error(`Predict HF gagal ${predictRes.status}: ${text}`);
    }

    const predictData = await predictRes.json();
    const outputUrl = `https://ricoputra1708-image-enhancer.hf.space/file=${predictData.data[0].path}`;

    res.status(200).json({ url: outputUrl });

  } catch (err) {
    console.error('enhance error:', err);
    res.status(500).json({ error: err.message });
  }
}
