export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
  maxDuration: 60,
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

    const HF_URL = 'https://ricoputra1708-image-enhancer.hf.space';
    const session_hash = Math.random().toString(36).substring(2, 12);

    // Step 1: Upload
    const form = new globalThis.FormData();
    const blob = new Blob([buffer], { type: contentType.split(';')[0] });
    form.append('files', blob, 'image.jpg');

    const uploadRes = await fetch(`${HF_URL}/gradio_api/upload`, {
      method: 'POST',
      body: form,
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      throw new Error(`Upload gagal ${uploadRes.status}: ${text}`);
    }

    const uploadData = await uploadRes.json();
    const filePath = uploadData[0];

    // Step 2: Queue join
    const joinRes = await fetch(`${HF_URL}/gradio_api/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          path: filePath,
          meta: { _type: 'gradio.FileData' },
          orig_name: 'image.jpg',
          mime_type: 'image/jpeg',
        }],
        fn_index: 0,
        session_hash,
        trigger_id: null,
      }),
    });

    if (!joinRes.ok) throw new Error(`Queue join gagal: ${joinRes.status}`);
    const joinData = await joinRes.json();
    const event_id = joinData.event_id;

    // Step 3: Baca SSE stream sampai process_completed
    const sseRes = await fetch(
      `${HF_URL}/gradio_api/queue/data?session_hash=${session_hash}`,
      { headers: { Accept: 'text/event-stream' } }
    );

    if (!sseRes.ok) throw new Error(`SSE gagal: ${sseRes.status}`);

    let outputUrl = null;
    let buffer2 = '';

    for await (const chunk of sseRes.body) {
      buffer2 += new TextDecoder().decode(chunk);
      const parts = buffer2.split('\n\n');
      buffer2 = parts.pop();

      for (const part of parts) {
        const dataLine = part.split('\n').find(l => l.startsWith('data:'));
        if (!dataLine) continue;

        try {
          const json = JSON.parse(dataLine.slice(5));
          console.log('SSE msg:', json.msg, 'event_id:', json.event_id);

        if (json.msg === 'process_completed') {
          console.log('output raw:', JSON.stringify(json.output));
          const output = json.output?.data?.[0];
          // Pakai url langsung kalau ada, kalau tidak build dari path
          if (output?.url) {
            outputUrl = output.url;
          } else if (output?.path) {
            outputUrl = `${HF_URL}/gradio_api/file=${output.path}`;
          }
          break;
        }
        } catch(e) {
          console.log('parse error:', e.message);
        }
      }

      if (outputUrl) break;
    }

    if (!outputUrl) throw new Error('Tidak dapat hasil dari HF Space');

    res.status(200).json({ url: outputUrl });

  } catch (err) {
    console.error('enhance error:', err);
    res.status(500).json({ error: err.message });
  }
}
