import { z } from 'zod'

// const ZSlideElement = z.object({
//   id: z.string(),
//   value: z.unknown(),
// })

// const ZSlideData = z.object({
//   text: z.array(z.string()).optional(),
//   elements: z.array(ZSlideElement).optional(),
// })

export const ZPowerpointPlaceholders = z.object({
  slide1: z.object({
    text: z.object({
      date: z.string(),
      title: z.string(),
      subtitle: z.string(),
    }),
  }),
  slide2: z.object({
    text: z.object({
      scenario: z.string(),
    }),
  }),
  slide4: z.object({
    text: z.object({
      layoutTitle: z.string(),
      layoutSubtitle: z.string(),
    }),
  }),
  slide6: z.object({
    text: z.object({
      layoutTitle: z.string(),
      layoutSubtitle: z.string(),
    }),
  }),
  slide8: z.object({
    text: z.object({
      layoutTitle: z.string(),
      layoutSubtitle: z.string(),
      title: z.string(),
      subtitle: z.string(),
    }),
    charts: z.array(z.object({
      placeholder: z.string(),
      data: z.unknown(),
      templateImageFileName: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })),
  }),
})

export type TPowerpointPlaceholders = z.infer<typeof ZPowerpointPlaceholders>
