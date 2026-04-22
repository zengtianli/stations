// AUTO-GENERATED canonical filter/search engine for static stations (cmds/stack/logs).
// Regenerate consumers via generate.py copying from ~/Dev/devtools/lib/templates/site-filter.js
// Audit: menus.py `static-sites-filter-drift`
(function () {
  "use strict"

  function matchSearch(card, query, searchAttrs) {
    if (!query) return true
    const q = query.toLowerCase()
    for (const attr of searchAttrs) {
      const v = card.dataset[attr]
      if (v && v.toLowerCase().includes(q)) return true
    }
    return false
  }

  function matchGroup(card, group, activeKey) {
    if (!activeKey || activeKey === "all") return true
    const attr = group.cardAttr.replace(/^data-/, "")
    return card.dataset[attr] === activeKey
  }

  function apply(config, hiddenClass) {
    const q = config.searchInput ? config.searchInput.value.trim() : ""
    const activeKeys = config.filterGroups.map((g) => g._active || "all")
    config.cards.forEach((card) => {
      const pass =
        matchSearch(card, q, config.searchAttrs || []) &&
        config.filterGroups.every((g, i) => matchGroup(card, g, activeKeys[i]))
      card.classList.toggle(hiddenClass, !pass)
    })
    // Hide empty sections
    if (config.sectionSelector) {
      document.querySelectorAll(config.sectionSelector).forEach((sec) => {
        const any = sec.querySelector(`:scope .${config.cardClass || "tlz-card"}:not(.${hiddenClass})`)
        sec.classList.toggle(hiddenClass, !any)
      })
    }
  }

  function initSiteFilter(config) {
    const hiddenClass = config.hiddenClass || "tlz-hidden"
    ;(config.filterGroups || []).forEach((group) => {
      group._active = "all"
      ;(group.buttons || []).forEach((btn) => {
        btn.addEventListener("click", () => {
          group._active = btn.dataset.filter || "all"
          ;(group.buttons || []).forEach((b) => b.classList.toggle("active", b === btn))
          apply(config, hiddenClass)
        })
      })
    })
    if (config.searchInput) {
      config.searchInput.addEventListener("input", () => apply(config, hiddenClass))
    }
    if (config.keyboard) {
      document.addEventListener("keydown", (e) => {
        if (e.key === config.keyboard.searchFocus && config.searchInput && document.activeElement !== config.searchInput) {
          e.preventDefault()
          config.searchInput.focus()
        } else if (e.key === config.keyboard.clear && config.searchInput) {
          config.searchInput.value = ""
          apply(config, hiddenClass)
        }
      })
    }
    apply(config, hiddenClass)
    return {
      destroy() {
        // Passive: listeners are bound to buttons/inputs directly
      },
    }
  }

  window.initSiteFilter = initSiteFilter
})()
