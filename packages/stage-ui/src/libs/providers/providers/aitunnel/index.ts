import { createChatProvider, createEmbedProvider, createModelProvider, merge } from '@xsai-ext/providers/utils'
import { z } from 'zod'

import { ProviderValidationCheck } from '../../types'
import { createOpenAICompatibleValidators } from '../../validators'
import { defineProvider } from '../registry'

const aiTunnelConfigSchema = z.object({
  apiKey: z
    .string('API Key'),
  baseUrl: z
    .string('Base URL')
    .optional()
    .default('https://api.aitunnel.ru/v1/'),
})

type AITunnelConfig = z.input<typeof aiTunnelConfigSchema>

export const providerAITunnel = defineProvider<AITunnelConfig>({
  id: 'aitunnel',
  order: 2,
  name: 'AITunnel (RU)',
  nameLocalize: ({ t }) => t('settings.pages.providers.provider.aitunnel.title'),
  description: 'aitunnel.ru',
  descriptionLocalize: ({ t }) => t('settings.pages.providers.provider.aitunnel.description'),
  tasks: ['chat'],
  icon: 'i-lobe-icons:openai',

  createProviderConfig: ({ t }) => aiTunnelConfigSchema.extend({
    apiKey: aiTunnelConfigSchema.shape.apiKey.meta({
      labelLocalized: t('settings.pages.providers.catalog.edit.config.common.fields.field.api-key.label'),
      descriptionLocalized: t('settings.pages.providers.catalog.edit.config.common.fields.field.api-key.description'),
      placeholderLocalized: t('settings.pages.providers.catalog.edit.config.common.fields.field.api-key.placeholder'),
      type: 'password',
    }),
    baseUrl: aiTunnelConfigSchema.shape.baseUrl.meta({
      labelLocalized: t('settings.pages.providers.catalog.edit.config.common.fields.field.base-url.label'),
      descriptionLocalized: t('settings.pages.providers.catalog.edit.config.common.fields.field.base-url.description'),
      placeholderLocalized: t('settings.pages.providers.catalog.edit.config.common.fields.field.base-url.placeholder'),
    }),
  }),
  createProvider(config) {
    return merge(
      createChatProvider({ apiKey: config.apiKey, baseURL: config.baseUrl! }),
      createEmbedProvider({ apiKey: config.apiKey, baseURL: config.baseUrl! }),
      createModelProvider({ apiKey: config.apiKey, baseURL: config.baseUrl! }),
    )
  },

  validationRequiredWhen(config) {
    return !!config.apiKey?.trim()
  },
  validators: {
    ...createOpenAICompatibleValidators({
      checks: [ProviderValidationCheck.ModelList, ProviderValidationCheck.ChatCompletions],
    }),
  },
})
