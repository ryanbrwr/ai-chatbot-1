import { getEmbedding } from './get-embedding'
import { queryPinecone } from './pinecone'

export async function composePrompt(question: string): Promise<string> {
  let questionEmbedding = await getEmbedding({
    input: question
  })

  if (!questionEmbedding) {
    return ''
  }

  let mostRelevantDocumentSections = await queryPinecone(questionEmbedding, 15)

  let chosenSections: string[] = []
  let chosenSectionsLen: number = 0

  const MAX_SECTION_TOKENS: number = 2048
  const SEPARATOR: string = '\n\n---\n\n'
  let separatorTokens: number = countWords(SEPARATOR)

  function countWords(text: string): number {
    // Split the text into words using a regular expression and count the number of matches
    return text.match(/\S+/g)?.length || 0
  }

  for (let { id, score, metadata } of mostRelevantDocumentSections) {
    // Add contexts until we run out of space.
    let sectionTokens: number = countWords(metadata.text) + separatorTokens

    if (chosenSectionsLen + sectionTokens > MAX_SECTION_TOKENS) {
      break
    }

    chosenSections.push(SEPARATOR + metadata.text)
    chosenSectionsLen += sectionTokens
  }

  return chosenSections.join('')
}
