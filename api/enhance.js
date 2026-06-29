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
    const HF_URL = 'https://ricoputra1708-image-enhancer.hf.space';
    const session_hash = Math.random().toString(36).substring(2, 12);

    // Step 1: Baca dan parse multipart body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const contentType = req.headers['content-type'];

    // Extract boundary dari content-type
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) throw new Error('Tidak ada boundary di content-type');
    const boundary = boundaryMatch[1];

    // Parse multipart — ambil pure image bytes saja
    const boundaryBuf = Buffer.from('--' + boundary);
    const parts = [];
    let start = 0;

    while (start < buffer.length) {
      const boundaryIdx = buffer.indexOf(boundaryBuf, start);
      if (boundaryIdx === -1) break;
      const headerStart = boundaryIdx + boundaryBuf.length + 2; // skip \r\n
      const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), headerStart);
      if (headerEnd === -1) break;
      const header = buffer.slice(headerStart, headerEnd).toString();
      const dataStart = headerEnd + 4; // skip \r\n\r\n
      const nextBoundary = buffer.indexOf(boundaryBuf, dataStart);
      if (nextBoundary === -1) break;
      const dataEnd = nextBoundary - 2; // skip \r\n sebelum boundary
      if (header.includes('filename')) {
        parts.push({
          header,
          data: buffer.slice(dataStart, dataEnd),
        });
      }
      start = nextBoundary;
    }

    if (parts.length === 0) throw new Error('Tidak ada file di request');

    const imageBuffer = parts[0].data;
    const mimeMatch = parts[0].header.match(/Content-Type:\s*(.+)/i);
    const mimeType = mimeMatch ? mimeMatch[1].trim() : 'image/jpeg';

    console.log('image size:', imageBuffer.length, 'mime:', mimeType);

    // Step 2: Upload pure image ke HF Space
    const form = new globalThis.FormData();
    const blob = new Blob([imageBuffer], { type: mimeType });
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

    // Step 3: Queue join
    const joinRes = await fetch(`${HF_URL}/gradio_api/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          path: filePath,
          url: `${HF_URL}/gradio_api/file=${filePath}`,
          orig_name: 'image.jpg',
          mime_type: mimeType,
          meta: { _type: 'gradio.FileData' },
        }],
        fn_index: 0,
        session_hash,
        trigger_id: null,
      }),
    });

    if (!joinRes.ok) throw new Error(`Queue join gagal: ${joinRes.status}`);
    const joinData = await joinRes.json();
    console.log('join ok, event_id:', joinData.event_id);

    // Step 4: Baca SSE stream
    const sseRes = await fetch(
      `${HF_URL}/gradio_api/queue/data?session_hash=${session_hash}`,
      { headers: { Accept: 'text/event-stream' } }
    );

    if (!sseRes.ok) throw new Error(`SSE gagal: ${sseRes.status}`);

    let outputUrl = null;
    let sseBuffer = '';

    for await (const chunk of sseRes.body) {
      sseBuffer += new TextDecoder().decode(chunk);
      const parts2 = sseBuffer.split('\n\n');
      sseBuffer = parts2.pop();

      for (const part of parts2) {
        const dataLine = part.split('\n').find(l => l.startsWith('data:'));
        if (!dataLine) continue;
        try {
          const json = JSON.parse(dataLine.slice(5));
          console.log('SSE:', json.msg, JSON.stringify(json.output || ''));

          if (json.msg === 'process_completed') {
            const data = json.output?.data;
            if (Array.isArray(data) && data[0]) {
              const out = data[0];
              outputUrl = out.url || `${HF_URL}/gradio_api/file=${out.path}`;
            }
            break;
          }
          if (json.msg === 'close_stream') break;
        } catch(e) {}
      }
      if (outputUrl) break;
    }

    console.log('outputUrl:', outputUrl);
    if (!outputUrl) throw new Error('Tidak dapat hasil dari HF Space');

    res.status(200).json({ url: outputUrl });

  } catch (err) {
    console.error('enhance error:', err);
    res.status(500).json({ error: err.message });
  }
}
