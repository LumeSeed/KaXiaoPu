<template>
  <div class="store-page store-page-productdetail mx-auto w-full max-w-[1180px] px-6 pb-6">
    <!-- Loading -->
    <div v-if="loading" class="grid gap-11 py-2.5 lg:grid-cols-2">
      <div class="h-[380px] rounded-xl bg-[linear-gradient(135deg,#3a3950,var(--ink))] opacity-50"></div>
      <div class="grid content-start gap-4 pt-2">
        <div class="h-7 w-3/5 rounded-md border bg-card"></div>
        <div class="h-12 w-2/5 rounded-md border bg-card"></div>
        <div class="h-[120px] rounded-md border bg-card"></div>
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="product">
      <nav class="flex flex-wrap items-center gap-1.5 py-5 pb-2 text-[13.5px] font-semibold text-muted-foreground">
        <RouterLink :to="backToListTo" class="hover:text-primary">{{ categoryName || t('nav.products') }}</RouterLink>
        <span aria-hidden="true">/</span>
        <span class="text-foreground">{{ getLocalizedText(product.title) }}</span>
      </nav>

      <section class="store-detail-grid grid gap-11 py-2.5 lg:grid-cols-2">
        <!-- 商品说明 -->
        <div class="store-detail-content">
      <!-- 描述 / 详情 -->
      <section v-if="getLocalizedText(product.description) || product.content" class="store-detail-description">
        <div class="store-detail-description-heading">
          <span class="text-sm font-semibold text-foreground">{{ t('productDetail.details') }}</span>
        </div>
        <div class="prose max-w-none dark:prose-invert prose-a:text-primary prose-img:rounded-md">
          <p v-if="getLocalizedText(product.description)">{{ getLocalizedText(product.description) }}</p>
          <div v-if="product.content" v-html="processHtmlForDisplay(getLocalizedText(product.content))"></div>
        </div>
      </section>

        </div>
        <!-- 购买区 -->
        <div class="store-detail-purchase">
          <div class="store-detail-heading">
            <img v-if="currentImage" :src="currentImage" :alt="getLocalizedText(product.title)" />
            <Package v-else aria-hidden="true" />
            <h1>{{ getLocalizedText(product.title) }}</h1>
          </div>
          <p v-if="getLocalizedText(product.description)" class="store-detail-summary">{{ getLocalizedText(product.description) }}</p>

          <StorefrontProductMeta :product="product" />

          <div v-if="product.tags && product.tags.length" class="mb-1 flex flex-wrap gap-1.5">
            <span v-for="(tag, i) in product.tags" :key="i" class="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-[12.5px] font-semibold text-muted-foreground">{{ tag }}</span>
          </div>

          <!-- 价格 -->
          <div class="my-5 border-b pb-5">
            <div class="mb-2.5 flex flex-wrap items-center gap-2">
              <span v-if="(selectedSku && hasSkuPromotionPrice(selectedSku)) || (!selectedSku && hasPromotionPrice(product))" class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[12.5px] font-semibold text-primary">{{ t('products.promotionTag') }}</span>
              <span v-if="showSelectedSkuMemberBadge" class="inline-flex items-center rounded-full bg-[color:var(--gold-soft)] px-2.5 py-1 text-[12.5px] font-semibold text-[color:var(--gold-strong)]">{{ t('products.memberPriceTag') }}</span>
              <span v-if="hasSelectedSkuWholesalePrice" class="inline-flex items-center rounded-full bg-[color:var(--teal-soft)] px-2.5 py-1 text-[12.5px] font-semibold text-[color:var(--teal-strong)]">{{ t('products.wholesaleTag') }}</span>
            </div>

            <!-- 1. SKU 批发价 -->
            <template v-if="selectedSku && hasSelectedSkuWholesalePrice">
              <div class="flex flex-wrap items-baseline gap-3">
                <StorefrontPrice class="text-[40px] font-extrabold tabular-nums" :class="selectedSkuWholesaleFinalIsMember ? 'text-[color:var(--gold-strong)]' : 'text-[color:var(--teal-strong)]'" :amount="selectedSkuWholesaleFinalPrice!" :currency="siteCurrency" />
                <span class="font-semibold text-muted-foreground line-through">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
              </div>
              <p class="mt-2 text-sm font-semibold" :class="selectedSkuWholesaleFinalIsMember ? 'text-[color:var(--gold-strong)]' : 'text-[color:var(--teal-strong)]'">
                {{ selectedSkuWholesaleFinalIsMember ? t('products.memberPriceTag') : t('products.wholesaleTag') }} · {{ t('products.saveAmount') }} {{ formatPrice(Number(selectedSku.price_amount) - Number(selectedSkuWholesaleFinalPrice), siteCurrency) }}
              </p>
            </template>
            <!-- 2. SKU 促销价 -->
            <template v-else-if="selectedSku && hasSkuPromotionPrice(selectedSku)">
              <div class="flex flex-wrap items-baseline gap-3">
                <StorefrontPrice v-if="selectedSkuPromotionFinalIsMember" class="text-[40px] font-extrabold tabular-nums text-[color:var(--gold-strong)]" :amount="selectedSkuPromotionFinalPrice!" :currency="siteCurrency" />
                <StorefrontPrice v-else class="text-[40px] font-extrabold tabular-nums text-primary" :amount="selectedSkuPromotionPrice!" :currency="siteCurrency" />
                <span class="font-semibold text-muted-foreground line-through">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
              </div>
              <p v-if="selectedSkuPromotionFinalIsMember" class="mt-2 text-sm font-semibold text-[color:var(--gold-strong)]">{{ t('products.memberPriceTag') }} · {{ t('products.saveAmount') }} {{ formatPrice(Number(selectedSku.price_amount) - Number(selectedSkuPromotionFinalPrice), siteCurrency) }}</p>
              <p v-else class="mt-2 text-sm font-semibold text-destructive">{{ t('products.saveAmount') }} {{ formatPrice(getSkuPromotionSaveAmount(selectedSku), siteCurrency) }}</p>
            </template>
            <!-- 3. SKU 会员价 -->
            <template v-else-if="selectedSku && hasMemberPrice">
              <div class="flex flex-wrap items-baseline gap-3">
                <StorefrontPrice class="text-[40px] font-extrabold tabular-nums text-[color:var(--gold-strong)]" :amount="selectedSkuMemberPrice!" :currency="siteCurrency" />
                <span class="font-semibold text-muted-foreground line-through">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
              </div>
              <p class="mt-2 text-sm font-semibold text-[color:var(--gold-strong)]">{{ t('products.memberPriceTag') }} · {{ t('products.saveAmount') }} {{ formatPrice(Number(selectedSku.price_amount) - selectedSkuMemberPrice!, siteCurrency) }}</p>
            </template>
            <!-- 4. SKU 原价 -->
            <div v-else-if="selectedSku" class="flex flex-wrap items-baseline gap-3">
              <StorefrontPrice class="text-[40px] font-extrabold tabular-nums text-primary" :amount="selectedSku.price_amount" :currency="siteCurrency" />
            </div>
            <!-- 5. 产品级促销 -->
            <template v-else-if="hasPromotionPrice(product)">
              <div class="flex flex-wrap items-baseline gap-3">
                <StorefrontPrice class="text-[40px] font-extrabold tabular-nums text-primary" :amount="getPromotionPriceAmount(product)" :currency="siteCurrency" />
                <span class="font-semibold text-muted-foreground line-through">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
              </div>
              <p class="mt-2 text-sm font-semibold text-destructive">{{ t('products.saveAmount') }} {{ formatPrice(getPromotionSaveAmount(product), siteCurrency) }}</p>
            </template>
            <!-- 6. 产品级原价 -->
            <div v-else class="flex flex-wrap items-baseline gap-3">
              <StorefrontPrice class="text-[40px] font-extrabold tabular-nums text-primary" :amount="product.price_amount" :currency="siteCurrency" />
            </div>
          </div>

          <!-- 批发规则 -->
          <div v-if="selectedSkuWholesaleRules.length" class="mb-[18px] rounded-md bg-[color:var(--teal-soft)] px-[15px] py-3">
            <h4 class="mb-2 text-[13.5px] font-bold text-[color:var(--teal-strong)]">{{ t('products.wholesaleRulesTitle') }}</h4>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="tier in selectedSkuWholesaleRules" :key="`${tier.sku_id || tier.sku_code || 'all'}-${tier.min_quantity}`" class="inline-flex items-center rounded-full bg-card px-2.5 py-1 text-[12.5px] font-semibold text-[color:var(--teal-strong)]">{{ formatWholesaleTier(tier) }}</span>
            </div>
          </div>

          <!-- 活动规则 -->
          <div v-if="hasPromotionRules(product)" class="mb-[18px] rounded-md bg-[color:var(--gold-soft)] px-[15px] py-3">
            <h4 class="mb-2 flex items-center gap-1.5 text-[13.5px] font-bold text-[color:var(--gold-strong)]"><Tag class="h-[15px] w-[15px]" /> {{ t('products.promotionRulesTitle') }}</h4>
            <ul class="grid gap-1">
              <li v-for="rule in getPromotionRules(product)" :key="rule.id" class="text-[13px] text-[color:var(--gold-strong)]">{{ formatPromotionRule(rule) }}</li>
            </ul>
          </div>

          <!-- 规格 -->
          <div v-if="activeSkus.length" class="my-5">
            <div class="mb-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-muted-foreground">{{ t('productDetail.skuTitle') }}</div>
            <div class="flex flex-wrap gap-2.5">
              <button
                v-for="sku in activeSkus"
                :key="sku.id"
                type="button"
                class="flex min-w-[86px] flex-col items-start gap-0.5 rounded-sm border-2 px-4 py-2.5 text-sm font-semibold"
                :class="[
                  normalizeSkuId(sku.id) === selectedSkuId ? 'border-primary bg-primary/10 text-primary' : 'border-hairline-strong bg-card text-foreground',
                  !isSkuPurchasable(sku) ? 'cursor-not-allowed opacity-[0.42]' : '',
                ]"
                :disabled="!isSkuPurchasable(sku)"
                :aria-pressed="normalizeSkuId(sku.id) === selectedSkuId"
                @click="selectedSkuId = normalizeSkuId(sku.id)"
              >
                {{ skuDisplayText(sku) }}
                <span class="text-xs font-semibold" :class="normalizeSkuId(sku.id) === selectedSkuId ? 'text-primary' : 'text-muted-foreground'">{{ skuStockText(sku) }}</span>
              </button>
            </div>
            <p v-if="requiresSKUSelection" class="mt-2 text-[13px] text-warning">{{ t('productDetail.skuRequired') }}</p>
          </div>

          <!-- 数量 -->
          <div class="my-5">
            <div class="mb-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-muted-foreground">{{ t('productDetail.quantity') }}</div>
            <div class="inline-flex items-center overflow-hidden rounded-full border-2 border-hairline-strong">
              <button type="button" class="grid h-11 w-[42px] place-items-center bg-card text-foreground disabled:opacity-35" :aria-label="t('storefront.decreaseQuantity')" :disabled="quantity <= quantityEffectiveMin" @click="quantity = Math.max(quantityEffectiveMin, quantity - 1)"><Minus class="h-[17px] w-[17px]" /></button>
              <input inputmode="numeric" class="h-11 w-[50px] border-x bg-card text-center font-bold tabular-nums outline-none" :value="quantity" :aria-label="t('storefront.quantity')" @change="handleQuantityInput($event)" @keydown.enter.prevent="($event.target as HTMLInputElement)?.blur()" />
              <button type="button" class="grid h-11 w-[42px] place-items-center bg-card text-foreground disabled:opacity-35" :aria-label="t('storefront.increaseQuantity')" :disabled="quantityEffectiveLimit !== null && quantity >= quantityEffectiveLimit" @click="quantity = quantity + 1"><Plus class="h-[17px] w-[17px]" /></button>
            </div>
          </div>

          <!-- 提示 -->
          <div v-if="cannotPurchaseReason" class="my-3.5 rounded-sm bg-destructive/10 px-3.5 py-2.5 text-sm font-semibold text-destructive">{{ cannotPurchaseReason }}</div>
          <div v-if="purchaseWarning" class="my-3.5 rounded-sm bg-warning/10 px-3.5 py-2.5 text-sm font-semibold text-warning">{{ purchaseWarning }}</div>

          <!-- 操作 -->
          <div ref="purchaseActionsRef" class="mt-[18px] flex flex-wrap gap-3">
            <Button v-if="requiresLogin" class="h-12 w-full rounded-full text-[17px] font-bold" @click="goLogin">{{ t('productDetail.loginToBuy') }}</Button>
            <template v-else>
              <Button class="h-12 flex-1 rounded-full text-[17px] font-bold" :disabled="!canPurchase" @click="buyNow"><Zap /> {{ t('productDetail.buyNow') }}</Button>
              <Button variant="outline" class="h-12 rounded-full text-[17px] font-bold" :disabled="!canPurchase" @click="addToCart"><ShoppingCart /> {{ t('productDetail.addToCart') }}</Button>
            </template>
          </div>


        </div>
      </section>

      <!-- 相关文章 -->
      <section v-if="relatedPosts.length" class="py-9">
        <div class="mb-[22px]"><h2 class="text-2xl font-extrabold">{{ t('productDetail.relatedPosts') }}</h2></div>
        <div class="grid gap-4 grid-cols-[repeat(auto-fill,minmax(228px,1fr))]">
          <RouterLink v-for="rp in relatedPosts" :key="rp.id" class="block h-full rounded-lg border bg-card p-[22px] transition hover:-translate-y-[3px] hover:border-hairline-strong hover:shadow-[var(--shadow)]" :to="`/blog/${rp.slug}`">
            <span class="text-[12.5px] font-semibold text-muted-foreground">{{ formatRelatedPostDate(rp.published_at) }}</span>
            <h3 class="mt-2 line-clamp-2 text-[17px] font-bold">{{ getLocalizedText(rp.title) }}</h3>
            <p v-if="rp.summary" class="mt-2 line-clamp-2 text-sm text-muted-foreground">{{ getLocalizedText(rp.summary) }}</p>
            <span class="mt-3.5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">{{ t('blog.readMore') }} <ChevronRight class="h-4 w-4" /></span>
          </RouterLink>
        </div>
      </section>

      <div class="py-6 text-center">
        <Button as-child variant="ghost" size="sm" class="rounded-full"><RouterLink :to="backToListTo"><ArrowLeft /> {{ t('productDetail.backToProducts') }}</RouterLink></Button>
      </div>

      <!-- 移动端固定购买条 -->
      <VaultProductMobileBar
        :visible="showMobileBar && !!product && !loading"
        :requires-login="requiresLogin"
        :can-purchase="canPurchase"
        :show-member-price="mobileBarShowMemberPrice"
        :member-price-display="mobileBarMemberPriceDisplay"
        :show-sku-promotion-price="mobileBarShowSkuPromotionPrice"
        :sku-promotion-price-display="mobileBarSkuPromotionPriceDisplay"
        :show-sku-price="mobileBarShowSkuPrice"
        :sku-price-display="mobileBarSkuPriceDisplay"
        :show-product-promotion-price="mobileBarShowProductPromotionPrice"
        :product-promotion-price-display="mobileBarProductPromotionPriceDisplay"
        :product-price-display="mobileBarProductPriceDisplay"
        @add-to-cart="addToCart"
        @buy-now="buyNow"
        @go-login="goLogin"
      />
    </template>

    <!-- 错误 -->
    <div v-else class="my-10 flex flex-col items-center gap-3 rounded-lg border border-dashed py-14 text-center text-muted-foreground">
      <AlertCircle class="h-12 w-12 opacity-60" />
      <p>{{ t('productDetail.notFound') }}</p>
      <div class="mt-2 flex flex-wrap justify-center gap-2.5">
        <Button size="sm" class="rounded-full" @click="loadProduct"><RotateCw /> {{ t('errorBoundary.retry') }}</Button>
        <Button as-child variant="outline" size="sm" class="rounded-full"><RouterLink :to="backToListTo">{{ t('productDetail.backToProducts') }}</RouterLink></Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StorefrontPrice from '../../components/StorefrontPrice.vue'
