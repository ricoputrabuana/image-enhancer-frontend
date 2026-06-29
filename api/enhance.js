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
    const HF_URL = 'https://ricoputra1708-image-enhancer.hf.space';

    // Step 1: Upload ke /gradio_api/upload
    const { FormData, Blob } = await import('node:buffer').catch(() => ({}));
    
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

    // Step 2: Queue predict via /gradio_api/queue/join
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
        trigger_id: null,
        session_hash: Math.random().toString(36).substring(2),
      }),
    });

    if (!joinRes.ok) {
      const text = await joinRes.text();
      throw new Error(`Queue join gagal ${joinRes.status}: ${text}`);
    }

    const joinData = await joinRes.json();
    const eventId = joinData.event_id;

    // Step 3: Listen SSE untuk hasil
    const dataRes = await fetch(
      `${HF_URL}/gradio_api/queue/data?session_hash=${joinData.session_hash || ''}`,
      { headers: { Accept: 'text/event-stream' } }
    );

    const reader = dataRes.body.getReader();
    const decoder = new TextDecoder();
    let outputUrl = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const json = JSON.parse(line.slice(5));
          if (json.msg === 'process_completed' && json.event_id === eventId) {
            const output = json.output?.data?.[0];
            outputUrl = output?.url || `${HF_URL}/gradio_api/file=${output?.path}`;
            break;
          }
        } catch {}
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
