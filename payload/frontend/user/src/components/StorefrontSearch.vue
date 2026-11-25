<template>
  <form class="store-search" role="search" @submit.prevent="submit">
    <Search class="h-4 w-4 shrink-0" aria-hidden="true" />
    <input v-model="query" type="search" :aria-label="t('products.searchLabel')"
      :placeholder="t('storefront.searchProducts')" />
    <button type="submit" :aria-label="t('products.searchLabel')"><ArrowRight class="h-4 w-4" /></button>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search, ArrowRight } from 'lucide-vue-next'
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const query = ref('')
watch(() => route.query.q, value => { query.value = typeof value === 'string' ? value : '' }, { immediate: true })
const submit = () => {
  const isCatalog = ['home', 'products', 'category-products'].includes(String(route.name))
  const nextQuery = isCatalog ? { ...route.query } : {}
  delete nextQuery.page
  delete nextQuery.q
  if (query.value.trim()) nextQuery.q = query.value.trim()
  return router.push({ path: isCatalog ? route.path : '/products', query: nextQuery })
}
</script>
