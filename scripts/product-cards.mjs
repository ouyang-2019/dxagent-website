export function renderProductCards(products, base) {
  return products.map((product, index) => `
          <article class="project-card" data-reveal>
            <div class="project-top">
              <span class="project-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
              <h3 class="project-title">${product.brand}</h3>
            </div>
            <p class="project-desc">${product.summary}</p>
            <ul class="tag-list" aria-label="产品能力">${product.tags.map(tag => `<li class="tag">${tag}</li>`).join('')}</ul>
            <a class="project-link" href="${base}${product.slug}/">访问${product.brand}官网 <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>
          </article>`).join('\n');
}
