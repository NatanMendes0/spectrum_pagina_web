export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY nao configurada.' });
    return;
  }

  const userInterests = (req.body?.userInterests || '').trim();
  if (!userInterests) {
    res.status(400).json({ error: 'Interesses nao informados.' });
    return;
  }

  const prompt = `Voce e um especialista em design de produtos inclusivos e impressao 3D, trabalhando para a "Spectrum 3D".
O usuario deseja criar um brinquedo ou objeto sensorial personalizado (impresso em 3D) para uma pessoa (frequentemente com TEA).
Eles forneceram os seguintes interesses e necessidades sensoriais: "${userInterests}".

Com base nisso, sugira 1 (uma) ideia criativa e viavel para impressao 3D (usando plastico PLA ou TPU flexivel) que ajude na regulacao sensorial ou foco.
Responda diretamente em HTML (sem tags <html> ou <body>, apenas o conteudo interno) usando <strong> para destaques e <ul>/<li> para listas. Nao use blocos de codigo Markdown (como \`\`\`html).
Estruture sua resposta assim:
1. <strong class="text-slate-900">Nome do Brinquedo:</strong> [Nome criativo] <br><br>
2. <strong class="text-slate-900">Visual e Formato:</strong> [Descreva a aparencia] <br><br>
3. <strong class="text-slate-900">Mecanismo Sensorial:</strong> [Explique as texturas, partes moveis, cliques, etc] <br><br>
4. <strong class="text-slate-900">Como ajuda no dia a dia:</strong> [Explique o beneficio para foco/regulacao]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const details = await response.text();
      res.status(response.status).json({ error: 'Erro na API Gemini.', details });
      return;
    }

    const data = await response.json();
    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      res.status(502).json({ error: 'Resposta invalida da IA.' });
      return;
    }

    const cleanHtml = textResponse.replace(/```html/g, '').replace(/```/g, '');
    res.status(200).json({ html: cleanHtml });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao gerar ideia.' });
  }
}
