<template>
  <div class="catalog-tree">
    <label class="catalog-filter"><Search class="h-4 w-4" aria-hidden="true" />
      <input v-model="filter" type="search" :placeholder="t('storefront.filterCategories')" :aria-label="t('storefront.filterCategories')" />
    </label>
    <button class="catalog-category" :class="{ selected: selectedCategory === null }" :aria-pressed="selectedCategory === null" @click="$emit('select', null)">
      <LayoutGrid class="h-5 w-5" aria-hidden="true" /><span>{{ t('products.allCategories') }}</span>
      <span v-if="counts[0] !== undefined" class="catalog-count">{{ counts[0] }}</span>
    </button>
    <p class="catalog-list-label">{{ t('storefront.categoryList') }}</p>
    <div v-for="group in filteredGroups" :key="group.id" class="catalog-group">
      <div class="catalog-category-row" :class="{ selected: selectedCategory === group.id }" @click="$emit('select', group.id)">
        <button class="catalog-category" :class="{ selected: selectedCategory === group.id }" :aria-pressed="selectedCategory === group.id">
          <img v-if="group.icon" :src="getImageUrl(group.icon)" alt="" loading="lazy" />
          <Package v-else class="h-5 w-5" aria-hidden="true" />
          <span>{{ name(group) }}</span>
        </button>
        <button v-if="group.children.length" class="catalog-expand" :aria-label="name(group)" :aria-expanded="isExpanded(group.id)" @click.stop="$emit('toggle', group.id)">
          <ChevronDown class="h-4 w-4" />
        </button>
        <span v-if="counts[group.id] !== undefined" class="catalog-count">{{ counts[group.id] }}</span>
      </div>
      <div v-if="isExpanded(group.id)" class="catalog-children">
        <button v-for="child in group.children" :key="child.id" class="catalog-category" :class="{ selected: selectedCategory === child.id }" :aria-pressed="selectedCategory === child.id" @click="$emit('select', child.id)">
          <span>{{ name(child) }}</span>
          <span v-if="counts[child.id] !== undefined" class="catalog-count">{{ counts[child.id] }}</span>
        </button>
      </div>
    </div>
    <p v-if="!filteredGroups.length" class="p-4 text-sm text-muted-foreground">{{ t('storefront.noCategories') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, LayoutGrid, Package, ChevronDown } from 'lucide-vue-next'
import { getImageUrl } from '../utils/image'
import { useLocalized } from '../composables/useProduct'
import type { CategoryGroup, PublicCategory } from '../utils/category'
const props = defineProps<{ groups: CategoryGroup[]; counts: Record<number, number>; selectedCategory: number | null; expandedParentIds: number[] }>()
defineEmits<{ select: [id: number | null]; toggle: [id: number] }>()
const { t } = useI18n()
const { getLocalizedText } = useLocalized()
const filter = ref('')
const name = (cat: PublicCategory) => getLocalizedText(cat.name) || cat.slug || ''
const isExpanded = (id: number) => !!filter.value.trim() || props.expandedParentIds.includes(id)
const filteredGroups = computed(() => {
  const q = filter.value.trim().toLocaleLowerCase()
  if (!q) return props.groups
  return props.groups.flatMap(group => {
    if (name(group).toLocaleLowerCase().includes(q)) return [group]
    const children = group.children.filter(child => name(child).toLocaleLowerCase().includes(q))
    return children.length ? [{ ...group, children }] : []
  })
})
</script>
