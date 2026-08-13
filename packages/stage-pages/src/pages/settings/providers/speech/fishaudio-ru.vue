<script setup lang="ts">
import type { SpeechProvider } from '@xsai-ext/providers/utils'

import {
  SpeechPlaygroundOpenAICompatible,
  SpeechProviderSettings,
} from '@proj-airi/stage-ui/components'
import { useSpeechStore } from '@proj-airi/stage-ui/stores/modules/speech'
import { useProviderConfigStore } from '@proj-airi/stage-ui/stores/providers/config'
import { useProviderStore } from '@proj-airi/stage-ui/stores/providers/provider'
import { FieldInput } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'

const speechStore = useSpeechStore()
const providersStore = useProviderStore()
const providerStore = useProviderConfigStore()
const { configs: providers } = storeToRefs(providerStore)

const providerId = 'fishaudio-ru'
const defaultModel = 'fishaudio-s21pro-flash'
const defaultVoice = 'dec6afac-bd01-4f4f-88ab-6f020340e32f'

const model = computed({
  get: () => {
    const raw = providers.value[providerId]?.model as string | undefined | null
    return raw ?? defaultModel
  },
  set: (value) => {
    if (!providers.value[providerId])
      providers.value[providerId] = {}
    providers.value[providerId].model = value
  },
})

const voice = computed({
  get: () => {
    const raw = providers.value[providerId]?.voice as string | undefined | null
    return raw ?? defaultVoice
  },
  set: (value) => {
    if (!providers.value[providerId])
      providers.value[providerId] = {}
    providers.value[providerId].voice = value
  },
})

const apiKeyConfigured = computed(() => Boolean(providers.value[providerId]?.apiKey?.trim() || providerStore.getProvider(providerId)?.status === 'configured'))

onMounted(() => {
  providers.value[providerId] ??= {}
  providers.value[providerId].model ??= defaultModel
  providers.value[providerId].voice ??= defaultVoice
})

async function handleGenerateSpeech(input: string, voiceId: string, _useSSML: boolean, modelId?: string) {
  await providersStore.disposeProviderInstance(providerId)
  const provider = await providersStore.getProviderInstance<SpeechProvider<string>>(providerId)
  if (!provider) {
    throw new Error('Не удалось инициализировать FishAudio (RU) провайдер')
  }

  const providerConfig = providerStore.getProviderConfig(providerId)
  const modelToUse = modelId || model.value || defaultModel
  const voiceToUse = voiceId || voice.value || defaultVoice

  return await speechStore.speech(
    provider,
    modelToUse,
    input,
    voiceToUse,
    {
      ...providerConfig,
    },
  )
}
</script>

<template>
  <SpeechProviderSettings
    :provider-id="providerId"
    :default-model="defaultModel"
  >
    <template #voice-settings>
      <FieldInput
        v-model="model"
        label="Модель"
        description="Модель озвучки (fishaudio-s21pro-flash или fishaudio-s21pro)"
        placeholder="fishaudio-s21pro-flash"
      />
    </template>

    <template #playground>
      <SpeechPlaygroundOpenAICompatible
        :generate-speech="handleGenerateSpeech"
        :api-key-configured="apiKeyConfigured"
        default-text="Привет! Это проверка синтеза речи FishAudio (RU)."
      />
    </template>
  </SpeechProviderSettings>
</template>

<route lang="yaml">
meta:
  layout: settings
  stageTransition:
    name: slide
</route>
