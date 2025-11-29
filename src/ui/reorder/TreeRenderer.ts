/* eslint-disable @typescript-eslint/no-explicit-any */
export const renderSimpleTree = (forest: any[], opts?: { showBasename?: boolean }) => {
  const wrap = document.createElement('div')
  const ul = document.createElement('ul')

  ul.style.listStyle = 'none'
  ul.style.paddingLeft = '12px'

  const build = (nodes: any[], parentUl: HTMLUListElement) => {
    for (const n of nodes) {
      const li = document.createElement('li')
      li.dataset.id = n.id
      li.className = 'zk-node-li'
      const title = document.createElement('div')
      title.className = 'zk-node-title'
      title.textContent = n.id + (opts?.showBasename && n.basename ? ` — ${n.basename}` : '')
      li.appendChild(title)
      const childUl = document.createElement('ul')
      childUl.style.listStyle = 'none'
      childUl.style.paddingLeft = '12px'
      if (n.children?.length) build(n.children, childUl)
      li.appendChild(childUl)
      parentUl.appendChild(li)
    }
  }
  build(forest, ul)
  wrap.appendChild(ul)
  return wrap
}
