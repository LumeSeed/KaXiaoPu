import { useAppStore } from '../stores/app'
import { DEFAULT_TEMPLATE, normalizeStorefrontTemplate, type StorefrontTemplate } from '../utils/storefrontTemplate'
export { DEFAULT_TEMPLATE, STOREFRONT_TEMPLATES, type StorefrontTemplate } from '../utils/storefrontTemplate'

/**
 * 店面模板系统（站长全局切换 · 渐进并行迁移）
 *
 * - 当前激活模板优先级：本地预览覆盖(?template=) > 站点全局配置(storefront_template) > 上次访问时的模板 > 默认 classic
 * - vault 和 kaxiaopu 使用各自独立目录，缺页时自动回退 classic。
 * - 保留 classic、vault、kaxiaopu 三个独立标识。
 */

const OVERRIDE_KEY = 'dj-storefront-template'
// 站点配置是异步拿到的；记住上次生效的模板，配置返回前先按它渲染，避免每次打开都先闪一下 classic 外壳
const REMEMBER_KEY = 'dj-storefront-template-last'

const readOverride = (): StorefrontTemplate | null => {
    try {
        const value = localStorage.getItem(OVERRIDE_KEY)
        return normalizeStorefrontTemplate(value)
    } catch {
        return null
    }
}

const readRemembered = (): StorefrontTemplate | null => {
    try {
        const value = localStorage.getItem(REMEMBER_KEY)
        return normalizeStorefrontTemplate(value)
    } catch {
        return null
    }
}

let rememberedTemplate = typeof window === 'undefined' ? null : readRemembered()

/** 站点配置返回后调用：记住这次生效的模板，供下次打开时在配置返回前使用。 */
export const rememberTemplate = (value: unknown): void => {
    const normalized = normalizeStorefrontTemplate(value)
    if (!normalized || normalized === rememberedTemplate) return
    rememberedTemplate = normalized
    try {
        localStorage.setItem(REMEMBER_KEY, normalized)
    } catch {
        /* localStorage 不可用时忽略 */
    }
}

/** 站点配置返回之前，是否已经知道该用哪套模板（预览覆盖或上次访问的记录）。 */
export const hasTemplateHint = (): boolean => readOverride() !== null || rememberedTemplate !== null

/**
 * 预览用：URL 带 ?template=kaxiaopu / ?template=classic 时持久化到 localStorage，
 * ?template=reset 清除覆盖。站长正式切换走站点配置，不依赖此入口。
 * 在 app 挂载前调用一次即可。
 */
export const initTemplateOverride = (): void => {
    if (typeof window === 'undefined') return
    try {
        const param = new URLSearchParams(window.location.search).get('template')
        if (param === 'reset') {
            localStorage.removeItem(OVERRIDE_KEY)
        } else {
            const normalized = normalizeStorefrontTemplate(param)
            if (normalized) localStorage.setItem(OVERRIDE_KEY, normalized)
        }
    } catch {
        /* localStorage 不可用时忽略 */
    }
}

/** 当前激活的店面模板。 */
export const getActiveTemplate = (): StorefrontTemplate => {
    const override = readOverride()
    if (override) return override
    try {
        const appStore = useAppStore()
        const fromConfig = normalizeStorefrontTemplate(appStore.config?.storefront_template)
        if (fromConfig) return fromConfig
    } catch {
        /* pinia 尚未就绪时退回默认 */
    }
    return rememberedTemplate ?? DEFAULT_TEMPLATE
}

// vault 模板页面（按需动态加载）。key 形如 './vault/Home.vue'
const vaultViews = import.meta.glob('./vault/**/*.vue')
const kaxiaopuViews = import.meta.glob('./kaxiaopu/**/*.vue')

type ViewLoader = () => Promise<unknown>

/**
 * 路由 view 解析器：按当前模板从其独立目录加载页面，否则回退 classic loader。
 * 用法：`component: templateView('Home', () => import('../views/Home.vue'))`
 */
export const templateView = (name: string, classicLoader: ViewLoader): ViewLoader => {
    return () => {
        const template = getActiveTemplate()
        if (template !== 'classic') {
            const views = template === 'vault' ? vaultViews : kaxiaopuViews
            const loader = views[`./${template}/${name}.vue`]
            if (loader) return loader()
        }
        return classicLoader()
    }
}
