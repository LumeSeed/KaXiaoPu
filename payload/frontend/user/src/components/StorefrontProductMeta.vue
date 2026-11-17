<template>
  <div class="store-product-badges">
    <span class="store-delivery">{{ getFulfillmentTypeLabel(product.fulfillment_type) }}</span>
    <span class="store-stock-text" :class="{ 'is-low': product.stock_status === 'low_stock', 'is-out': isSoldOut(product) }">
      <span>{{ t('quickBuy.stock') }}</span><strong>{{ stockText }}</strong>
    </span>
    <span v-if="product.purchase_type !== 'guest'" class="store-purchase-rule">{{ getPurchaseTypeLabel(product.purchase_type) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductLabels } from '../composables/useProduct'

const props = defineProps<{ product: any }>()
const { t } = useI18n()
const { getFulfillmentTypeLabel, getPurchaseTypeLabel, getStockStatusLabel, isSoldOut } = useProductLabels()
const stockText = computed(() => {
  const p = props.product
  if (!isSoldOut(p) && p.stock_status !== 'unlimited' && p.stock_display_mode === 'exact' && p.stock_quantity_hidden !== true) {
    const raw = p.fulfillment_type === 'auto' ? p.auto_stock_available : p.fulfillment_type === 'manual' ? p.manual_stock_available : undefined
    const count = Number(raw)
    if (raw != null && Number.isFinite(count) && count >= 0) return String(Math.floor(count))
  }
  return getStockStatusLabel(p)
})
</script>
