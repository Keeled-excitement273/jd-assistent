<template>
  <div class="container mx-auto px-4">
    <div class="home-shell max-w-6xl mx-auto space-y-8">
      <section class="home-hero surface-panel px-6 py-8 md:px-10 md:py-10">
        <div class="home-hero__grid">
          <div class="home-hero__lead">
            <p class="eyebrow">智能简历优化</p>
            <h1 class="home-title page-heading mt-4 text-4xl sm:text-5xl xl:text-6xl">
              让你的简历与目标岗位之间，少一点噪音，多一点判断力
            </h1>
            <p class="home-copy page-copy mt-5 text-base sm:text-lg">
              基于 Multi-Agent 架构的智能优化流程，提取可验证的候选人事实，拆解 JD 重点，并把经历重写成更有针对性的表达。
            </p>
          </div>

          <aside class="home-hero__aside" aria-label="界面说明">
            <div class="home-note">
              <p class="home-note__label">工作方式</p>
              <p class="home-note__copy">上传原始简历、粘贴目标 JD，系统会生成一条更聚焦的优化流程，并保留完整执行轨迹。</p>
            </div>
            <div class="home-note home-note--compact">
              <span class="home-note__stat">可追踪</span>
              <span class="home-note__stat">可导出</span>
              <span class="home-note__stat">可回看</span>
            </div>
          </aside>
        </div>
      </section>

      <ResumeUploader />
    </div>
  </div>
</template>

<script setup>
import ResumeUploader from '../components/ResumeUploader.vue'
</script>

<style scoped>
.home-hero__grid {
  display: grid;
  gap: 2rem;
}

.home-hero__lead {
  max-width: 44rem;
}

.home-title {
  max-width: 16ch;
}

.home-copy {
  max-width: 38rem;
}

.home-hero__aside {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.home-note {
  padding: 1.2rem 1.25rem;
  border-radius: var(--radius-xl);
  border: 1px solid color-mix(in srgb, var(--color-border) 84%, white 16%);
  background: color-mix(in srgb, var(--color-bg-card) 84%, transparent 16%);
}

.home-note__label {
  color: var(--color-text-strong);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.home-note__copy {
  margin-top: 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.92rem;
  line-height: 1.8;
}

.home-note--compact {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.home-note__stat {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.38rem 0.85rem;
  border-radius: 9999px;
  background: var(--color-surface-muted);
  color: var(--color-text-main);
  font-size: 0.82rem;
  font-weight: 600;
}

@media (min-width: 1024px) {
  .home-hero__grid {
    grid-template-columns: minmax(0, 1.3fr) minmax(16rem, 0.7fr);
    align-items: end;
  }
}
</style>
