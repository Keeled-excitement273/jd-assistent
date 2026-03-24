<template>
  <section class="surface-panel uploader-shell p-6 md:p-8">
    <div class="uploader-head mb-8">
      <p class="eyebrow">任务输入</p>
      <div class="uploader-head__row mt-3">
        <div>
          <h2 class="page-heading text-3xl sm:text-4xl">上传简历并粘贴目标岗位描述</h2>
          <p class="page-copy mt-3 max-w-2xl text-sm sm:text-base">
            我们会基于你的原始材料和目标岗位要求，生成一条更聚焦、更适配的优化流程。
          </p>
        </div>
        <div class="uploader-summary">
          <span class="uploader-summary__item">支持 PDF / Word / Markdown</span>
          <span class="uploader-summary__item">JD 至少 10 字</span>
          <span class="uploader-summary__item">保留执行过程</span>
        </div>
      </div>
    </div>

    <form @submit.prevent="submitTask" class="space-y-6">
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="uploader-field">
          <label class="uploader-field__label" for="resume-upload">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            原始简历文件
          </label>
          <p class="uploader-field__hint">建议上传最近版本的简历原稿，系统会以它作为事实基线。</p>
          <button
            id="resume-upload"
            type="button"
            class="uploader-dropzone"
            :class="{ 'uploader-dropzone--dragging': isDragging, 'uploader-dropzone--filled': resumeFile }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="fileInput?.click()"
          >
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept=".pdf,.doc,.docx,.md,.txt"
              @change="handleFileSelect"
            >

            <template v-if="!resumeFile">
              <span class="uploader-dropzone__icon" aria-hidden="true">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </span>
              <span class="uploader-dropzone__title">点击上传或拖拽文件到这里</span>
              <span class="uploader-dropzone__meta">支持 PDF、DOC、DOCX、MD、TXT</span>
            </template>

            <template v-else>
              <span class="uploader-dropzone__icon uploader-dropzone__icon--filled" aria-hidden="true">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </span>
              <span class="uploader-dropzone__title uploader-dropzone__title--filled">{{ resumeFile.name }}</span>
              <span class="uploader-dropzone__meta">{{ formatFileSize(resumeFile.size) }}</span>
              <span class="uploader-dropzone__action">点击重新选择文件</span>
            </template>
          </button>
        </section>

        <section class="uploader-field">
          <label class="uploader-field__label" for="jd-input">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            目标岗位 JD
          </label>
          <p class="uploader-field__hint">尽量包含岗位职责、任职要求和关键词，这会直接影响重写重点。</p>
          <div class="uploader-textarea-wrap">
            <textarea
              id="jd-input"
              v-model="jdText"
              class="form-control uploader-textarea"
              placeholder="请粘贴目标岗位的岗位职责、任职要求和关键关键词。"
              :disabled="loading"
              required
              minlength="10"
            ></textarea>
            <div class="uploader-counter" :class="{ 'uploader-counter--active': jdText.length > 0 }">
              {{ jdText.length }} 字
            </div>
          </div>
        </section>
      </div>

      <div v-if="errorMsg" class="uploader-error" role="alert">
        <svg class="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>{{ errorMsg }}</span>
      </div>

      <div class="uploader-footer">
        <button v-if="resumeFile" type="button" class="btn btn-ghost" @click="resumeFile = null">
          清空文件
        </button>
        <button type="submit" class="btn btn-primary uploader-submit" :disabled="loading || !isValid">
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            启动优化流程中
          </span>
          <span v-else class="flex items-center justify-center gap-2">
            开始深度优化
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </span>
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const resumeFile = ref(null)
const fileInput = ref(null)
const isDragging = ref(false)
const jdText = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files && files.length > 0) processFile(files[0])
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files && files.length > 0) processFile(files[0])
}

const processFile = (file) => {
  const ext = file.name.split('.').pop().toLowerCase()
  if (!['pdf', 'doc', 'docx', 'md', 'txt'].includes(ext)) {
    errorMsg.value = '不支持的文件格式，请上传 PDF、Word 或 Markdown 文件。'
    return
  }
  resumeFile.value = file
  errorMsg.value = ''
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const isValid = computed(() => {
  return resumeFile.value !== null && jdText.value.trim().length >= 10
})

const submitTask = async () => {
  if (!isValid.value) return

  loading.value = true
  errorMsg.value = ''

  try {
    const data = await api.submitOptimizeTask(resumeFile.value, jdText.value)
    if (data && data.task_id) {
      router.push(`/task/${data.task_id}`)
    } else {
      errorMsg.value = '服务器返回数据异常。'
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.detail || err.message || '网络请求失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.uploader-head__row {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.uploader-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.uploader-summary__item {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  border-radius: 9999px;
  padding: 0.35rem 0.8rem;
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, white 22%);
  background: color-mix(in srgb, var(--color-bg-card) 84%, transparent 16%);
  color: var(--color-text-main);
  font-size: 0.78rem;
  font-weight: 600;
}

.uploader-field {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.uploader-field__label {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--color-text-strong);
  font-size: 0.92rem;
  font-weight: 700;
}

.uploader-field__hint {
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.7;
}

.uploader-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 19rem;
  border-radius: var(--radius-2xl);
  border: 1.5px dashed color-mix(in srgb, var(--color-border-strong) 88%, white 12%);
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 92%, white 8%), color-mix(in srgb, var(--color-surface-muted) 86%, white 14%));
  padding: 1.75rem;
  text-align: center;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.uploader-dropzone:hover,
.uploader-dropzone:focus-visible {
  border-color: color-mix(in srgb, var(--color-primary) 24%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary-light) 22%, white 78%);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
  outline: none;
}

.uploader-dropzone--dragging,
.uploader-dropzone--filled {
  border-style: solid;
  border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
}

.uploader-dropzone__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-surface-muted) 70%, white 30%);
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.uploader-dropzone__icon--filled {
  background: color-mix(in srgb, var(--color-primary-light) 60%, white 40%);
  color: var(--color-primary);
}

.uploader-dropzone__title {
  color: var(--color-text-strong);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.6;
}

.uploader-dropzone__title--filled {
  max-width: 100%;
  word-break: break-word;
}

.uploader-dropzone__meta,
.uploader-dropzone__action {
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.uploader-dropzone__meta {
  margin-top: 0.4rem;
}

.uploader-dropzone__action {
  margin-top: 0.8rem;
}

.uploader-textarea-wrap {
  position: relative;
}

.uploader-textarea {
  min-height: 19rem;
  padding-bottom: 3rem;
  resize: none;
  line-height: 1.85;
}

.uploader-counter {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.uploader-counter--active {
  color: var(--color-primary);
}

.uploader-error {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--color-danger) 18%, white 82%);
  background: color-mix(in srgb, var(--color-danger) 8%, white 92%);
  color: color-mix(in srgb, var(--color-danger) 82%, var(--color-text-main) 18%);
  padding: 1rem 1.1rem;
}

.uploader-footer {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.uploader-submit {
  width: 100%;
  min-height: 3.15rem;
}

@media (min-width: 768px) {
  .uploader-footer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .uploader-submit {
    width: auto;
    min-width: 15rem;
  }
}

@media (min-width: 1024px) {
  .uploader-head__row {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
}
</style>
