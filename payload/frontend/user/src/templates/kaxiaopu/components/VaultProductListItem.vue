<template>
  <article
    class="store-product-row group flex items-center gap-3 border bg-card p-2.5 transition hover:border-hairline-strong hover:shadow-[var(--shadow-sm)] sm:gap-3.5 sm:p-3"
    :class="{ 'opacity-[0.74]': soldOut }"
  >
    <!-- Thumbnail -->
    <RouterLink :to="`/products/${product.slug}`" :aria-label="title"
      class="store-product-image relative grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-[11px] sm:h-16 sm:w-16"
      :class="coverClass"
    >
      <img v-if="coverImage" :src="coverImage" :alt="title" loading="lazy" class="absolute inset-0 h-full w-full object-cover" @error="imageErrored = true" />
      <Package v-else class="relative z-[1] h-6 w-6 text-white" />
      <span v-if="soldOut" class="absolute inset-0 grid place-items-center bg-black/55 text-[10px] font-bold text-white">{{ t('products.stockStatus.outOfStock') }}</span>
    </RouterLink>

    <!-- Info -->
    <div class="store-product-info flex min-w-0 flex-1 flex-col gap-1">
      <div class="flex min-w-0 items-center gap-1.5">
        <span v-if="categoryName" class="hidden max-w-[88px] flex-none truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">{{ categoryName }}</span>
        <span v-if="categoryName" class="hidden flex-none text-muted-foreground/40 sm:inline">·</span>
        <h3 class="truncate text-sm font-bold text-foreground"><RouterLink :to="`/products/${product.slug}`">{{ title }}</RouterLink></h3>
      </div>
      <p v-if="description" class="store-product-summary">{{ description }}</p>
      <StorefrontProductMeta :product="product" />
      <span v-if="priceSignal" class="store-price-signal" :class="priceSignal.tone">{{ priceSignal.label }}</span>
      <div v-if="!soldOut && product.tags?.length" class="store-product-tags"><span v-for="tag in product.tags.slice(0, 2)" :key="tag">{{ tag }}</span></div>
    </div>

    <!-- Price + actions -->
    <div class="store-product-actions flex flex-none items-center gap-2 sm:gap-3">
      <div class="text-right">
        <template v-if="promo">
          <StorefrontPrice :amount="getPromotionPriceAmount(product)" :currency="siteCurrency" />
          <span class="block text-[11px] font-semibold text-muted-foreground line-through">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
        </template>
        <StorefrontPrice v-else :amount="product.price_amount" :currency="siteCurrency" />
      </div>
      <button
        v-if="!soldOut"
        type="button"
        class="store-buy-button flex-none rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90"
        :aria-label="t('products.quickBuyAria')"
        @click.prevent.stop="$emit('quickBuy', product)"
      >
        <span>{{ t('storefront.buy') }}</span>
      </button>
      <ChevronRight class="hidden h-4 w-4 flex-none text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground sm:block" />
    </div>
  </article>
</template>

<script setup lang="ts">
import StorefrontProductMeta from '../../../components/StorefrontProductMeta.vue'
import StorefrontPrice from '../../../components/StorefrontPrice.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, Package } from 'lucide-vue-next'
import { getFirstImageUrl, getImageUrl } from '../../../utils/image'
import { useLocalized, useProductLabels } from '../../../composables/useProduct'

const props = withDefaults(defineProps<{ product: any; index?: number }>(), { index: 0 })

defineEmits<{ quickBuy: [product: any] }>()

const { t } = useI18n()
const { getLocalizedText, siteCurrency, formatPrice } = useLocalized()
const {
  isSoldOut, hasPromotionPrice, getPromotionPriceAmount, hasWholesalePrices, hasPromotionRules,
} = useProductLabels()

const covers = [
  'bg-[linear-gradient(135deg,#7b74f2,var(--red))]',
  'bg-[linear-gradient(135deg,#1cc0bf,var(--teal))]',
  'bg-[linear-gradient(135deg,#9b6cf5,var(--plum))]',
  'bg-[linear-gradient(135deg,#f7bd4e,var(--gold))]',
  'bg-[linear-gradient(135deg,#3a3950,var(--ink))]',
]
const coverClass = computed(() => covers[(props.index ?? 0) % covers.length])

const title = computed(() => getLocalizedText(props.product?.title))
const description = computed(() => getLocalizedText(props.product?.description).replace(/<[^>]*>/g, ' ').trim())
const categoryName = computed(() => getLocalizedText(props.product?.category?.name))
const soldOut = computed(() => isSoldOut(props.product))
const promo = computed(() => hasPromotionPrice(props.product))

const imageErrored = ref(false)
const coverImage = computed(() => {
  if (imageErrored.value) return ''
  const primary = getFirstImageUrl(props.product?.images)
  if (primary) return primary
  const icon = props.product?.category?.icon
  return icon ? getImageUrl(icon) : ''
})

// 价签徽章：促销 / 批发 / 活动（与卡片模式一致）
const priceSignal = computed<{ tone: string; label: string } | null>(() => {
  if (promo.value) return { tone: 'bg-primary/10 text-primary', label: t('products.promotionTag') }
  if (hasWholesalePrices(props.product)) return { tone: 'bg-[color:var(--teal-soft)] text-[color:var(--teal-strong)]', label: t('products.wholesaleTag') }
  if (hasPromotionRules(props.product)) return { tone: 'bg-[color:var(--gold-soft)] text-[color:var(--gold-strong)]', label: t('products.promotionBadge') }
  return null
})
</script>
