'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { getEmbedding } from '@/lib/get-embedding'
import { upsertVectors } from '@/lib/pinecone'

import { cn } from '@/lib/utils'
import { nanoid } from 'nanoid'

import React, { useRef, useState } from 'react'

export const runtime = 'edge'

export default function TrainPage() {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { toast } = useToast()

  const fileInput = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!fileInput.current?.files) return
    const file = fileInput.current.files[0]

    setIsLoading(true)

    if (!file && !text) {
      toast({
        variant: 'destructive',
        title: 'Could not upload',
        description: 'Please input a file or text to upload'
      })
    } else if (file) {
      let formData = new FormData()
      formData.append('file', file)

      fetch('https://ise-chatbot.herokuapp.com/embed', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          console.log(data)
          toast({
            title: 'Successfully uploaded file',
            description:
              'The file you uploaded will be available in the chat interface within 5 minutes'
          })
        })
        .catch(error => {
          toast({
            title: 'Could not upload',
            variant: 'destructive'
          })
        })
    } else if (text) {
      setIsLoading(true)
      const embedding = await getEmbedding({
        input: text
      })

      if (!embedding) {
        toast({
          variant: 'destructive',
          title: 'Error uploading text',
          description: 'Could not generate embedding for text, please try again'
        })
      } else {
        try {
          await upsertVectors([
            {
              id: nanoid(),
              values: embedding,
              metadata: {
                text
              }
            }
          ])

          toast({
            title: 'Successfully uploaded text',
            description:
              'The text you uploaded will be available in the chat interface within 5 minutes'
          })
        } catch {
          toast({
            variant: 'destructive',
            title: 'Error uploading text',
            description: 'Could not upload text, please try again'
          })
        }
      }
    }
    setIsLoading(false)
  }

  return (
    <div className={cn('pb-[200px] pt-4 md:pt-10')}>
      <div className="mx-auto mb-4 max-w-2xl px-4">
        <div className="bg-background rounded-lg border p-8">
          <h1 className="mb-2 text-lg font-semibold">Upload a File</h1>
          <p className="text-muted-foreground mb-2 leading-normal">
            You can upload a PDF, DOCX, MP4, or PPTX file{' '}
          </p>
          <Input
            type="file"
            accept=".pdf,.mp4,.pptx,.docx"
            ref={fileInput}
            onChange={e => {
              if (e.target.files) {
                setFile(e.target.files[0])
              } else {
                setFile(null)
              }
            }}
            disabled={text !== null}
          />
          <p className="text-muted-foreground mb-2 mt-4 leading-normal">
            Or just paste in the text!{' '}
          </p>
          <Textarea
            placeholder="Paste text here"
            onChange={e => setText((e.target as HTMLTextAreaElement).value)}
            value={text ?? ''}
            className="mb-4"
            disabled={file !== null}
          />
          <div className="flex w-full items-center justify-end">
            <Button
              className="h-10"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
