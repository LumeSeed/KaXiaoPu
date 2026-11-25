<template>
  <aside class="catalog-sidebar">
    <div class="catalog-desktop">
      <div class="catalog-heading"><Layers class="h-5 w-5" aria-hidden="true" /><div><h2>{{ t('storefront.productCategories') }}</h2><p>{{ t('storefront.categoryCount', { count: count }) }}<template v-if="productCounts[0] !== undefined"> · {{ t('storefront.productCount', { count: productCounts[0] }) }}</template></p></div></div>
      <CatalogCategoryTree :groups="groups" :counts="productCounts" :selected-category="selectedCategory" :expanded-parent-ids="expandedParentIds" @select="$emit('select', $event)" @toggle="$emit('toggle', $event)" />
    </div>
    <DialogRoot v-model:open="open">
      <DialogTrigger class="catalog-mobile-trigger"><Menu class="h-4 w-4" /><span>{{ t('storefront.productCategories') }}</span><span class="catalog-current">{{ selectedName }}</span><ChevronDown class="h-4 w-4" /></DialogTrigger>
      <DialogPortal>
        <DialogOverlay class="catalog-overlay" />
        <DialogContent class="catalog-sheet" :aria-describedby="undefined">
          <div class="catalog-sheet-heading"><DialogTitle>{{ t('storefront.productCategories') }}</DialogTitle><DialogClose :aria-label="t('products.closeFilter')"><X class="h-5 w-5" /></DialogClose></div>
          <CatalogCategoryTree :groups="groups" :counts="productCounts" :selected-category="selectedCategory" :expanded-parent-ids="expandedParentIds" @select="selectMobile" @toggle="$emit('toggle', $event)" />
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DialogRoot, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose } from 'reka-ui'
import { Layers, Menu, ChevronDown, X } from 'lucide-vue-next'
import CatalogCategoryTree from './CatalogCategoryTree.vue'
import { useLocalized } from '../composables/useProduct'
import { useCategoryProductCounts } from '../composables/useCategoryProductCounts'
import type { CategoryGroup } from '../utils/category'
const props = withDefaults(defineProps<{ groups: CategoryGroup[]; selectedCategory: number | null; expandedParentIds: number[]; open?: boolean }>(), { open: undefined })
const emit = defineEmits<{ select: [id: number | null]; toggle: [id: number]; 'update:open': [value: boolean] }>()
const { t } = useI18n()
const { getLocalizedText } = useLocalized()
const productCounts = useCategoryProductCounts(computed(() => props.groups))
const localOpen = ref(false)
const open = computed({
  get: () => props.open ?? localOpen.value,
  set: (value: boolean) => { localOpen.value = value; emit('update:open', value) },
})
const count = computed(() => props.groups.reduce((n, g) => n + 1 + g.children.length, 0))
const selectedName = computed(() => {
  const category = props.groups.flatMap(g => [g, ...g.children]).find(g => g.id === props.selectedCategory)
  return category ? getLocalizedText(category.name) : t('products.allCategories')
})
const selectMobile = (id: number | null) => { emit('select', id); open.value = false }
</script>
