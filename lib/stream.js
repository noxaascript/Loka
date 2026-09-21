export function sseHead(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });
}

export function sseSend(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function sseDone(res) {
  res.write('data: [DONE]\n\n');
  res.end();
}
