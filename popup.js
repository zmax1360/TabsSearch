document.addEventListener('DOMContentLoaded', async () => {
  const tabs = await chrome.tabs.query({
    url: ['http://*/*', 'https://*/*'],
  })

  // Sort tabs alphabetically by title
  const collator = new Intl.Collator()
  tabs.sort((a, b) => collator.compare(a.title, b.title))

  const template = document.getElementById('li_template')
  const elements = new Set()

  for (const tab of tabs) {
    const element = template.content.firstElementChild.cloneNode(true)

    const title = tab.title.split('-')[0].trim()
    const pathname = new URL(tab.url).pathname.slice('/docs'.length)

    element.querySelector('.title').textContent = title
    element.querySelector('.pathname').textContent = pathname

    element.querySelector('a').addEventListener('click', async () => {
      await chrome.tabs.update(tab.id, { active: true })
      await chrome.windows.update(tab.windowId, { focused: true })
    })

    elements.add(element)
    const container = document.querySelector('.container')

    chrome.commands.onCommand.addListener((command) => {
      if (command === 'toggle-popup') {
        container.classList.toggle('hidden')
      }
    })
  }

  const searchInput = document.getElementById('searchInput')
  searchInput.addEventListener('input', updateTabList)

  updateTabList() // Display all tabs initially

  function updateTabList() {
    const searchTerm = searchInput.value.toLowerCase()
    const filteredTabs = tabs.filter((tab) =>
      tab.title.toLowerCase().includes(searchTerm)
    )
    displayTabs(filteredTabs)
  }

  function displayTabs(tabs) {
    const elements = new Set()
    for (const tab of tabs) {
      const element = template.content.firstElementChild.cloneNode(true)

      const title = tab.title.trim()
      const url = tab.url // Display the full URL
      // Set text content for title and pathname
      element.querySelector('.title').textContent = title
      element.querySelector('.pathname').textContent = url // Use 'url' instead of 'pathname'

      element.querySelector('a').addEventListener('click', async () => {
        await chrome.tabs.update(tab.id, { active: true })
        await chrome.windows.update(tab.windowId, { focused: true })
      })

      elements.add(element)
    }

    if (elements.size === 0) {
      // Display a message indicating no matching tabs
      const noResultsElement = document.createElement('li')
      noResultsElement.textContent = 'No matching tabs found.'
      elements.add(noResultsElement)
    }

    document.querySelector('ul').innerHTML = ''
    document.querySelector('ul').append(...elements)
  }

  const button = document.getElementById('groupTabsButton')
  button.addEventListener('click', async () => {
    const tabIds = tabs.map(({ id }) => id)
    if (tabIds.length) {
      const group = await chrome.tabs.group({ tabIds })
      await chrome.tabGroups.update(group, { title: 'DOCS' })
    }
  })
})
