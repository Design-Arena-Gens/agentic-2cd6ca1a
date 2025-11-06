'use client'

import { useState } from 'react'
import { Search, Download, Loader2, Trash2, Plus } from 'lucide-react'
import Papa from 'papaparse'

interface InstagramData {
  handle: string
  name: string
  followers: number
  averageViews: number
  category: string
  engagementRate: number
  location: string
  status?: 'loading' | 'success' | 'error'
  error?: string
}

export default function Home() {
  const [handles, setHandles] = useState<string[]>([''])
  const [results, setResults] = useState<InstagramData[]>([])
  const [loading, setLoading] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InstagramData
    direction: 'asc' | 'desc'
  } | null>(null)

  const addHandleInput = () => {
    setHandles([...handles, ''])
  }

  const removeHandleInput = (index: number) => {
    const newHandles = handles.filter((_, i) => i !== index)
    setHandles(newHandles.length === 0 ? [''] : newHandles)
  }

  const updateHandle = (index: number, value: string) => {
    const newHandles = [...handles]
    newHandles[index] = value.replace('@', '').trim()
    setHandles(newHandles)
  }

  const analyzeAccounts = async () => {
    const validHandles = handles.filter(h => h.trim() !== '')
    if (validHandles.length === 0) return

    setLoading(true)
    const newResults: InstagramData[] = []

    for (const handle of validHandles) {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ handle }),
        })

        const data = await response.json()

        if (response.ok) {
          newResults.push({ ...data, status: 'success' })
        } else {
          newResults.push({
            handle,
            name: 'N/A',
            followers: 0,
            averageViews: 0,
            category: 'N/A',
            engagementRate: 0,
            location: 'N/A',
            status: 'error',
            error: data.error || 'Failed to fetch data'
          })
        }
      } catch (error) {
        newResults.push({
          handle,
          name: 'N/A',
          followers: 0,
          averageViews: 0,
          category: 'N/A',
          engagementRate: 0,
          location: 'N/A',
          status: 'error',
          error: 'Network error'
        })
      }
    }

    setResults(newResults)
    setLoading(false)
  }

  const sortData = (key: keyof InstagramData) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const getSortedResults = () => {
    if (!sortConfig) return results

    return [...results].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()

      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  const exportToCSV = () => {
    const csvData = results.map(r => ({
      Handle: r.handle,
      Name: r.name,
      Followers: r.followers,
      'Average Views': r.averageViews,
      Category: r.category,
      'Engagement Rate (%)': r.engagementRate,
      Location: r.location
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `instagram-analysis-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const exportToExcel = () => {
    const data = results.map(r => ({
      Handle: r.handle,
      Name: r.name,
      Followers: r.followers,
      'Average Views': r.averageViews,
      Category: r.category,
      'Engagement Rate (%)': r.engagementRate,
      Location: r.location
    }))

    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `instagram-analysis-${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const SortIcon = ({ columnKey }: { columnKey: keyof InstagramData }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <span className="ml-1 text-gray-400">↕</span>
    }
    return <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Instagram Analyzer
          </h1>
          <p className="text-xl text-gray-600">
            Analyze Instagram accounts and compare metrics side by side
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              Enter Instagram Handles
            </label>
            <div className="space-y-3">
              {handles.map((handle, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                      @
                    </span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => updateHandle(index, e.target.value)}
                      placeholder="username"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') analyzeAccounts()
                      }}
                    />
                  </div>
                  {handles.length > 1 && (
                    <button
                      onClick={() => removeHandleInput(index)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={24} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addHandleInput}
              className="mt-4 flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              <Plus size={20} />
              Add Another Handle
            </button>
          </div>

          <button
            onClick={analyzeAccounts}
            disabled={loading || handles.every(h => h.trim() === '')}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Analyzing...
              </>
            ) : (
              <>
                <Search size={24} />
                Analyze Accounts
              </>
            )}
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Analysis Results ({results.length})
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <Download size={20} />
                  Export CSV
                </button>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Download size={20} />
                  Export Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th
                      onClick={() => sortData('handle')}
                      className="text-left py-4 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                    >
                      Handle <SortIcon columnKey="handle" />
                    </th>
                    <th
                      onClick={() => sortData('name')}
                      className="text-left py-4 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                    >
                      Name <SortIcon columnKey="name" />
                    </th>
                    <th
                      onClick={() => sortData('followers')}
                      className="text-left py-4 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                    >
                      Followers <SortIcon columnKey="followers" />
                    </th>
                    <th
                      onClick={() => sortData('averageViews')}
                      className="text-left py-4 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                    >
                      Avg Views <SortIcon columnKey="averageViews" />
                    </th>
                    <th
                      onClick={() => sortData('category')}
                      className="text-left py-4 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                    >
                      Category <SortIcon columnKey="category" />
                    </th>
                    <th
                      onClick={() => sortData('engagementRate')}
                      className="text-left py-4 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                    >
                      Engagement <SortIcon columnKey="engagementRate" />
                    </th>
                    <th
                      onClick={() => sortData('location')}
                      className="text-left py-4 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                    >
                      Location <SortIcon columnKey="location" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedResults().map((result, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-medium text-purple-600">@{result.handle}</span>
                        {result.status === 'error' && (
                          <span className="block text-xs text-red-500 mt-1">
                            {result.error}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">{result.name}</td>
                      <td className="py-4 px-4 font-semibold">
                        {formatNumber(result.followers)}
                      </td>
                      <td className="py-4 px-4">{formatNumber(result.averageViews)}</td>
                      <td className="py-4 px-4">
                        <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          {result.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-green-600">
                        {result.engagementRate.toFixed(2)}%
                      </td>
                      <td className="py-4 px-4">{result.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
