import type { ComposerTranslation } from 'vue-i18n'
import { z } from 'zod'
import { defineProvider } from '../registry'

const fishAudioRuConfigSchema = z.object({
  apiKey: z.string(),
  baseUrl: z.string().default('https://fishaudio.org/api/open/v1/speech/'),
})

type FishAudioRuConfig = z.input<typeof fishAudioRuConfigSchema>

export const providerFishAudioRu = defineProvider<FishAudioRuConfig>({
  id: 'fishaudio-ru',
  name: 'FishAudio (RU)',
  nameLocalize: () => 'FishAudio (RU)',
  description: 'fishaudio.org/ru/',
  descriptionLocalize: () => 'Российский сервис синтеза речи на базе технологий Fish Audio',
  tasks: ['text-to-speech'],
  icon: 'i-solar:soundwave-bold-duotone',

  createProviderConfig: ({ t }) => fishAudioRuConfigSchema.extend({
    apiKey: fishAudioRuConfigSchema.shape.apiKey.meta({
      labelLocalized: t('settings.pages.providers.catalog.edit.config.common.fields.field.api-key.label'),
      descriptionLocalized: 'API-ключ с сайта fishaudio.org',
      placeholderLocalized: 'Вставьте ваш API-ключ fishaudio.org',
      type: 'password',
    }),
    baseUrl: fishAudioRuConfigSchema.shape.baseUrl.meta({
      labelLocalized: t('settings.pages.providers.catalog.edit.config.common.fields.field.base-url.label'),
      descriptionLocalized: 'Эндпоинт API fishaudio.org',
      placeholderLocalized: 'https://fishaudio.org/api/open/v1/speech/',
    }),
  }),

  createProvider(config) {
    const apiKey = config?.apiKey?.trim() ?? ''
    const rawUrl = config?.baseUrl?.trim() || 'https://fishaudio.org/api/open/v1/speech/'
    const baseUrl = rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`

    return {
      speech: (model: string) => ({
        apiKey,
        baseURL: baseUrl,
        model,
        execute: async (options: { input?: string, text?: string, voice?: string, voiceId?: string, modelId?: string, [key: string]: unknown }) => {
          const body = {
            text: options.input || options.text || '',
            voiceId: options.voice || options.voiceId || '',
            modelId: model || options.modelId || 'fishaudio-s21pro-flash',
          }
          const fetchUrl = `${baseUrl}tts`
          const res = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          })
          if (!res.ok) {
            const errText = await res.text()
            throw new Error(`FishAudio (RU) вернул ошибку ${res.status}: ${errText}`)
          }
          return await res.arrayBuffer()
        },
      }),
    }
  },

  validationRequiredWhen: config => Boolean(config.apiKey?.trim()),
  validators: {
    validateConfig: [
      () => ({
        id: 'fishaudio-ru:check-config',
        name: 'Проверка конфигурации',
        validator: async (config: FishAudioRuConfig) => {
          const apiKey = config.apiKey?.trim() ?? ''
          if (!apiKey) {
            return {
              valid: false,
              errors: [{ error: new Error('API key is required.') }],
              reason: 'Введите API-ключ fishaudio.org',
              reasonKey: '',
            }
          }
          return { valid: true, errors: [], reason: '', reasonKey: '' }
        },
      }),
    ],
  },
  extraMethods: {
    listModels: async () => [
      {
        id: 'fishaudio-s21pro-flash',
        name: 'FishAudio S2.1 Pro Flash',
        provider: 'fishaudio-ru',
        description: 'Быстрый синтез речи FishAudio',
        contextLength: 0,
        deprecated: false,
      },
      {
        id: 'fishaudio-s21pro',
        name: 'FishAudio S2.1 Pro',
        provider: 'fishaudio-ru',
        description: 'Высокое качество синтеза FishAudio',
        contextLength: 0,
        deprecated: false,
      },
    ],
    listVoices: async () => [],
  },
})
