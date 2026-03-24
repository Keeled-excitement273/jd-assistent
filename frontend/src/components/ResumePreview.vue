<template>
  <article class="card resume-shell p-0 overflow-hidden printable-resume">
    <div class="p-8 md:p-12 lg:p-14 resume-content">
      
      <!-- Header: Name & Contact -->
      <div class="resume-header pb-6 mb-8 text-center md:text-left md:flex justify-between items-end">
        <div>
          <h1 class="resume-name text-4xl font-black tracking-tight">{{ safeResume.name }}</h1>
          <div class="resume-contact mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium justify-center md:justify-start">
            <span v-if="safeResume.contact?.email" class="flex items-center">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              {{ safeResume.contact.email }}
            </span>
            <span v-if="safeResume.contact?.phone" class="flex items-center">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              {{ safeResume.contact.phone }}
            </span>
            <span v-if="safeResume.contact?.linkedin" class="flex items-center">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              {{ safeResume.contact.linkedin }}
            </span>
          </div>
        </div>
      </div>

      <!-- Sections -->
      <div class="space-y-9">
        <!-- Summary section (always first) -->
        <section v-if="safeResume.summary" class="mb-8">
          <h2 class="resume-section-title text-lg font-bold uppercase tracking-[0.18em] pb-2 mb-4">
            个人总结
          </h2>
          <p class="resume-body leading-relaxed text-[15px] format-bold" v-html="renderMarkdown(safeResume.summary)"></p>
        </section>

        <!-- Dynamic Sections -->
        <section v-for="(sec, idx) in formattedSections" :key="idx" :class="`section-type-${sec.type}`">
          <h2 class="resume-section-title text-lg font-bold uppercase tracking-[0.18em] pb-2 mb-4">
            {{ sec.title }}
          </h2>
          
          <!-- Experience Type -->
            <div v-if="sec.type === 'experience'" class="space-y-7">
              <div v-for="(item, i) in sec.items" :key="i" class="experience-item page-break-avoid">
                <div class="flex justify-between items-baseline gap-4 mb-2">
                  <h3 class="resume-strong text-[15px] font-bold">{{ item.company }}</h3>
                  <span class="resume-muted text-xs font-semibold uppercase tracking-[0.12em] whitespace-nowrap ml-4">{{ item.duration }}</span>
                </div>
                <div class="resume-accent text-sm font-semibold mb-3">{{ item.title }}</div>
                
                <ul class="list-disc pl-5 mt-2 space-y-2 text-[15px] resume-body">
                  <li v-for="(hl, j) in item.highlights" :key="j" class="pl-1 format-bold">
                    <span v-html="renderMarkdown(hl)"></span>
                  </li>
              </ul>
            </div>
          </div>

          <!-- Education Type -->
            <div v-else-if="sec.type === 'education'" class="space-y-4">
              <div v-for="(item, i) in sec.items" :key="i" class="flex justify-between items-baseline page-break-avoid">
                <div>
                  <span class="resume-strong font-bold mr-2">{{ item.school }}</span>
                  <span class="resume-muted text-sm">{{ item.major }} • {{ item.degree }}</span>
                </div>
                <span class="resume-muted text-xs font-semibold uppercase tracking-[0.12em]">{{ item.year }}</span>
              </div>
            </div>

          <!-- Skills Type -->
            <div v-else-if="sec.type === 'skills'" class="space-y-2">
              <div v-for="(item, i) in sec.items" :key="i" class="flex text-sm page-break-avoid">
                <span class="resume-strong font-bold w-28 flex-shrink-0 capitalize">{{ item.category || 'Skills' }}:</span>
                <span class="resume-body">{{ item.skills.join(' • ') }}</span>
              </div>
            </div>

          <!-- Generic Fallback -->
            <div v-else class="space-y-3">
              <div v-for="(item, i) in sec.items" :key="i" class="text-sm page-break-avoid resume-body leading-relaxed">
                {{ formatFallbackItem(item) }}
              </div>
            </div>
        </section>
      </div>

    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const sanitizePreviewText = (text) => {
  if (!text) return ''

  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\[Rr]/g, '\n')
    .replace(/[\u200b-\u200f\u2060\ufeff\ufffc]/g, '')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .replace(/[【\[]\s*[STARstar]\s*[】\]]\s*[:：]?\s*/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const escapeHtml = (text) => {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const sanitizePayload = (value) => {
  if (typeof value === 'string') return sanitizePreviewText(value)
  if (Array.isArray(value)) return value.map(sanitizePayload)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizePayload(item)]))
  }
  return value
}

const safeResume = computed(() => sanitizePayload(props.data || {}))

const formatFallbackItem = (item) => {
  if (typeof item === 'string') return sanitizePreviewText(item)
  if (!item || typeof item !== 'object') return String(item ?? '')
  return Object.values(item)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => sanitizePreviewText(String(value ?? '')))
    .filter(Boolean)
    .join(' · ')
}

// Filter out summary if it's somehow in sections array (since we display it on top)
const formattedSections = computed(() => {
  if (!safeResume.value || !safeResume.value.sections) return []
  return safeResume.value.sections.filter((s) => s.type !== 'summary')
})

/**
 * 极简 Markdown 渲染器：只处理 **加粗**
 * @param {string} text 
 */
const renderMarkdown = (text) => {
  if (!text) return ''
  const escaped = escapeHtml(sanitizePreviewText(text))
  // 匹配 **text** 并替换为带主题高亮的 strong，避免简历预览在主题切换后仍保留写死的蓝色。
  return escaped
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold px-1 rounded mx-0.5">$1</strong>')
    .replace(/\n/g, '<br>')
}
</script>

<style>
.resume-shell {
  background: var(--color-resume-surface);
  box-shadow: var(--shadow-lg);
}

.resume-content {
  background: var(--color-resume-surface);
  position: relative;
}

.resume-content::before {
  content: '';
  position: absolute;
  inset: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--color-resume-border) 70%, white 30%);
  pointer-events: none;
  border-radius: calc(var(--radius-2xl) - 0.5rem);
}

.resume-header {
  border-bottom: 1px solid color-mix(in srgb, var(--color-resume-ink) 18%, white 82%);
}

.resume-name,
.resume-strong,
.resume-section-title,
.format-bold strong {
  color: var(--color-resume-ink);
}

.resume-name {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.04em;
}

.resume-contact,
.resume-body,
.resume-muted {
  color: var(--color-resume-muted);
}

.resume-accent {
  color: var(--color-resume-accent);
  letter-spacing: 0.02em;
}

.resume-section-title {
  border-bottom: 1px solid var(--color-resume-border);
}

/* Scoped & Generic formatting for rendered HTML */
.format-bold strong {
  font-weight: 700;
  background-color: var(--color-resume-accent-soft);
  border-bottom: 1px solid color-mix(in srgb, var(--color-resume-accent) 24%, white 76%);
  box-decoration-break: clone;
}

/* Print optimizations */
@media print {
  @page { margin: 12mm 15mm; size: A4 portrait; }
  body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .card { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; }
  .page-break-avoid { page-break-inside: avoid; break-inside: avoid; }
  header, footer, nav, button, .progress-panel { display: none !important; }
  
  /* Reset container widths for printing */
  .container { max-width: none !important; width: 100% !important; padding: 0 !important;}
  .resume-content { padding: 0 !important; }
  
  .format-bold strong { background-color: transparent !important; }
}
</style>
