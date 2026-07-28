'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, LayoutList, Users } from 'lucide-react'
import ItemRow from './ItemRow'
import ItemDetailsModal from '../../../components/ItemDetailsModal'
import { logActivity } from '../../../lib/audit'

function buildTree(items) {
  const sorted = [...items].sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0) })
  const byId = {}
  sorted.forEach(function (i) { byId[i.id] = { ...i, children: [] } })
  const top = []
  sorted.forEach(function (i) {
    if (i.parent_id && byId[i.parent_id]) byId[i.parent_id].children.push(byId[i.id])
    else if (!i.parent_id) top.push(byId[i.id])
  })
  return top
}

export default function ChecklistView({ pillId, initialSections, isAdmin }) {
  const supabase = createClient()
  const router = useRouter()
  const [newSectionLabel, setNewSectionLabel] = useState('')
  const [addingSection, setAddingSection] = useState(false)
  const [newItemLabel, setNewItemLabel] = useState({})
  const [addingItemFor, setAddingItemFor] = useState(null)
  const [collapsed, setCollapsed] = useState({})
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState('sections')
  const [editingItem, setEditingItem] = useState(null)
  const [busy, setBusy] = useState(false)
  const [categories, setCategories] = useState([])

  const loadCategories = useCallback(async function () {
    const { data } = await supabase.from('checklist_categories').select('*').order('name')
    setCategories(data || [])
  }, [])

  useEffect(function () { loadCategories() }, [loadCategories])

  function toggleCollapse(key) {
    setCollapsed(function (prev) { return { ...prev, [key]: !prev[key] } })
  }

  async function addSection() {
    if (!newSectionLabel.trim()) return
    setBusy(true)
    const { error } = await supabase.from('sections').insert({ pill_id: pillId, label: newSectionLabel.trim(), sort_order: initialSections.length })
    setBusy(false)
    if (error) { alert('Error: ' + error.message); return }
    await logActivity(supabase, 'section_added', { name: newSectionLabel.trim() })
    setNewSectionLabel(''); setAddingSection(false)
    router.refresh()
  }

  async function renameSection(section) {
    const label = prompt('Rename section:', section.label)
    if (!label || !label.trim() || label.trim() === section.label) return
    const { error } = await supabase.from('sections').update({ label: label.trim() }).eq('id', section.id)
    if (error) { alert('Error: ' + error.message); return }
    await logActivity(supabase, 'section_renamed', { name: label.trim() })
    router.refresh()
  }

  async function deleteSection(section) {
    if (!confirm(`Delete "${section.label}" and all its items?`)) return
    const { error } = await supabase.from('sections').delete().eq('id', section.id)
    if (error) { alert('Error: ' + error.message); return }
    await logActivity(supabase, 'section_deleted', { name: section.label })
    router.refresh()
  }

  async function addItem(sectionId) {
    const text = (newItemLabel[sectionId] || '').trim()
    if (!text) return
    setBusy(true)
    const { error } = await supabase.from('checklist_items').insert({ section_id: sectionId, label: text })
    setBusy(false)
    if (error) { alert('Error: ' + error.message); return }
    await logActivity(supabase, 'item_added', { label: text })
    setNewItemLabel(function (prev) { return { ...prev, [sectionId]: '' } })
    setAddingItemFor(null)
    router.refresh()
  }

  function sectionStats(flatItems) {
    const topLevel = flatItems.filter(function (i) { return !i.parent_id })
    const total = topLevel.length
    const done = topLevel.filter(function (i) { return i.checked }).length
    return { total: total, done: done, pct: total ? Math.round((done / total) * 100) : 0 }
  }

  function applyFilter(tree) {
    if (filter === 'complied') return tree.filter(function (i) { return i.checked })
    if (filter === 'notcomplied') return tree.filter(function (i) { return !i.checked })
    return tree
  }

  function buildCategoryGroups() {
    const groups = {}
    initialSections.forEach(function (section) {
      (section.checklist_items || []).filter(function (i) { return !i.parent_id }).forEach(function (item) {
        const key = item.category || 'Unassigned'
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      })
    })
    return Object.entries(groups).sort(function (a, b) {
      if (a[0] === 'Unassigned') return 1
      if (b[0] === 'Unassigned') return -1
      return a[0].localeCompare(b[0])
    })
  }

  const categoryGroups = viewMode === 'category' ? buildCategoryGroups() : []

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="flex bg-[#F0EAF0] rounded-lg p-1">
          {[{ key: 'all', label: 'All' }, { key: 'complied', label: 'Complied' }, { key: 'notcomplied', label: 'Not Complied' }].map(function (f) {
            return (
              <button key={f.key} onClick={function () { setFilter(f.key) }} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === f.key ? 'bg-white text-[#0f3d28] shadow-sm' : 'text-[#6C6080]'}`}>
                {f.label}
              </button>
            )
          })}
        </div>

        <div className="flex bg-[#F0EAF0] rounded-lg p-1">
          <button onClick={function () { setViewMode('sections') }} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'sections' ? 'bg-white text-[#0f3d28] shadow-sm' : 'text-[#6C6080]'}`}>
            <LayoutList size={13} /> Sections
          </button>
          <button onClick={function () { setViewMode('category') }} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'category' ? 'bg-white text-[#0f3d28] shadow-sm' : 'text-[#6C6080]'}`}>
            <Users size={13} /> By Category
          </button>
        </div>

        {isAdmin && viewMode === 'sections' && (
          <button onClick={function () { setAddingSection(true) }} className="flex items-center gap-1.5 px-3.5 py-2 border border-[#ddd] rounded-lg text-xs font-semibold text-[#0f3d28] hover:bg-[#F5FAF6]">
            <Plus size={13} /> Section
          </button>
        )}
      </div>

      {addingSection && viewMode === 'sections' && (
        <div className="flex gap-2 mb-5">
          <input autoFocus placeholder="New section name..." value={newSectionLabel} onChange={function (e) { setNewSectionLabel(e.target.value) }} onKeyDown={function (e) { if (e.key === 'Enter') addSection() }} className="flex-1 border border-[#ddd] rounded-lg px-3 py-2 text-sm" />
          <button onClick={addSection} disabled={busy} className="px-4 py-2 bg-[#0f3d28] text-white rounded-lg text-sm font-semibold">Add</button>
          <button onClick={function () { setAddingSection(false); setNewSectionLabel('') }} className="px-4 py-2 border border-[#ddd] rounded-lg text-sm">Cancel</button>
        </div>
      )}

      {viewMode === 'sections' && (
        <div className="space-y-4">
          {initialSections.map(function (section, idx) {
            const flatItems = section.checklist_items || []
            const tree = applyFilter(buildTree(flatItems))
            const stats = sectionStats(flatItems)
            const isCollapsed = !!collapsed[section.id]

            return (
              <div key={section.id} className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-[#0f3d28]">
                  <button onClick={function () { toggleCollapse(section.id) }} className="text-white/70 hover:text-white">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <span className="w-6 h-6 rounded-md bg-white/15 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                  <span className="text-white font-semibold text-[13.5px] flex-1">{section.label}</span>
                  <span className="text-white/70 text-xs">{stats.done}/{stats.total}</span>
                  <div className="w-24 bg-white/15 rounded-full h-1.5 overflow-hidden hidden sm:block">
                    <div className="h-full bg-white rounded-full" style={{ width: `${stats.pct}%` }} />
                  </div>
                  <span className="text-white font-bold text-xs w-9 text-right">{stats.pct}%</span>
                  {isAdmin && (
                    <div className="flex items-center gap-1 ml-1">
                      <button onClick={function () { renameSection(section) }} className="text-white/60 hover:text-white"><Pencil size={13} /></button>
                      <button onClick={function () { deleteSection(section) }} className="text-white/60 hover:text-white"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <>
                    {tree.length === 0 && <div className="px-4 py-6 text-center text-[#999] text-xs">No items{filter !== 'all' ? ' match this filter' : ' yet'}.</div>}
                    {tree.map(function (item) {
                      return <ItemRow key={item.id} item={item} onEdit={setEditingItem} categories={categories} />
                    })}

                    {isAdmin && (
                      addingItemFor === section.id ? (
                        <div className="flex gap-2 px-4 py-3 bg-[#FAFAF8]">
                          <input autoFocus placeholder="Item name..." value={newItemLabel[section.id] || ''} onChange={function (e) { setNewItemLabel(function (prev) { return { ...prev, [section.id]: e.target.value } }) }} onKeyDown={function (e) { if (e.key === 'Enter') addItem(section.id) }} className="flex-1 border border-[#ddd] rounded-lg px-3 py-1.5 text-sm" />
                          <button onClick={function () { addItem(section.id) }} disabled={busy} className="px-3 py-1.5 bg-[#0f3d28] text-white rounded-lg text-xs font-semibold">Add</button>
                          <button onClick={function () { setAddingItemFor(null) }} className="px-3 py-1.5 border border-[#ddd] rounded-lg text-xs">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={function () { setAddingItemFor(section.id) }} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#0f3d28] hover:bg-[#F5FAF6] border-t border-[#f2f2f0]">
                          <Plus size={13} /> Add Item
                        </button>
                      )
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'category' && (
        <div className="space-y-4">
          {categoryGroups.length === 0 && <div className="bg-white rounded-2xl border border-[#e5e5e0] p-10 text-center text-[#888] text-sm">No items in this checklist yet.</div>}
          {categoryGroups.map(function (entry) {
            const category = entry[0]
            const allItems = entry[1]
            const items = applyFilter(allItems)
            const total = allItems.length
            const done = allItems.filter(function (i) { return i.checked }).length
            const pct = total ? Math.round((done / total) * 100) : 0
            const isCollapsed = !!collapsed['cat-' + category]
            const catObj = categories.find(function (c) { return c.name === category })

            return (
              <div key={category} className="bg-white rounded-2xl border border-[#e5e5e0] shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3" style={{ background: catObj ? catObj.color : '#0f3d28' }}>
                  <button onClick={function () { toggleCollapse('cat-' + category) }} className="text-white/70 hover:text-white">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <span className="text-white font-semibold text-[13.5px] flex-1">{category}</span>
                  <span className="text-white/70 text-xs">{done}/{total}</span>
                  <div className="w-24 bg-white/15 rounded-full h-1.5 overflow-hidden hidden sm:block">
                    <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-white font-bold text-xs w-9 text-right">{pct}%</span>
                </div>
                {!isCollapsed && (
                  items.length === 0
                    ? <div className="px-4 py-6 text-center text-[#999] text-xs">No items match this filter.</div>
                    : items.map(function (item) { return <ItemRow key={item.id} item={item} onEdit={setEditingItem} categories={categories} /> })
                )}
              </div>
            )
          })}
        </div>
      )}

      {editingItem && (
        <ItemDetailsModal
          item={editingItem}
          categories={categories}
          onCategoriesChange={loadCategories}
          onClose={function () { setEditingItem(null) }}
        />
      )}
    </div>
  )
}