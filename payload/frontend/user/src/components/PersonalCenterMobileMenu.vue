<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger class="catalog-mobile-trigger">
      <Menu class="h-4 w-4" aria-hidden="true" />
      <span>{{ t('storefront.accountMenu') }}</span>
      <span class="account-menu-current">{{ currentLabel }}</span>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="catalog-overlay" />
      <DialogContent class="catalog-sheet" :aria-describedby="undefined">
        <div class="catalog-sheet-heading">
          <DialogTitle>{{ t('storefront.accountMenu') }}</DialogTitle>
          <DialogClose :aria-label="t('storefront.closeMenu')"><X class="h-5 w-5" /></DialogClose>
        </div>
        <nav class="catalog-tree" :aria-label="t('storefront.accountMenu')">
          <button v-for="item in items" :key="item.key" type="button"
            class="catalog-category" :class="{ selected: currentSection === item.key }"
            :aria-current="currentSection === item.key ? 'page' : undefined" @click="select(item.key)">
            <component :is="item.icon" class="h-5 w-5" aria-hidden="true" />
            <span>{{ t(item.label) }}</span>
          </button>
        </nav>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DialogRoot, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose } from 'reka-ui'
import { Menu, X } from 'lucide-vue-next'
import type { PersonalSection, PersonalSectionItem } from '../composables/usePersonalCenter'

const props = defineProps<{ items: PersonalSectionItem[]; currentSection: PersonalSection }>()
const emit = defineEmits<{ select: [section: PersonalSection] }>()
const { t } = useI18n()
const open = ref(false)
const currentLabel = computed(() => {
  const item = props.items.find(item => item.key === props.currentSection)
  return item ? t(item.label) : ''
})
const select = (section: PersonalSection) => { open.value = false; emit('select', section) }
watch(() => props.currentSection, () => { open.value = false })
let desktop: MediaQueryList | undefined
const closeOnDesktop = () => { if (desktop?.matches) open.value = false }
onMounted(() => {
  desktop = window.matchMedia('(min-width: 1024px)')
  desktop.addEventListener('change', closeOnDesktop)
})
onUnmounted(() => desktop?.removeEventListener('change', closeOnDesktop))
</script>
