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

    // Konversi buffer ke base64
    const base64 = buffer.toString('base64');
    const mime = contentType.split(';')[0].split('boundary=')[0].trim();

    // Gradio versi lama: kirim base64 langsung ke /api/predict
    const predictRes = await fetch(
      'https://ricoputra1708-image-enhancer.hf.space/api/predict',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [`data:${mime};base64,${base64}`],
          fn_index: 0,
        }),
      }
    );

    if (!predictRes.ok) {
      const text = await predictRes.text();
      throw new Error(`Predict gagal ${predictRes.status}: ${text}`);
    }

    const predictData = await predictRes.json();
    console.log('predict response:', JSON.stringify(predictData));

    // Ambil URL output
    const output = predictData.data[0];
    const outputUrl = typeof output === 'string'
      ? output
      : output?.url || `https://ricoputra1708-image-enhancer.hf.space/file=${output?.path}`;

    res.status(200).json({ url: outputUrl });

  } catch (err) {
    console.error('enhance error:', err);
    res.status(500).json({ error: err.message });
  }
}
