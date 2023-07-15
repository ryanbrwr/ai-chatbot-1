export async function getEmbedding({
  input,
  model
}: {
  input: string
  model?: string
}): Promise<number[] | null> {
  const url = 'https://api.openai.com/v1/embeddings'
  const OPENAI_API_KEY = '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'

  const body = {
    input,
    model: 'text-embedding-ada-002'
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    })

    const data = await res.json()

    return data.data[0].embedding
  } catch (err) {
    console.log(err)
    console.error(err)
    return null
  }
}
