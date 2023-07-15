import { PineconeClient, QueryRequest } from '@pinecone-database/pinecone'
import { QueryOperationRequest } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch'

export async function queryPinecone(
  query_embedding: number[],
  num_results: number = 15
): Promise<Array<{ id: string; score: number; metadata: any }>> {
  const pinecone = new PineconeClient()
  await pinecone.init({
    environment: 'asia-southeast1-gcp',
    apiKey: '05d39086-e661-4e9c-83fc-dac206889bd5'
  })

  const index = pinecone.Index('ise')
  const requestParameters: QueryOperationRequest = {
    queryRequest: {
      topK: num_results,
      includeMetadata: true,
      vector: query_embedding
    }
  }

  const queryResponse = await index.query(requestParameters)

  if (!queryResponse.matches) {
    throw new Error('No results found')
  }

  return queryResponse.matches.map(match => ({
    id: match.id,
    score: match.score ?? 0,
    metadata: match.metadata
  }))
}

export async function upsertVectors(
  vectors: {
    id: string
    values: number[]
    metadata: {
      text: string
    }
  }[]
): Promise<void> {
  const pinecone = new PineconeClient()
  await pinecone.init({
    environment: 'asia-southeast1-gcp',
    apiKey: '05d39086-e661-4e9c-83fc-dac206889bd5'
  })

  const index = pinecone.Index('ise')

  await index.upsert({
    upsertRequest: {
      vectors
    }
  })
}
