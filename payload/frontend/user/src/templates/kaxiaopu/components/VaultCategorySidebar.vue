<template>
  <CatalogCategories :groups="categoryGroups" :selected-category="selectedCategory" :expanded-parent-ids="expandedParentIds" @select="$emit('select', $event)" @toggle="$emit('toggle', $event)" />
</template>
<script setup lang="ts">
import CatalogCategories from '../../../components/CatalogCategories.vue'
import type { CategoryGroup } from '../../../utils/category'
defineProps<{ categoryGroups: CategoryGroup[]; selectedCategory: number | null; expandedParentIds: number[] }>()
defineEmits<{ select: [id: number | null]; toggle: [id: number] }>()
</script>
