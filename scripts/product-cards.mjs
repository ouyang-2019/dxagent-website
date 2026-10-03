const arrow = '<svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';

// Original diagrams of product concepts. They contain no actual customer data.
const covers = {
  aubeau: '<path class="art-dim" d="M90 70 30 25m60 45 60-45M90 70 30 115m60-45 60 45M30 25h120M30 115h120"/><circle class="art-line art-glow" cx="90" cy="70" r="22"/><circle class="art-paper" cx="30" cy="25" r="13"/><circle class="art-paper" cx="150" cy="25" r="13"/><circle class="art-paper" cx="30" cy="115" r="13"/><circle class="art-paper" cx="150" cy="115" r="13"/><path class="art-line" d="m80 70 8 8 13-16"/><circle class="art-fill" cx="30" cy="25" r="4"/><circle class="art-fill" cx="150" cy="115" r="4"/>',
  'super-lovart': '<rect class="art-paper" x="18" y="16" width="75" height="105" rx="5" transform="rotate(-8 55 68)"/><rect class="art-line" x="89" y="23" width="75" height="102" rx="5" transform="rotate(8 126 74)" fill="#101b1b"/><ellipse class="art-fill art-glow" cx="126" cy="70" rx="20" ry="31" transform="rotate(28 126 70)"/><ellipse cx="126" cy="70" rx="10" ry="20" transform="rotate(28 126 70)" fill="#101b1b"/><path class="art-line" d="m27 93 15-39 16 43 12-20 10 23M30 33h37"/><circle class="art-fill" cx="68" cy="48" r="7"/>',
  xuanjian: '<circle class="art-dim" cx="90" cy="70" r="61"/><circle class="art-line" cx="90" cy="70" r="44"/><path class="art-dim" d="M90 9v122M29 70h122M47 27l86 86M47 113l86-86"/><circle cx="90" cy="70" r="21" fill="#171d25" stroke="currentColor"/><path class="art-line art-glow" d="M90 49c-22 0-22 21 0 21s22 21 0 21"/><circle class="art-fill" cx="90" cy="60" r="3"/><circle class="art-fill" cx="90" cy="80" r="3"/>',
  'ai-cosmetics': '<rect class="art-paper" x="28" y="15" width="125" height="110" rx="8"/><path class="art-dim" d="M40 45h102M40 70h102M40 94h102M40 112h102M78 45v67M115 45v67"/><path class="art-line" d="M41 31h44M41 57h23M41 82h23M41 104h23M88 57h17M88 82h17M88 104h17"/><circle class="art-fill" cx="131" cy="58" r="4"/><circle class="art-line" cx="131" cy="82" r="4"/><path class="art-line" d="m124 104 5 5 9-10"/>',
  shortdrama: '<rect class="art-paper" x="10" y="28" width="48" height="65" rx="5"/><rect class="art-paper" x="66" y="28" width="48" height="65" rx="5"/><rect class="art-paper" x="122" y="28" width="48" height="65" rx="5"/><path class="art-line" d="m22 78 12-28 12 28m31 0 12-28 12 28m32 0 12-28 12 28M10 109h160"/><path class="art-line art-glow" d="M10 109h97" stroke-width="3"/><path class="art-line" d="M107 101v16"/><circle class="art-fill" cx="34" cy="40" r="3"/><circle class="art-fill" cx="90" cy="40" r="3"/><circle class="art-fill" cx="146" cy="40" r="3"/>',
  fragrance: '<path class="art-dim" d="M12 23v91h156M12 91h156M12 68h156M12 45h156"/><path class="art-line art-glow" d="M12 114h15l7-17 6 17h8l6-63 5 63h17l7-91 7 91h18l6-36 6 36h15l7-61 7 61h19" stroke-width="2"/><path class="art-dim" d="M83 23v91M54 51v63M142 53v61" stroke-dasharray="3 4"/><circle class="art-fill" cx="83" cy="23" r="4"/>',
};

export function renderCover(slug) {
  return `<div class="cover-art" aria-hidden="true"><svg viewBox="0 0 180 140" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${covers[slug] ?? covers.aubeau}</svg></div>`;
}

export function renderProductMap(products) {
  return products.map(product => `<a class="map-project" data-product="${product.slug}" href="https://projects.dxagent.cloud/${product.slug}/">${renderCover(product.slug)}<span class="map-project-name">${product.brand}</span><span class="map-project-type">${product.name}</span></a>`).join('\n');
}

export function renderProductCards(products, base) {
  return products.map((product, index) => `
          <article class="project-card product-card" data-product="${product.slug}" data-reveal>
            ${renderCover(product.slug)}
            <div class="product-card-body">
              <p class="product-category">${product.name}</p>
              <div class="project-top">
                <span class="project-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
                <h3 class="project-title">${product.brand}</h3>
              </div>
              <p class="project-desc">${product.summary}</p>
              <ul class="tag-list" aria-label="产品能力">${product.tags.map(tag => `<li class="tag">${tag}</li>`).join('')}</ul>
              <a class="project-link" href="${base}${product.slug}/">了解${product.brand} ${arrow}</a>
            </div>
          </article>`).join('\n');
}
