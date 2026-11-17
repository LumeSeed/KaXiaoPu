<template>
  <span class="store-price" :title="currency || siteCurrency"><span class="store-price-currency">{{ symbol }}</span><span class="store-price-amount">{{ formatPrice(amount, '') }}</span></span>
</template>

<script setup lang="ts">
import { useLocalized } from '../composables/useProduct'
import { computed } from 'vue'

const props = defineProps<{ amount: string | number | null | undefined; currency?: string }>()
const { formatPrice, siteCurrency } = useLocalized()
const symbol = computed(() => {
  const currency = props.currency || siteCurrency.value
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find(part => part.type === 'currency')?.value || currency
  } catch { return currency }
})
</script>
