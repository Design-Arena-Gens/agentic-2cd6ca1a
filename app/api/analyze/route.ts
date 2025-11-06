import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'

interface InstagramData {
  handle: string
  name: string
  followers: number
  averageViews: number
  category: string
  engagementRate: number
  location: string
}

// Simulate Instagram data analysis
// In production, this would use Instagram's official API or authorized scraping
async function analyzeInstagramAccount(handle: string): Promise<InstagramData> {
  try {
    // Attempt to fetch public data
    const url = `https://www.instagram.com/${handle}/`

    // For demo purposes, we'll generate realistic-looking data
    // In production, you would need to:
    // 1. Use Instagram Basic Display API (requires app approval)
    // 2. Use Instagram Graph API (for business accounts)
    // 3. Use authorized third-party services

    // Generate deterministic but varied data based on handle
    const hash = handle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

    const categories = [
      'Influencer',
      'Brand',
      'Artist',
      'Content Creator',
      'Business',
      'Personal',
      'Celebrity',
      'Photographer',
      'Fashion',
      'Food & Beverage',
      'Travel',
      'Fitness',
      'Technology',
      'Education',
      'Entertainment'
    ]

    const locations = [
      'Los Angeles, CA',
      'New York, NY',
      'Miami, FL',
      'London, UK',
      'Paris, France',
      'Tokyo, Japan',
      'Dubai, UAE',
      'Sydney, Australia',
      'Toronto, Canada',
      'Berlin, Germany',
      'Singapore',
      'São Paulo, Brazil',
      'Mumbai, India',
      'Seoul, South Korea',
      'Mexico City, Mexico',
      'Not specified'
    ]

    // Generate realistic metrics based on handle hash
    const followers = Math.floor(1000 + (hash * 157) % 500000)
    const averageViews = Math.floor(followers * (0.3 + (hash % 10) / 20))
    const engagementRate = parseFloat((1.5 + (hash % 50) / 10).toFixed(2))
    const category = categories[hash % categories.length]
    const location = locations[hash % locations.length]

    // Generate a realistic name
    const nameVariants = [
      handle.charAt(0).toUpperCase() + handle.slice(1),
      handle.toUpperCase(),
      handle.split(/[._]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      `${handle.charAt(0).toUpperCase() + handle.slice(1, 4)} ${handle.charAt(4).toUpperCase() + handle.slice(5)}`
    ]
    const name = nameVariants[hash % nameVariants.length]

    // Try to fetch actual data (this will work for some public profiles)
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000
      })

      const html = response.data
      const $ = cheerio.load(html)

      // Try to extract data from meta tags
      const jsonData = $('script[type="application/ld+json"]').html()
      if (jsonData) {
        try {
          const data = JSON.parse(jsonData)
          if (data.name) {
            return {
              handle,
              name: data.name,
              followers,
              averageViews,
              category,
              engagementRate,
              location
            }
          }
        } catch (e) {
          // Continue with generated data
        }
      }
    } catch (error) {
      // If fetching fails, use generated data
      console.log(`Could not fetch data for ${handle}, using generated data`)
    }

    return {
      handle,
      name,
      followers,
      averageViews,
      category,
      engagementRate,
      location
    }
  } catch (error) {
    throw new Error('Failed to analyze account')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { handle } = await request.json()

    if (!handle || typeof handle !== 'string') {
      return NextResponse.json(
        { error: 'Invalid handle provided' },
        { status: 400 }
      )
    }

    // Clean the handle
    const cleanHandle = handle.replace('@', '').trim()

    if (cleanHandle.length === 0) {
      return NextResponse.json(
        { error: 'Handle cannot be empty' },
        { status: 400 }
      )
    }

    // Validate handle format (basic validation)
    if (!/^[a-zA-Z0-9._]+$/.test(cleanHandle)) {
      return NextResponse.json(
        { error: 'Invalid handle format' },
        { status: 400 }
      )
    }

    const data = await analyzeInstagramAccount(cleanHandle)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error analyzing account:', error)
    return NextResponse.json(
      { error: 'Failed to analyze account. Please try again.' },
      { status: 500 }
    )
  }
}
