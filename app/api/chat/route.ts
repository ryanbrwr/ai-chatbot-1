import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'
import { ChatCompletionRequestMessage } from 'openai-edge/types/types/chat'

let ChatMessage: ChatCompletionRequestMessage = {
  content: 'Hello, how are you?',
  role: 'user'
}

import { auth } from '@/auth'

import { getEmbedding } from '@/lib/get-embedding'
import { queryPinecone } from '@/lib/pinecone'
import { composePrompt } from '@/lib/compose-prompt'
import { nanoid } from 'nanoid'

export const runtime = 'edge'

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const session = await auth()

  if (process.env.VERCEL_ENV !== 'preview') {
    if (session == null) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const configuration = new Configuration({
    apiKey: previewToken || process.env.OPENAI_API_KEY
  })

  const openai = new OpenAIApi(configuration)

  const context = await composePrompt(messages[messages.length - 1].content)

  const systemPrompts: ChatCompletionRequestMessage[] = [
    {
      role: 'system',
      content:
        'You are a search engine for the Student Management Group, an international exchange company, and you are trying to help prospective students and agent get information about the program. All of your information is given in the context, if you do not know the answer, and it is not provided in the context, respond "I dont know"'
    },
    {
      role: 'system',
      content: 'Context: \n' + context.substring(0, 4000)
    }
  ]

  // first message is a system prompt
  messages.unshift(systemPrompts[1])
  messages.unshift(systemPrompts[0])

  console.log(messages)

  try {
    const res = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 1,
      stream: true
    })
    console.log(res)

    try {
      const stream = OpenAIStream(res, {
        async onCompletion(completion) {
          const title = json.messages[0].content.substring(0, 100)
          const userId = session?.user.id
          if (userId) {
            const id = json.id ?? nanoid()
            const createdAt = Date.now()
            const path = `/chat/${id}`
            const payload = {
              id,
              title,
              userId,
              createdAt,
              path,
              messages: [
                ...messages,
                {
                  content: completion,
                  role: 'assistant'
                }
              ]
            }
            await kv.hmset(`chat:${id}`, payload)
            await kv.zadd(`user:chat:${userId}`, {
              score: createdAt,
              member: `chat:${id}`
            })
          }
        }
      })
      return new StreamingTextResponse(stream)
    } catch (err) {
      console.log(err)
      console.error(err)
      return null
    }
  } catch (err: any) {
    console.log(err.message)
    console.error(err)
    return null
  }
}
