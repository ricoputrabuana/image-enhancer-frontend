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
    console.log('upload ok, filePath:', filePath);

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
    console.log('join ok, event_id:', joinData.event_id);

    // Step 3: Baca SSE stream
    const sseRes = await fetch(
      `${HF_URL}/gradio_api/queue/data?session_hash=${session_hash}`,
      { headers: { Accept: 'text/event-stream' } }
    );

    if (!sseRes.ok) throw new Error(`SSE gagal: ${sseRes.status}`);

    let outputUrl = null;
    let sseBuffer = '';

    for await (const chunk of sseRes.body) {
      sseBuffer += new TextDecoder().decode(chunk);
      const parts = sseBuffer.split('\n\n');
      sseBuffer = parts.pop();

      for (const part of parts) {
        const dataLine = part.split('\n').find(l => l.startsWith('data:'));
        if (!dataLine) continue;

        try {
          const json = JSON.parse(dataLine.slice(5));

          // Log SEMUA event lengkap
          console.log('SSE full:', JSON.stringify(json));

          if (json.msg === 'process_completed') {
            const rawOutput = json.output;
            console.log('raw output:', JSON.stringify(rawOutput));

            // Coba semua kemungkinan struktur output
            const data = rawOutput?.data;
            if (Array.isArray(data) && data.length > 0) {
              const output = data[0];
              console.log('output[0]:', JSON.stringify(output));
              if (typeof output === 'string') {
                outputUrl = output;
              } else if (output?.url) {
                outputUrl = output.url;
              } else if (output?.path) {
                outputUrl = `${HF_URL}/gradio_api/file=${output.path}`;
              }
            }
            break;
          }

          if (json.msg === 'close_stream') break;

        } catch(e) {
          console.log('parse error:', e.message, 'raw part:', part);
        }
      }

      if (outputUrl) break;
    }

    console.log('final outputUrl:', outputUrl);

    if (!outputUrl) throw new Error('Tidak dapat hasil dari HF Space');

    res.status(200).json({ url: outputUrl });

  } catch (err) {
    console.error('enhance error:', err);
    res.status(500).json({ error: err.message });
  }
}