import StorefrontProductMeta from '../../components/StorefrontProductMeta.vue'
import { onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AlertCircle, ArrowLeft, ChevronRight, Minus, Package, Plus,
  RotateCw, ShoppingCart, Tag, Zap,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { processHtmlForDisplay } from '../../utils/content'
import { useProductDetail } from '../../composables/useProductDetail'
import VaultProductMobileBar from './components/VaultProductMobileBar.vue'

const { t } = useI18n()

// 移动端固定购买条：IntersectionObserver 监听桌面购买区是否出屏
const purchaseActionsRef = ref<HTMLElement | null>(null)
const showMobileBar = ref(false)
let observer: IntersectionObserver | null = null

const setupMobileBarObserver = () => {
  if (observer) observer.disconnect()
  if (!purchaseActionsRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry) showMobileBar.value = !entry.isIntersecting
    },
    { threshold: 0.1 },
  )
  observer.observe(purchaseActionsRef.value)
}

const {
  getLocalizedText, siteCurrency, formatPrice,
  hasPromotionPrice, getPromotionPriceAmount, getPromotionSaveAmount,
  hasSkuPromotionPrice, getSkuPromotionSaveAmount,
  hasPromotionRules, getPromotionRules,
  formatPromotionRule, formatWholesaleTier, formatRelatedPostDate, normalizeSkuId,
  loading, product, relatedPosts, currentImage, selectedSkuId, quantity, purchaseWarning,
  activeSkus, selectedSku,
  selectedSkuMemberPrice, hasMemberPrice,
  hasSelectedSkuWholesalePrice, selectedSkuWholesaleFinalIsMember, selectedSkuWholesaleFinalPrice,
  selectedSkuWholesaleRules,
  selectedSkuPromotionPrice, selectedSkuPromotionFinalIsMember, selectedSkuPromotionFinalPrice,
  showSelectedSkuMemberBadge,
  isSkuPurchasable, skuDisplayText, skuStockText,
  quantityEffectiveLimit, quantityEffectiveMin, handleQuantityInput,
  requiresLogin, requiresSKUSelection, canPurchase, cannotPurchaseReason,
  categoryName,
  backToListTo,
  addToCart, buyNow, goLogin, loadProduct,
  mobileBarShowMemberPrice, mobileBarMemberPriceDisplay,
  mobileBarShowSkuPromotionPrice, mobileBarSkuPromotionPriceDisplay,
  mobileBarShowSkuPrice, mobileBarSkuPriceDisplay,
  mobileBarShowProductPromotionPrice, mobileBarProductPromotionPriceDisplay, mobileBarProductPriceDisplay,
} = useProductDetail({ onLoaded: () => setupMobileBarObserver() })

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>
